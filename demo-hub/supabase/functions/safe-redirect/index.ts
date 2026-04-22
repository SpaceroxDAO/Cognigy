const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  // Serve an HTML page that requires a human click — bots/link-previews won't follow
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Set Your Password</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      color: #f1f5f9;
    }
    .card {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 1.5rem;
      padding: 3rem 2.5rem;
      max-width: 420px;
      text-align: center;
      backdrop-filter: blur(10px);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { color: #94a3b8; margin-bottom: 2rem; line-height: 1.6; }
    .btn {
      display: inline-block;
      padding: 0.875rem 2.5rem;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: white;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      border-radius: 0.75rem;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4); }
    .btn:active { transform: translateY(0); }
    .note { margin-top: 1.5rem; font-size: 0.75rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔐</div>
    <h1>Set Your Password</h1>
    <p>Click the button below to continue to the password setup page. This link can only be used once.</p>
    <a class="btn" href="${target.replace(/"/g, '&quot;')}">Continue to Password Setup</a>
    <p class="note">If you didn't request this, you can ignore this page.</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store, max-age=0",
    },
  });
});
