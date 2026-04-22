import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub as string;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse optional filter from body
    const body = await req.json().catch(() => ({}));
    const emailFilter: string[] | undefined = body.emails; // optionally send to specific emails only

    // Get all users who were imported (have imported: true in metadata)
    const { data: allUsers, error: listError } =
      await adminClient.auth.admin.listUsers({ perPage: 1000 });

    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const importedUsers = allUsers.users.filter((u) => {
      const isImported = u.user_metadata?.imported === true;
      if (emailFilter && emailFilter.length > 0) {
        return isImported && emailFilter.includes(u.email!);
      }
      return isImported;
    });

    const results: Array<{ email: string; status: string; error?: string }> = [];

    for (const user of importedUsers) {
      try {
        // generateLink with type "recovery" sends a real password reset email
        // via Supabase's built-in email system — no external mail server needed
        const { error: resetError } =
          await adminClient.auth.admin.generateLink({
            type: "recovery",
            email: user.email!,
            options: {
              redirectTo: `https://ai-specialist-demos.lovable.app/`,
            },
          });

        if (resetError) {
          results.push({
            email: user.email!,
            status: "error",
            error: resetError.message,
          });
        } else {
          results.push({ email: user.email!, status: "invite_sent" });
        }
      } catch (err) {
        results.push({
          email: user.email!,
          status: "error",
          error: String(err),
        });
      }
    }

    const sent = results.filter((r) => r.status === "invite_sent").length;
    const errors = results.filter((r) => r.status === "error").length;

    return new Response(
      JSON.stringify({
        summary: { total: importedUsers.length, sent, errors },
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
