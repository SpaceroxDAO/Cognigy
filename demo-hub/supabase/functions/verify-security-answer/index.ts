import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Verify an answer against a stored hash.
 * Supports: PBKDF2 (pbkdf2:salt:hash), legacy SHA-256 (hex string).
 */
async function verifyAnswer(answer: string, storedHash: string): Promise<boolean> {
  const normalized = answer.trim().toLowerCase();

  if (storedHash.startsWith("pbkdf2:")) {
    // PBKDF2 hash
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const saltHex = parts[1];
    const expectedHashHex = parts[2];
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(normalized),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      256,
    );
    const hashHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex === expectedHashHex;
  }

  // Legacy SHA-256 fallback
  const encoded = new TextEncoder().encode(normalized);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  const sha256Hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  return sha256Hex === storedHash;
}

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
    await adminClient
      .from("security_attempts")
      .update({ attempt_count: 0, locked_until: null, last_attempt_at: new Date().toISOString() })
      .eq("email", normalizedEmail);
  }

  return { locked: false };
}

async function recordFailedAttempt(adminClient: any, email: string): Promise<{ locked: boolean; attemptsRemaining: number }> {
  const normalizedEmail = email.toLowerCase();
  const { data: existing } = await adminClient
    .from("security_attempts")
    .select("id, attempt_count")
    .eq("email", normalizedEmail)
    .maybeSingle();

  const newCount = (existing?.attempt_count || 0) + 1;
  const shouldLock = newCount >= MAX_ATTEMPTS;
  const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString() : null;

  if (existing) {
    await adminClient
      .from("security_attempts")
      .update({ attempt_count: newCount, locked_until: lockedUntil, last_attempt_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await adminClient
      .from("security_attempts")
      .insert({ email: normalizedEmail, attempt_count: newCount, locked_until: lockedUntil });
  }

  return { locked: shouldLock, attemptsRemaining: Math.max(0, MAX_ATTEMPTS - newCount) };
}

async function clearAttempts(adminClient: any, email: string) {
  await adminClient
    .from("security_attempts")
    .delete()
    .eq("email", email.toLowerCase());
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
    const { email, answer1, answer2 } = body;

    if (!email || !answer1 || !answer2) {
      return new Response(JSON.stringify({ error: "Email and both answers are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check lockout before processing
    const lockStatus = await checkLockout(adminClient, email);
    if (lockStatus.locked) {
      return new Response(JSON.stringify({ 
        error: `Account temporarily locked due to too many failed attempts. Try again in ${lockStatus.minutesRemaining} minute(s).`,
        locked: true,
        minutesRemaining: lockStatus.minutesRemaining,
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      await recordFailedAttempt(adminClient, email);
      return new Response(JSON.stringify({ error: "Invalid email or answers" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("security_question, security_answer_hash, security_question_2, security_answer_hash_2")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile?.security_answer_hash || !profile?.security_answer_hash_2) {
      return new Response(JSON.stringify({ error: "No security questions configured. Please contact an administrator." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify both answers (supports both PBKDF2 and legacy SHA-256)
    const [match1, match2] = await Promise.all([
      verifyAnswer(answer1, profile.security_answer_hash),
      verifyAnswer(answer2, profile.security_answer_hash_2),
    ]);

    if (!match1 || !match2) {
      const failResult = await recordFailedAttempt(adminClient, email);

      // Log security challenge failure
      await adminClient.from("auth_events").insert({
        user_id: user.id,
        email: email.toLowerCase(),
        event_type: failResult.locked ? "account_locked" : "security_challenge_failure",
        metadata: { attempts_remaining: failResult.attemptsRemaining },
      });

      const errorMsg = failResult.locked
        ? `Account locked due to too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`
        : `Invalid email or answers. ${failResult.attemptsRemaining} attempt(s) remaining.`;
      
      return new Response(JSON.stringify({ 
        error: errorMsg, 
        locked: failResult.locked,
        attemptsRemaining: failResult.attemptsRemaining,
      }), {
        status: failResult.locked ? 429 : 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Success — clear attempts and log
    await clearAttempts(adminClient, email);
    await adminClient.from("auth_events").insert({
      user_id: user.id,
      email: email.toLowerCase(),
      event_type: "security_challenge_success",
    });

    // Generate recovery OTP and return it directly (no email needed)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `https://ai-specialist-demos.lovable.app/reset-password`,
      },
    });

    if (linkError) throw linkError;

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      throw new Error("Failed to generate reset link");
    }

    // Extract the OTP token from the action link
    const url = new URL(actionLink);
    const token = url.searchParams.get("token");

    if (!token) {
      throw new Error("Failed to extract token from reset link");
    }

    return new Response(JSON.stringify({ success: true, token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("verify-security-answer error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
