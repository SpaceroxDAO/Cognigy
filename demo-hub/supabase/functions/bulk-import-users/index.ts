import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyAdmin(req: Request, supabaseAdmin: any): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  const { data: roleCheck } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'user-manager'])
    .maybeSingle();
  return roleCheck ? user.id : null;
}

interface ImportUser {
  email: string;
  role: string;
  userType: string;
}

interface ImportResult {
  email: string;
  role: string;
  userType: string;
  status: 'created' | 'skipped' | 'error';
  tempPassword?: string;
  resetLink?: string;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const adminId = await verifyAdmin(req, supabaseAdmin);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { users, origin } = await req.json() as { users: ImportUser[]; origin?: string };

    if (!Array.isArray(users) || users.length === 0) {
      return new Response(JSON.stringify({ error: 'No users provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (users.length > 500) {
      return new Response(JSON.stringify({ error: 'Maximum 500 users per import' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: ImportResult[] = [];
    const siteOrigin = origin || 'https://ai-specialist-demos.lovable.app';

    for (const u of users) {
      const result: ImportResult = {
        email: u.email,
        role: u.role || 'user',
        userType: u.userType || 'Other',
        status: 'error',
      };

      try {
        // Generate temp password
        const tempPassword = crypto.randomUUID().slice(0, 12) + 'Aa1!';

        // Create auth user
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { display_name: u.email.split('@')[0], imported: true },
        });

        if (createError) {
          if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
            result.status = 'skipped';
            result.error = 'User already exists';
            results.push(result);
            continue;
          }
          throw createError;
        }

        const userId = userData.user.id;

        // Update profile with onboarding flags (handle_new_user trigger already created base profile)
        await supabaseAdmin.from('profiles').update({
          user_type: u.userType || 'Other',
          force_password_reset: true,
          force_security_setup: true,
          temp_password_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        }).eq('user_id', userId);

        // Set role (trigger already inserted 'user' role, update if different)
        if (u.role && u.role !== 'user') {
          await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
          await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: u.role });
        }

        // Generate recovery link for reset URL
        let resetLink = '';
        try {
          const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: u.email,
          });
          if (linkData?.properties?.hashed_token) {
            resetLink = `${siteOrigin}/reset-password?token=${encodeURIComponent(linkData.properties.hashed_token)}&email=${encodeURIComponent(u.email)}`;
          }
        } catch {
          // Non-fatal — admin can use temp password instead
        }

        result.status = 'created';
        result.tempPassword = tempPassword;
        result.resetLink = resetLink;
      } catch (err: any) {
        result.status = 'error';
        result.error = err.message || 'Unknown error';
      }

      results.push(result);
    }

    const summary = {
      total: results.length,
      created: results.filter(r => r.status === 'created').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    };

    return new Response(JSON.stringify({ summary, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
