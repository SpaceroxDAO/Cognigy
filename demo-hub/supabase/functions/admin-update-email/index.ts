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
  const { data: roleCheck } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).in('role', ['admin']).maybeSingle();
  return roleCheck ? user.id : null;
}

async function verifyReadAccess(req: Request, supabaseAdmin: any): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  const { data: roles } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).in('role', ['admin', 'sales-manager', 'user-manager']);
  return roles && roles.length > 0 ? user.id : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json();
    const { action, oldEmail, newEmail, email, role, userType, displayName, password, userId: bodyUserId, field, value } = body;

    // list_users can be accessed by admin, sales-manager, or user-manager
    if (action === 'list_users') {
      const readAccessId = await verifyReadAccess(req, supabaseAdmin);
      if (!readAccessId) {
        return new Response(JSON.stringify({ error: 'Access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Admin-only actions require admin auth
    const adminOnlyActions = ['delete_user', 'force_reset', 'update_role', 'update_user_type', 'create', 'update_email', 'update_profile_field'];
    if (adminOnlyActions.includes(action)) {
      const adminId = await verifyAdmin(req, supabaseAdmin);
      if (!adminId) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'create') {
      // Create a new user account
      const tempPassword = crypto.randomUUID() + 'Aa1!';
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { display_name: displayName || email.split('@')[0], imported: true },
      });
      if (createError) throw createError;

      const userId = userData.user.id;

      // Insert profile
      await supabaseAdmin.from('profiles').insert({
        user_id: userId,
        display_name: displayName || email.split('@')[0],
        user_type: userType || 'Other',
        force_password_reset: true,
        temp_password_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });

      // Set role
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
      await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: role || 'user' });

      return new Response(JSON.stringify({ success: true, userId, email }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'set_password') {
      // Read password from secret, not from request body
      const password = Deno.env.get('TEMP_ADMIN_PASSWORD');
      if (!password) throw new Error('TEMP_ADMIN_PASSWORD secret not set');

      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;

      const user = users.find(u => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: `No user found with email: ${email}` }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, userId: data.user.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_email') {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;

      const user = users.find(u => u.email === oldEmail);
      if (!user) {
        return new Response(JSON.stringify({ error: `No user found with email: ${oldEmail}` }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email: newEmail });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, userId: data.user.id, newEmail: data.user.email }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list_users') {
      // Paginate through all users (Supabase Auth returns max 1000 per page)
      const allUsers: any[] = [];
      let page = 1;
      while (true) {
        const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000, page });
        if (listError) throw listError;
        allUsers.push(...data.users);
        if (data.users.length < 1000) break;
        page++;
      }
      const users = allUsers;

      const userIds = users.map(u => u.id);
      const [profilesRes, rolesRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('user_id, user_type, force_password_reset').in('user_id', userIds),
        supabaseAdmin.from('user_roles').select('user_id, role').in('user_id', userIds),
      ]);

      const profileMap = Object.fromEntries((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const roleMap: Record<string, string[]> = {};
      for (const r of (rolesRes.data || [])) {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      }

      const result = users.map(u => ({
        id: u.id,
        email: u.email,
        lastLogin: u.last_sign_in_at,
        userType: profileMap[u.id]?.user_type || 'Other',
        forcePasswordReset: profileMap[u.id]?.force_password_reset || false,
        roles: roleMap[u.id] || ['user'],
        role: (roleMap[u.id] || ['user']).includes('admin') ? 'admin' : (roleMap[u.id] || ['user'])[0] || 'user',
      }));

      return new Response(JSON.stringify({ users: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_user') {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;
      const target = users.find(u => u.email === email);
      if (!target) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { error } = await supabaseAdmin.auth.admin.deleteUser(target.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'force_reset') {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;
      const target = users.find(u => u.email === email);
      if (!target) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { error } = await supabaseAdmin.auth.admin.updateUserById(target.id, { password });
      if (error) throw error;
      await supabaseAdmin.from('profiles').update({
        force_password_reset: true,
        temp_password_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      }).eq('user_id', target.id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_role') {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;
      const target = users.find(u => u.email === email);
      if (!target) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      await supabaseAdmin.from('user_roles').delete().eq('user_id', target.id);
      await supabaseAdmin.from('user_roles').insert({ user_id: target.id, role });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_user_type') {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;
      const target = users.find(u => u.email === email);
      if (!target) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      await supabaseAdmin.from('profiles').update({ user_type: userType }).eq('user_id', target.id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_profile_field') {
      const allowedFields = ['temp_password_expires_at'];
      if (!allowedFields.includes(field)) {
        return new Response(JSON.stringify({ error: `Field '${field}' is not allowed` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await supabaseAdmin.from('profiles').update({ [field]: value }).eq('user_id', bodyUserId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


