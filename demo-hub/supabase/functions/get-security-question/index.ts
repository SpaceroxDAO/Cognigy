import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOCKOUT_MINUTES = 15;

async function checkLockout(adminClient: any, email: string): Promise<{ locked: boolean; minutesRemaining?: number }> {
  const normalizedEmail = email.toLowerCase();
  const { data: attempt } = await adminClient
    .from("security_attempts")
    .select("attempt_count, locked_until")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!attempt) return { locked: false };

  if (attempt.locked_until) {
    const lockedUntil = new Date(attempt.locked_until);
    if (lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      return { locked: true, minutesRemaining };
    }
    // Lockout expired — reset
    await adminClient
      .from("security_attempts")
      .update({ attempt_count: 0, locked_until: null, last_attempt_at: new Date().toISOString() })
      .eq("email", normalizedEmail);
  }

  return { locked: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const { email, sendResetIfNoQuestions } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check lockout before proceeding
    const lockStatus = await checkLockout(adminClient, email);
    if (lockStatus.locked) {
      return new Response(JSON.stringify({
        hasQuestions: false,
        locked: true,
        minutesRemaining: lockStatus.minutesRemaining,
        error: `Account temporarily locked. Try again in ${lockStatus.minutesRemaining} minute(s).`,
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Don't leak whether user exists
      return new Response(JSON.stringify({ hasQuestions: false, noQuestions: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("security_question, security_question_2")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.security_question && profile?.security_question_2) {
      return new Response(JSON.stringify({
        hasQuestions: true,
        question1: profile.security_question,
        question2: profile.security_question_2,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No security questions configured — tell the user to contact admin
    return new Response(JSON.stringify({ hasQuestions: false, noQuestions: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("get-security-question error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
