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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Require admin auth
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
    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();
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

    const body = await req.json().catch(() => ({}));
    const { email, resetUrl, isNewUser = false } = body;

    if (!email || !resetUrl) {
      return new Response(
        JSON.stringify({ error: "email and resetUrl are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const username = email.split("@")[0];

    // Context-aware copy
    const subject = isNewUser
      ? "Welcome to the NiCE COGNiGY AI Specialist Hub"
      : "Password Reset — NiCE COGNiGY AI Specialist Hub";
    const heading = isNewUser ? "Welcome aboard! 👋" : "Password Reset 🔐";
    const greeting = isNewUser
      ? `Your account has been created on the NiCE COGNiGY AI Specialist Hub. Click the button below to set your password and start exploring our AI demo experiences.`
      : `A password reset has been requested for your account. Click the button below to set a new password.`;
    const ctaText = isNewUser ? "Set Your Password" : "Reset Password";
    const expiryNote = isNewUser
      ? `⏳ This link expires in <strong style="color:hsl(222,84%,5%);">1 hour</strong>. If it expires, contact your admin for a new one.`
      : `⏳ This link expires in <strong style="color:hsl(222,84%,5%);">1 hour</strong>. If it expires, you can request a new one from the login page or contact your admin.`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px -15px rgba(59,130,246,0.15);">
          <!-- Header with Cognigy gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,hsl(225,73%,57%) 0%,hsl(262,83%,58%) 100%);padding:36px 40px;text-align:center;">
              <img src="https://ttvkjwlprfqtektginqh.supabase.co/storage/v1/object/public/assets/NiCE_Cognigy_white.png" alt="NiCE Cognigy" height="32" style="display:inline-block;margin-bottom:12px;" />
              <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.5px;opacity:0.9;">
                AI Specialist Hub
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;color:hsl(222,84%,5%);font-size:24px;font-weight:700;">
                ${heading}
              </h2>
              <p style="margin:0 0 24px;color:hsl(215,16%,47%);font-size:15px;line-height:1.7;">
                Hi <strong style="color:hsl(222,84%,5%);">${username}</strong>,
              </p>
              <p style="margin:0 0 32px;color:hsl(215,16%,47%);font-size:15px;line-height:1.7;">
                ${greeting}
              </p>
              <!-- CTA Button with Cognigy gradient -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,hsl(225,73%,57%) 0%,hsl(262,83%,58%) 100%);box-shadow:0 10px 40px -10px rgba(59,130,246,0.4);">
                    <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 48px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Expiry notice with glass-like card -->
              <div style="background:linear-gradient(135deg,hsl(210,40%,96%),hsl(0,0%,100%));border:1px solid hsl(214,32%,91%);border-radius:12px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;color:hsl(215,16%,47%);font-size:13px;line-height:1.6;">
                  ${expiryNote}
                </p>
              </div>
              <!-- Fallback URL -->
              <p style="margin:0;color:hsl(215,20%,65%);font-size:12px;line-height:1.6;word-break:break-all;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${resetUrl}" style="color:hsl(225,73%,57%);">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer with subtle gradient -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid hsl(214,32%,91%);text-align:center;background:linear-gradient(135deg,hsl(210,20%,98%),hsl(0,0%,100%));">
              <p style="margin:0;color:hsl(215,20%,65%);font-size:12px;">
                — The NiCE Demo Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NiCE Demo Hub <onboarding@resend.dev>",
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      throw new Error(
        `Resend API error [${resendRes.status}]: ${JSON.stringify(resendData)}`
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("send-reset-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
