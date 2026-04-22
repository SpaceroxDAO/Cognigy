import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const { email, adminMode } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If adminMode, require admin auth
    if (adminMode) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
      if (callerError || !caller) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleCheck } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleCheck) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Self-service: only allow for users that exist in the system
      // We don't require auth, but we verify the user exists
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;

      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        // Return success anyway to avoid user enumeration
        return new Response(JSON.stringify({ success: true, message: "If this email is registered, a setup link has been generated." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Generate a recovery link and extract the OTP token
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (linkError) throw linkError;

    // If admin-initiated, also flag the user for forced password reset
    if (adminMode) {
      // Find the user to get their ID
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (!listError) {
        const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (targetUser) {
          await adminClient
            .from("profiles")
            .update({
              force_password_reset: true,
              temp_password_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            })
            .eq("user_id", targetUser.id);
        }
      }
    }

    // Return the OTP token and email so the client can build a bot-safe URL
    const otp = linkData?.properties?.email_otp;

    return new Response(JSON.stringify({ success: true, otp, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
