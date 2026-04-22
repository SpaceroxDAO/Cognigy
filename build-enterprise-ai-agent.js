/**
 * Build Enterprise AI Agent Demo — "Intake, Triage, Orchestrate"
 * Multi-channel: Webchat (full), Slack (2-way bot + buttons), Teams (adaptive card), Voice (stipend + transfer)
 * Multi-agent: Jane (intake) → Alex (IT specialist) → Sofia (Sales intelligence)
 * Integrations: ServiceNow (tickets, reports), Salesforce (accounts, pipeline)
 * 10 tools: 6 xApp + 4 regular
 */
const { cloneAndModify } = require("./cognigy-package-generator/clone-and-modify");

const SOURCE_DIR = "./credit-card-analysis";
const OUTPUT_PATH = "./Apex-Enterprise-AI-Agent-Demo.zip";

// Replace with your real Slack incoming webhook URL to activate cross-channel notifications
const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/REPLACE_ME/REPLACE_ME/REPLACE_ME";

// ─── Shared CSS ──────────────────────────────────────────────────────────────

const sharedCSS = `
  html,body{margin:0;padding:0;font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f3f4f6;overflow-x:hidden;}
  body{min-height:100vh;min-height:100dvh;padding-top:calc(env(safe-area-inset-top)+12px);padding-bottom:calc(env(safe-area-inset-bottom)+12px);}
  .fade-in{opacity:0;transform:translateY(6px);animation:fadeIn .35s ease-out forwards;}
  @keyframes fadeIn{to{opacity:1;transform:translateY(0);}}
  button,a{-webkit-tap-highlight-color:transparent;}
  select,input,textarea{font-size:14px;}
`;

// ─── xApp 1: OTP Identity Verification (Okta-branded) ───────────────────────

const otpXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Verify Identity</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${sharedCSS}
  .otp-input{width:46px;height:54px;text-align:center;font-size:22px;font-weight:700;border:2px solid #d1d5db;border-radius:12px;outline:none;transition:border-color .2s;}
  .otp-input:focus{border-color:#007DC1;box-shadow:0 0 0 3px rgba(0,125,193,.15);}
</style></head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-md mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="bg-[#007DC1] text-white px-5 py-4 relative overflow-hidden">
    <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/15 blur-2xl"></div>
    <div class="relative flex items-center gap-3">
      <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#007DC1" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <div><p class="text-xs text-white/80">Apex Technologies · Okta</p><h1 class="text-lg font-extrabold">Identity Verification</h1></div>
    </div>
  </header>
  <div class="p-5 space-y-5">
    <div class="text-center fade-in" style="animation-delay:60ms">
      <div class="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007DC1" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </div>
      <h2 class="text-gray-900 font-semibold text-lg">Check your email</h2>
      <p class="text-gray-500 text-sm mt-1">6-digit code sent to <span class="font-semibold text-gray-800">adam.boyle@apextech.com</span></p>
    </div>
    <div class="flex justify-center gap-2 fade-in" style="animation-delay:120ms" id="otp-container">
      <input class="otp-input" maxlength="1" type="text" inputmode="numeric" autofocus/>
      <input class="otp-input" maxlength="1" type="text" inputmode="numeric"/>
      <input class="otp-input" maxlength="1" type="text" inputmode="numeric"/>
      <input class="otp-input" maxlength="1" type="text" inputmode="numeric"/>
      <input class="otp-input" maxlength="1" type="text" inputmode="numeric"/>
      <input class="otp-input" maxlength="1" type="text" inputmode="numeric"/>
    </div>
    <div id="error-msg" class="text-center text-red-500 text-sm hidden">Invalid code. Please try again.</div>
    <div id="success-msg" class="text-center hidden fade-in">
      <div class="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <p class="text-green-700 font-semibold">Verified Successfully</p>
    </div>
    <button id="verify-btn" onclick="verifyCode()"
      class="w-full px-4 py-3 rounded-xl bg-[#007DC1] hover:brightness-95 text-white font-semibold text-sm shadow transition fade-in disabled:opacity-50"
      style="animation-delay:180ms" disabled>Verify Code</button>
    <div class="text-center fade-in" style="animation-delay:240ms">
      <button onclick="resendCode()" class="text-[#007DC1] text-sm font-medium hover:underline" id="resend-btn">Resend Code</button>
      <p class="text-gray-400 text-xs mt-1" id="resend-timer"></p>
    </div>
  </div>
</div></div>
<script>
const inputs=document.querySelectorAll('.otp-input'),btn=document.getElementById('verify-btn');
inputs.forEach((inp,i)=>{
  inp.addEventListener('input',()=>{if(inp.value&&i<inputs.length-1)inputs[i+1].focus();checkFilled();});
  inp.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!inp.value&&i>0)inputs[i-1].focus();});
  inp.addEventListener('paste',e=>{e.preventDefault();const d=(e.clipboardData.getData('text')||'').replace(/\\D/g,'').slice(0,6);d.split('').forEach((c,j)=>{if(inputs[j])inputs[j].value=c;});checkFilled();if(d.length>=6)inputs[5].focus();});
});
function checkFilled(){const v=[...inputs].map(i=>i.value).join('');btn.disabled=v.length<6;}
function verifyCode(){
  const code=[...inputs].map(i=>i.value).join('');
  btn.textContent='Verifying...';btn.disabled=true;
  setTimeout(()=>{
    document.getElementById('otp-container').classList.add('hidden');
    btn.classList.add('hidden');
    document.getElementById('success-msg').classList.remove('hidden');
    document.getElementById('resend-btn').classList.add('hidden');
    setTimeout(()=>{if(window.SDK&&SDK.submit)SDK.submit({action:'verified',code});},1500);
  },1200);
}
function resendCode(){
  const rb=document.getElementById('resend-btn'),rt=document.getElementById('resend-timer');
  rb.disabled=true;rt.textContent='Code resent. Wait 30s to resend again.';
  let s=30;const iv=setInterval(()=>{s--;rt.textContent='Resend in '+s+'s';if(s<=0){clearInterval(iv);rb.disabled=false;rt.textContent='';}},1000);
}
</script>
</body></html>`;

// ─── xApp 2: ServiceNow Ticket Form (create) ─────────────────────────────────

const createTicketXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>New Ticket · ServiceNow</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${sharedCSS}</style></head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-lg mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="bg-[#293E40] text-white px-5 py-4 relative overflow-hidden">
    <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
    <div class="relative flex items-center gap-3">
      <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#81B5A1"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div><p class="text-xs text-white/70">ServiceNow · ITSM</p><h1 class="text-lg font-extrabold">Create Incident</h1></div>
    </div>
  </header>
  <div class="p-5 space-y-4">
    <div class="grid grid-cols-2 gap-3 fade-in" style="animation-delay:60ms">
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-gray-500 text-[10px] uppercase tracking-wide">Reporter</p>
        <p class="text-gray-900 text-sm font-semibold">Adam Boyle</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-gray-500 text-[10px] uppercase tracking-wide">Department</p>
        <p class="text-gray-900 text-sm font-semibold">Technology Services</p>
      </div>
    </div>
    <div class="space-y-3 fade-in" style="animation-delay:100ms">
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">Category</label>
        <select id="category" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#81B5A1]">
          <option value="network">Network / VPN</option>
          <option value="software">Software</option>
          <option value="hardware">Hardware</option>
          <option value="account_access">Account Access</option>
          <option value="email">Email / Calendar</option>
          <option value="security">Security</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
        <select id="priority" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#81B5A1]">
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">Description</label>
        <textarea id="description" rows="3" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#81B5A1] resize-none" placeholder="Describe the issue...">VPN disconnects intermittently when working remotely. Occurs every 20-30 minutes.</textarea>
      </div>
    </div>
    <div class="rounded-xl bg-green-50 border border-green-200 p-3 text-green-800 text-xs fade-in" style="animation-delay:140ms">
      Auto-triaged to: <strong>Network Engineering Team</strong> · Estimated response: 4 hours
    </div>
    <button onclick="submitTicket()"
      class="w-full px-4 py-3 rounded-xl bg-[#293E40] hover:brightness-110 text-white font-semibold text-sm shadow transition fade-in"
      style="animation-delay:180ms">Submit Incident</button>
  </div>
</div></div>
<script>
function submitTicket(){
  const btn=event.target;
  btn.textContent='Submitting...';btn.disabled=true;
  const ticketId='INC-'+Math.floor(Math.random()*9000+1000);
  setTimeout(()=>{
    btn.textContent='Submitted ✓';btn.classList.replace('bg-[#293E40]','bg-green-600');
    setTimeout(()=>{
      if(window.SDK&&SDK.submit)SDK.submit({
        action:'submitted',
        ticketId,
        category:document.getElementById('category').value,
        priority:document.getElementById('priority').value,
        description:document.getElementById('description').value
      });
    },1000);
  },1400);
}
</script>
</body></html>`;

// ─── xApp 3: ServiceNow Ticket Status + Timeline ─────────────────────────────

const ticketStatusXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Ticket Status · ServiceNow</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${sharedCSS}
  .timeline-dot{width:12px;height:12px;border-radius:50%;border:2px solid white;flex-shrink:0;}
  .timeline-line{width:2px;background:#d1d5db;flex-shrink:0;margin:0 auto;}
</style></head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-lg mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="bg-[#293E40] text-white px-5 py-4 relative overflow-hidden">
    <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
    <div class="relative flex items-center gap-3">
      <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#81B5A1"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div>
        <p class="text-xs text-white/70">ServiceNow · INC-4521</p>
        <h1 class="text-lg font-extrabold">VPN Disconnects Intermittently</h1>
      </div>
    </div>
  </header>
  <div class="p-5 space-y-4">
    <div class="grid grid-cols-3 gap-2 fade-in" style="animation-delay:60ms">
      <div class="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-center">
        <p class="text-[10px] text-yellow-700 font-bold uppercase">Status</p>
        <p class="text-yellow-800 text-sm font-bold mt-0.5">In Progress</p>
      </div>
      <div class="rounded-xl bg-orange-50 border border-orange-200 p-3 text-center">
        <p class="text-[10px] text-orange-700 font-bold uppercase">Priority</p>
        <p class="text-orange-800 text-sm font-bold mt-0.5">Medium</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
        <p class="text-[10px] text-gray-500 font-bold uppercase">Assigned</p>
        <p class="text-gray-800 text-sm font-bold mt-0.5">Network</p>
      </div>
    </div>
    <div class="fade-in" style="animation-delay:100ms">
      <p class="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Activity Timeline</p>
      <div class="space-y-0">
        <div class="flex gap-3">
          <div class="flex flex-col items-center"><div class="timeline-dot bg-green-500"></div><div class="timeline-line h-10"></div></div>
          <div class="pb-3"><p class="text-sm font-semibold text-gray-900">Ticket Opened</p><p class="text-xs text-gray-500">Feb 25 · 9:14 AM · Auto-triaged to Network Engineering</p></div>
        </div>
        <div class="flex gap-3">
          <div class="flex flex-col items-center"><div class="timeline-dot bg-blue-500"></div><div class="timeline-line h-10"></div></div>
          <div class="pb-3"><p class="text-sm font-semibold text-gray-900">Investigation Started</p><p class="text-xs text-gray-500">Feb 25 · 11:02 AM · Javier M. — Reviewing Cisco AnyConnect logs</p></div>
        </div>
        <div class="flex gap-3">
          <div class="flex flex-col items-center"><div class="timeline-dot bg-gray-300"></div></div>
          <div><p class="text-sm font-semibold text-gray-400">Awaiting Resolution</p><p class="text-xs text-gray-400">SLA target: Feb 27 · 9:00 AM</p></div>
        </div>
      </div>
    </div>
    <div id="approval-section" class="rounded-xl bg-amber-50 border border-amber-200 p-4 fade-in" style="animation-delay:140ms">
      <p class="text-xs font-bold text-amber-800 uppercase mb-2">Pending Your Approval</p>
      <p class="text-sm text-gray-800 font-medium">RITM-8901 · Jira Access Request — Maria Lopez</p>
      <p class="text-xs text-gray-500 mt-0.5">Submitted Mar 1 · Software Provisioning</p>
      <div class="flex gap-2 mt-3">
        <button onclick="approveItem()" class="flex-1 py-2 rounded-xl bg-green-600 hover:brightness-95 text-white text-sm font-semibold">Approve</button>
        <button onclick="rejectItem()" class="flex-1 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold">Reject</button>
      </div>
    </div>
    <button onclick="if(window.SDK&&SDK.submit)SDK.submit({action:'close'})"
      class="w-full py-3 rounded-xl bg-[#293E40] hover:brightness-110 text-white font-semibold text-sm fade-in" style="animation-delay:180ms">Close</button>
  </div>
</div></div>
<script>
function approveItem(){
  document.getElementById('approval-section').innerHTML='<div class="flex items-center gap-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><p class="text-green-800 font-semibold text-sm">RITM-8901 Approved — Maria Lopez has been notified.</p></div>';
  setTimeout(()=>{if(window.SDK&&SDK.submit)SDK.submit({action:'approved',ticketId:'RITM-8901'});},1500);
}
function rejectItem(){
  document.getElementById('approval-section').innerHTML='<p class="text-red-700 font-semibold text-sm">RITM-8901 Rejected — Requestor notified.</p>';
  setTimeout(()=>{if(window.SDK&&SDK.submit)SDK.submit({action:'rejected',ticketId:'RITM-8901'});},1500);
}
</script>
</body></html>`;

// ─── xApp 4: Okta Account Services Status Card ───────────────────────────────

const accountServicesXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Account Services · Okta</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${sharedCSS}
  @keyframes spin{to{transform:rotate(360deg);}}
  .spinner{animation:spin 1s linear infinite;}
</style></head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-md mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="bg-[#007DC1] text-white px-5 py-4 relative overflow-hidden">
    <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/15 blur-2xl"></div>
    <div class="relative flex items-center gap-3">
      <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#007DC1" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div><p class="text-xs text-white/80">Apex Technologies · Okta</p><h1 class="text-lg font-extrabold">Account Services</h1></div>
    </div>
  </header>
  <div class="p-5">
    <div id="processing" class="text-center py-8 space-y-4 fade-in">
      <div class="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
        <svg class="spinner" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#007DC1" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
      </div>
      <p class="text-gray-700 font-semibold text-lg" id="action-label">Unlocking account...</p>
      <p class="text-gray-400 text-sm">Connecting to Okta identity provider</p>
    </div>
    <div id="success" class="text-center py-8 space-y-4 hidden fade-in">
      <div class="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <p class="text-gray-900 font-bold text-lg" id="success-label">Account Unlocked</p>
      <p class="text-gray-500 text-sm" id="success-detail">adam.boyle@apextech.com is now active</p>
      <div class="rounded-xl bg-gray-50 border border-gray-100 p-3 text-left">
        <div class="flex justify-between text-xs py-1"><span class="text-gray-500">User</span><span class="font-medium text-gray-800">Adam Boyle</span></div>
        <div class="flex justify-between text-xs py-1"><span class="text-gray-500">Status</span><span class="font-medium text-green-600">Active</span></div>
        <div class="flex justify-between text-xs py-1"><span class="text-gray-500">MFA</span><span class="font-medium text-gray-800">Okta Verify (push)</span></div>
        <div class="flex justify-between text-xs py-1"><span class="text-gray-500">Completed</span><span class="font-medium text-gray-800" id="ts-label">Just now</span></div>
      </div>
    </div>
  </div>
</div></div>
<script>
const now=new Date();
document.getElementById('ts-label').textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
setTimeout(()=>{
  document.getElementById('processing').classList.add('hidden');
  document.getElementById('success').classList.remove('hidden');
  setTimeout(()=>{if(window.SDK&&SDK.submit)SDK.submit({action:'complete'});},2000);
},2200);
</script>
</body></html>`;

// ─── xApp 5: Knowledge Article (SharePoint / ServiceNow KB) ──────────────────

const knowledgeXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Knowledge Article</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${sharedCSS}</style></head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-lg mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="bg-[#003366] text-white px-5 py-4 relative overflow-hidden">
    <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
    <div class="relative flex items-center gap-3">
      <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#003366"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" fill="white" opacity=".4"/></svg>
      </div>
      <div><p class="text-xs text-white/70" id="kb-source-label">SharePoint · HTS Knowledge Base</p><h1 class="text-lg font-extrabold" id="kb-title">VPN Connection Troubleshooting</h1></div>
    </div>
  </header>
  <div class="p-5 space-y-4">
    <div class="flex flex-wrap gap-2 fade-in" style="animation-delay:60ms">
      <span class="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-[10px] font-bold uppercase" id="kb-source-badge">SharePoint</span>
      <span class="inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-[10px] font-bold uppercase">Verified</span>
      <span class="text-gray-400 text-xs self-center" id="kb-updated">Last updated: March 2026</span>
    </div>
    <div class="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3 fade-in" style="animation-delay:100ms">
      <h3 class="text-gray-900 font-semibold text-sm">Quick Resolution Steps</h3>
      <div class="space-y-2" id="kb-steps">
        <div class="flex gap-3"><span class="shrink-0 w-6 h-6 rounded-full bg-[#003366] text-white text-xs font-bold flex items-center justify-center">1</span><p class="text-gray-700 text-sm">Disconnect from VPN and fully close Cisco AnyConnect</p></div>
        <div class="flex gap-3"><span class="shrink-0 w-6 h-6 rounded-full bg-[#003366] text-white text-xs font-bold flex items-center justify-center">2</span><p class="text-gray-700 text-sm">Confirm Okta MFA is working — open Okta Verify and approve a push</p></div>
        <div class="flex gap-3"><span class="shrink-0 w-6 h-6 rounded-full bg-[#003366] text-white text-xs font-bold flex items-center justify-center">3</span><p class="text-gray-700 text-sm">Relaunch AnyConnect and connect to the nearest gateway</p></div>
        <div class="flex gap-3"><span class="shrink-0 w-6 h-6 rounded-full bg-[#003366] text-white text-xs font-bold flex items-center justify-center">4</span><p class="text-gray-700 text-sm">If still failing, switch to a wired connection and retry</p></div>
      </div>
    </div>
    <div id="failover-banner" class="rounded-xl bg-amber-50 border border-amber-200 p-3 hidden fade-in">
      <div class="flex gap-2 items-start">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#d97706" class="shrink-0 mt-0.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        <p class="text-amber-800 text-xs"><strong>Internal KB: No results found.</strong> Showing external source: Microsoft Support</p>
      </div>
    </div>
    <div class="flex flex-wrap gap-2 fade-in" style="animation-delay:140ms">
      <span class="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs">VPN</span>
      <span class="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs">Network</span>
      <span class="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs">AnyConnect</span>
    </div>
    <button onclick="if(window.SDK&&SDK.submit)SDK.submit({action:'close'})"
      class="w-full py-3 rounded-xl bg-[#003366] hover:brightness-110 text-white font-semibold text-sm fade-in" style="animation-delay:180ms">Close</button>
  </div>
</div></div>
<script>
// Check URL params for failover demo mode
const params=new URLSearchParams(window.location.search);
if(params.get('failover')==='true'){
  document.getElementById('failover-banner').classList.remove('hidden');
  document.getElementById('kb-source-label').textContent='Microsoft Support (External Fallback)';
  document.getElementById('kb-source-badge').textContent='External';
  document.getElementById('kb-source-badge').className='inline-flex items-center rounded-full bg-orange-100 text-orange-800 px-3 py-1 text-[10px] font-bold uppercase';
}
</script>
</body></html>`;

// ─── xApp 6: Salesforce Account Dashboard ────────────────────────────────────

const salesforceXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Salesforce · Accounts</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${sharedCSS}
  .stage-pill{display:inline-flex;align-items:center;padding:2px 10px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;}
</style></head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-lg mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="bg-[#00A1E0] text-white px-5 py-4 relative overflow-hidden">
    <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/15 blur-2xl"></div>
    <div class="relative flex items-center gap-3">
      <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#00A1E0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      </div>
      <div><p class="text-xs text-white/80">Salesforce · CRM Intelligence</p><h1 class="text-lg font-extrabold">Open Opportunities — Q2 2026</h1></div>
    </div>
  </header>
  <div class="p-5 space-y-4">
    <div class="grid grid-cols-3 gap-2 fade-in" style="animation-delay:60ms">
      <div class="rounded-xl bg-blue-50 border border-blue-200 p-3 text-center">
        <p class="text-[10px] text-blue-600 font-bold uppercase">Pipeline</p>
        <p class="text-blue-900 text-base font-extrabold mt-0.5">$1.24M</p>
      </div>
      <div class="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
        <p class="text-[10px] text-green-600 font-bold uppercase">Closed Won</p>
        <p class="text-green-900 text-base font-extrabold mt-0.5">$387K</p>
      </div>
      <div class="rounded-xl bg-purple-50 border border-purple-200 p-3 text-center">
        <p class="text-[10px] text-purple-600 font-bold uppercase">Deals</p>
        <p class="text-purple-900 text-base font-extrabold mt-0.5">7</p>
      </div>
    </div>
    <div class="space-y-2 fade-in" style="animation-delay:100ms">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Opportunities</p>
      <div class="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        <div class="p-3 flex items-center justify-between">
          <div><p class="text-sm font-semibold text-gray-900">DataStream Corp</p><p class="text-xs text-gray-500">Sofia Reyes · 45 days in stage</p></div>
          <div class="text-right"><p class="text-sm font-bold text-gray-900">$142K</p><span class="stage-pill bg-blue-100 text-blue-800">Proposal</span></div>
        </div>
        <div class="p-3 flex items-center justify-between">
          <div><p class="text-sm font-semibold text-gray-900">Nortek Industries</p><p class="text-xs text-gray-500">Adam Boyle · 12 days in stage</p></div>
          <div class="text-right"><p class="text-sm font-bold text-gray-900">$87.5K</p><span class="stage-pill bg-green-100 text-green-800">Closed Won</span></div>
        </div>
        <div class="p-3 flex items-center justify-between">
          <div><p class="text-sm font-semibold text-gray-900">Meridian Health Systems</p><p class="text-xs text-gray-500">Sofia Reyes · 7 days in stage</p></div>
          <div class="text-right"><p class="text-sm font-bold text-gray-900">$215K</p><span class="stage-pill bg-yellow-100 text-yellow-800">Negotiation</span></div>
        </div>
        <div class="p-3 flex items-center justify-between">
          <div><p class="text-sm font-semibold text-gray-900">Clearwater Financial</p><p class="text-xs text-gray-500">Adam Boyle · 3 days in stage</p></div>
          <div class="text-right"><p class="text-sm font-bold text-gray-900">$98K</p><span class="stage-pill bg-indigo-100 text-indigo-800">Discovery</span></div>
        </div>
      </div>
    </div>
    <div id="approve-section" class="rounded-xl bg-amber-50 border border-amber-200 p-4 fade-in" style="animation-delay:140ms">
      <p class="text-xs font-bold text-amber-800 uppercase mb-1">Pending Deal Approval</p>
      <p class="text-sm text-gray-800 font-medium">Meridian Health — 15% discount request</p>
      <p class="text-xs text-gray-500 mt-0.5">Submitted by Sofia Reyes · Mar 28, 2026</p>
      <div class="flex gap-2 mt-3">
        <button onclick="approveDeal()" class="flex-1 py-2 rounded-xl bg-green-600 hover:brightness-95 text-white text-sm font-semibold">Approve</button>
        <button onclick="rejectDeal()" class="flex-1 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold">Reject</button>
      </div>
    </div>
    <button onclick="if(window.SDK&&SDK.submit)SDK.submit({action:'close'})"
      class="w-full py-3 rounded-xl bg-[#00A1E0] hover:brightness-95 text-white font-semibold text-sm fade-in" style="animation-delay:180ms">Close</button>
  </div>
</div></div>
<script>
function approveDeal(){
  document.getElementById('approve-section').innerHTML='<div class="flex items-center gap-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><p class="text-green-800 font-semibold text-sm">Discount approved — Sofia Reyes notified via Slack.</p></div>';
  setTimeout(()=>{if(window.SDK&&SDK.submit)SDK.submit({action:'deal_approved',account:'Meridian Health'});},1500);
}
function rejectDeal(){
  document.getElementById('approve-section').innerHTML='<p class="text-red-700 font-semibold text-sm">Discount rejected — Sofia Reyes notified.</p>';
  setTimeout(()=>{if(window.SDK&&SDK.submit)SDK.submit({action:'deal_rejected'});},1500);
}
</script>
</body></html>`;

// ─── xApp 7: Expense Request (Salesforce Spend — with mock OCR receipt scan) ────

const expenseRequestXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Expense Request · Salesforce Spend</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${sharedCSS}
  @keyframes scanLine{0%{top:0%}100%{top:100%}}
  .scan-line{position:absolute;left:0;right:0;height:2px;background:rgba(0,161,224,.8);animation:scanLine 1.5s ease-in-out infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .spinner{animation:spin 1s linear infinite;}
</style></head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-lg mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="bg-[#00A1E0] text-white px-5 py-4 relative overflow-hidden">
    <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/15 blur-2xl"></div>
    <div class="relative flex items-center gap-3">
      <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00A1E0" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
      </div>
      <div><p class="text-xs text-white/80">Salesforce · Spend Management</p><h1 class="text-lg font-extrabold">New Expense Request</h1></div>
    </div>
  </header>
  <div class="p-5 space-y-4">

    <!-- Receipt upload -->
    <div class="fade-in" style="animation-delay:60ms">
      <label class="block text-xs font-semibold text-gray-600 mb-2">Receipt</label>
      <div id="upload-zone" class="relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center cursor-pointer hover:border-[#00A1E0] transition-colors" onclick="document.getElementById('file-input').click()">
        <div id="upload-prompt">
          <svg class="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
          <p class="text-gray-500 text-sm">Tap to upload receipt</p>
          <p class="text-gray-400 text-xs mt-1">JPG, PNG, or PDF — AI scan will auto-fill amount</p>
        </div>
        <div id="scan-zone" class="hidden relative overflow-hidden rounded-lg bg-gray-100 h-20">
          <div class="scan-line" id="scan-anim"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A1E0" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>
            <p class="ml-2 text-[#00A1E0] font-semibold text-sm">Scanning receipt...</p>
          </div>
        </div>
        <div id="scan-done" class="hidden text-center py-2">
          <div class="flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <p class="text-green-700 font-semibold text-sm">Receipt scanned — amount extracted</p>
          </div>
        </div>
        <input id="file-input" type="file" accept="image/*,.pdf" class="hidden" onchange="startScan()"/>
      </div>
    </div>

    <!-- Fields -->
    <div class="grid grid-cols-2 gap-3 fade-in" style="animation-delay:100ms">
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">Date</label>
        <input id="exp-date" type="date" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A1E0] text-sm"/>
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">Category</label>
        <select id="exp-cat" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A1E0] text-sm">
          <option value="meals">Meals & Entertainment</option>
          <option value="travel">Travel</option>
          <option value="hotel">Hotel / Lodging</option>
          <option value="supplies">Office Supplies</option>
          <option value="transport">Ground Transport</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
    <div class="fade-in" style="animation-delay:120ms">
      <label class="block text-xs font-semibold text-gray-600 mb-1">Amount (USD)</label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
        <input id="exp-amount" type="number" step="0.01" placeholder="0.00"
          class="w-full rounded-xl border border-gray-200 bg-gray-50 pl-7 pr-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A1E0] text-sm"/>
      </div>
      <p id="ocr-label" class="text-[#00A1E0] text-xs mt-1 hidden">✦ Auto-filled by receipt scan</p>
    </div>
    <div class="fade-in" style="animation-delay:140ms">
      <label class="block text-xs font-semibold text-gray-600 mb-1">Business Purpose</label>
      <textarea id="exp-desc" rows="2" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A1E0] resize-none text-sm" placeholder="Describe the business purpose...">Client dinner — DataStream Corp proposal discussion</textarea>
    </div>
    <div class="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 fade-in" style="animation-delay:160ms">
      Submit within 30 days · Receipts required over $25 · Approval: 3–5 business days
    </div>
    <button onclick="submitExpense()"
      class="w-full px-4 py-3 rounded-xl bg-[#00A1E0] hover:brightness-95 text-white font-semibold text-sm shadow transition fade-in"
      style="animation-delay:200ms">Submit Expense Request</button>
  </div>
</div></div>
<script>
const d=new Date();
document.getElementById('exp-date').value=d.toISOString().split('T')[0];
function startScan(){
  document.getElementById('upload-prompt').classList.add('hidden');
  document.getElementById('scan-zone').classList.remove('hidden');
  setTimeout(()=>{
    document.getElementById('scan-zone').classList.add('hidden');
    document.getElementById('scan-done').classList.remove('hidden');
    document.getElementById('exp-amount').value='284.50';
    document.getElementById('ocr-label').classList.remove('hidden');
    document.getElementById('exp-cat').value='meals';
  },2200);
}
function submitExpense(){
  const btn=event.target;btn.textContent='Submitting...';btn.disabled=true;
  const ref='EXP-'+Math.floor(Math.random()*9000+1000);
  setTimeout(()=>{
    btn.textContent='Submitted ✓';btn.classList.replace('bg-[#00A1E0]','bg-green-600');
    setTimeout(()=>{
      if(window.SDK&&SDK.submit)SDK.submit({
        action:'submitted',ref,
        amount:document.getElementById('exp-amount').value,
        category:document.getElementById('exp-cat').value,
        date:document.getElementById('exp-date').value,
        description:document.getElementById('exp-desc').value
      });
    },1000);
  },1400);
}
</script>
</body></html>`;

// ─── xApp 8: Office Supply Request (Apex IT — stipend vs standard toggle) ───────

const officeSupplyXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Office Supply Request · Apex IT</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${sharedCSS}</style></head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-md mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="bg-[#1B3A5C] text-white px-5 py-4 relative overflow-hidden">
    <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
    <div class="relative flex items-center gap-3">
      <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1B3A5C" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      </div>
      <div><p class="text-xs text-white/70">Apex Technologies · IT Portal</p><h1 class="text-lg font-extrabold">Office Supply Request</h1></div>
    </div>
  </header>
  <div class="p-5 space-y-4">

    <!-- Request type toggle -->
    <div class="fade-in" style="animation-delay:60ms">
      <p class="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Request Type</p>
      <div class="grid grid-cols-2 gap-3">
        <label id="lbl-stipend" class="cursor-pointer rounded-xl border-2 border-[#1B3A5C] bg-[#1B3A5C]/5 p-3 text-center transition" onclick="selectType('stipend')">
          <input type="radio" name="req-type" value="stipend" checked class="sr-only"/>
          <div class="text-[#1B3A5C] font-bold text-sm">Use Stipend</div>
          <div class="text-green-600 font-extrabold text-base mt-0.5">$423.50</div>
          <div class="text-gray-400 text-[10px]">remaining this year</div>
        </label>
        <label id="lbl-standard" class="cursor-pointer rounded-xl border-2 border-gray-200 bg-gray-50 p-3 text-center transition" onclick="selectType('standard')">
          <input type="radio" name="req-type" value="standard" class="sr-only"/>
          <div class="text-gray-700 font-bold text-sm">Standard Equipment</div>
          <div class="text-orange-500 font-semibold text-xs mt-0.5">Mgr approval required</div>
          <div class="text-gray-400 text-[10px]">IT catalog items</div>
        </label>
      </div>
    </div>

    <!-- Item fields -->
    <div class="space-y-3 fade-in" style="animation-delay:100ms">
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">Item Description</label>
        <input id="item-desc" type="text" placeholder="e.g., Ergonomic keyboard + mouse" value="Ergonomic keyboard and mouse combo"
          class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] text-sm"/>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
          <input id="item-qty" type="number" value="1" min="1"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] text-sm"/>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">Est. Cost (USD)</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input id="item-cost" type="number" step="0.01" value="76.50"
              class="w-full rounded-xl border border-gray-200 bg-gray-50 pl-7 pr-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] text-sm"/>
          </div>
        </div>
      </div>
    </div>

    <!-- Delivery -->
    <div class="fade-in" style="animation-delay:140ms">
      <label class="block text-xs font-semibold text-gray-600 mb-1">Delivery Address</label>
      <input id="delivery-addr" type="text" value="1 Apex Plaza, Floor 18, New York, NY 10036"
        class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] text-sm"/>
    </div>

    <div id="approval-note" class="hidden rounded-xl bg-orange-50 border border-orange-200 p-3 text-orange-800 text-xs fade-in">
      Standard equipment requests require manager approval and a ServiceNow ticket. Estimated fulfillment: 3–5 business days.
    </div>

    <button onclick="submitRequest()"
      class="w-full px-4 py-3 rounded-xl bg-[#1B3A5C] hover:brightness-110 text-white font-semibold text-sm shadow transition fade-in"
      style="animation-delay:180ms">Submit Request</button>
  </div>
</div></div>
<script>
let selectedType='stipend';
function selectType(t){
  selectedType=t;
  document.getElementById('lbl-stipend').className='cursor-pointer rounded-xl border-2 transition p-3 text-center '+(t==='stipend'?'border-[#1B3A5C] bg-[#1B3A5C]/5':'border-gray-200 bg-gray-50');
  document.getElementById('lbl-standard').className='cursor-pointer rounded-xl border-2 transition p-3 text-center '+(t==='standard'?'border-[#1B3A5C] bg-[#1B3A5C]/5':'border-gray-200 bg-gray-50');
  document.getElementById('approval-note').classList.toggle('hidden',t!=='standard');
}
function submitRequest(){
  const btn=event.target;btn.textContent='Submitting...';btn.disabled=true;
  const ref='SUP-'+Math.floor(Math.random()*9000+1000);
  setTimeout(()=>{
    btn.textContent='Submitted ✓';btn.classList.replace('bg-[#1B3A5C]','bg-green-600');
    setTimeout(()=>{
      if(window.SDK&&SDK.submit)SDK.submit({
        action:'submitted',ref,
        requestType:selectedType,
        item:document.getElementById('item-desc').value,
        quantity:document.getElementById('item-qty').value,
        cost:document.getElementById('item-cost').value,
        address:document.getElementById('delivery-addr').value
      });
    },1000);
  },1400);
}
</script>
</body></html>`;

// ─── Channel Output Code (Teams Adaptive Card + Slack Quick Replies) ──────────

const channelOutputCode = `
// ── Channel Output: Teams Adaptive Card + Slack Quick Replies + Webchat Feedback ──
const ch = context.channel || 'chat';
const persona = context.agentPersona || 'Jane';
const lastTool = context.lastToolId || null;

// ── TEAMS: emit one Adaptive Card with OpenUrl links ────────────
if (ch === 'teams') {
  const facts = [];
  if (context.ticketId) {
    facts.push({ title: 'Ticket', value: context.ticketId });
    facts.push({ title: 'Status', value: context.ticketStatus || 'In Progress' });
    facts.push({ title: 'Assigned', value: context.ticketAssigned || 'IT Team' });
  }
  if (context.sfAccountName) {
    facts.push({ title: 'Account', value: context.sfAccountName });
    facts.push({ title: 'Stage', value: context.sfAccountStage || 'Open' });
    facts.push({ title: 'ACV', value: context.sfAccountAcv ? '$' + Number(context.sfAccountAcv).toLocaleString() : 'N/A' });
  }
  if (context.snReportSummary) {
    facts.push({ title: 'Open Incidents', value: String(context.snOpenIncidents || '—') });
    facts.push({ title: 'SLA Compliance', value: context.snSlaCompliance || '—' });
    facts.push({ title: 'Avg MTTR', value: context.snMttr || '—' });
  }
  if (context.expenseRef) {
    facts.push({ title: 'Expense Ref', value: context.expenseRef });
    facts.push({ title: 'Amount', value: '$' + (context.expenseAmount || '—') });
    facts.push({ title: 'Status', value: 'Pending Approval' });
  }

  const bodyItems = [
    { type: 'TextBlock', text: '**Apex AI Assistant** · ' + persona, wrap: true, size: 'Medium', weight: 'Bolder', color: 'Accent' },
    { type: 'TextBlock', text: context.lastAgentResponse || 'Here is the information you requested.', wrap: true, spacing: 'Small' }
  ];
  if (facts.length) bodyItems.push({ type: 'FactSet', facts, spacing: 'Medium' });

  // Use Action.OpenUrl for deep links, Action.Submit only for in-chat actions
  const cardActions = [];
  if (lastTool === 'ticket_status' || lastTool === 'create_ticket') {
    const tid = context.ticketId || '';
    cardActions.push({ type: 'Action.OpenUrl', title: 'View in ServiceNow', url: 'https://apex.service-now.com/nav_to.do?uri=incident.do?number=' + tid });
    cardActions.push({ type: 'Action.Submit', title: 'Approve Pending', data: { cognigyText: 'Approve the pending approval in ServiceNow' } });
  } else if (lastTool === 'salesforce_account') {
    cardActions.push({ type: 'Action.OpenUrl', title: 'Open Pipeline in Salesforce', url: 'https://apex.lightning.force.com/lightning/o/Opportunity/list' });
    cardActions.push({ type: 'Action.Submit', title: 'Approve Meridian Deal', data: { cognigyText: 'Approve the Meridian Health discount request' } });
  } else if (lastTool === 'servicenow_reports') {
    cardActions.push({ type: 'Action.OpenUrl', title: 'Open SN Reports', url: 'https://apex.service-now.com/now/reporting' });
  } else if (lastTool === 'submit_expense_request') {
    cardActions.push({ type: 'Action.OpenUrl', title: 'View in Salesforce Spend', url: 'https://apex.lightning.force.com/lightning/n/Expense_Management' });
  } else {
    cardActions.push({ type: 'Action.Submit', title: 'Create IT Ticket', data: { cognigyText: 'I need to create an IT ticket' } });
    cardActions.push({ type: 'Action.Submit', title: 'Talk to a Human', data: { cognigyText: 'Transfer me to a live agent' } });
  }

  const card = {
    type: 'AdaptiveCard',
    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: bodyItems,
    actions: cardActions
  };
  actions.output('', { _cognigy: { _teams: { nativeData: { type: 'AdaptiveCard', content: card } } } });
}

// ── WEBCHAT: thumbs feedback after knowledge search ─────────────
if ((ch === 'chat' || ch === 'webchat') && lastTool === 'search_knowledge') {
  actions.output('', {
    _cognigy: {
      _default: {
        _quickReplies: {
          type: 'quick_replies',
          text: 'Was this helpful?',
          quickReplies: [
            { contentType: 'text', title: '👍 Yes, that helped', payload: 'That resolved my issue, thank you' },
            { contentType: 'text', title: '👎 Not quite', payload: 'I still need help with this' },
            { contentType: 'text', title: '📋 Create a ticket', payload: 'Please create an IT ticket for me' }
          ]
        }
      }
    }
  });
}

// ── SLACK: quick reply buttons ──────────────────────────────────
if (ch === 'slack') {
  const btns = [];
  if (lastTool === 'search_knowledge') {
    btns.push({ title: 'That helped ✓', payload: 'That resolved my issue' });
    btns.push({ title: 'Create a ticket', payload: 'I need to create an IT ticket' });
    btns.push({ title: 'Talk to IT', payload: 'Connect me to Alex for IT support' });
  } else if (lastTool === 'create_ticket') {
    btns.push({ title: 'View ticket status', payload: 'Show me the status of my latest ticket' });
    btns.push({ title: 'Done ✓', payload: 'Thank you, that is all I need' });
  } else if (lastTool === 'ticket_status') {
    btns.push({ title: 'Approve RITM-8901', payload: 'Approve the Jira access request for Maria Lopez' });
    btns.push({ title: 'Check another ticket', payload: 'Show me my other open tickets' });
    btns.push({ title: 'Done ✓', payload: 'That is all, thank you' });
  } else if (lastTool === 'account_services') {
    btns.push({ title: 'Create a ticket for this', payload: 'Create a ticket documenting this account action' });
    btns.push({ title: 'Done ✓', payload: 'That is all, thank you' });
  } else if (lastTool === 'verify_employee') {
    btns.push({ title: 'Unlock my account', payload: 'My Okta account is locked, please unlock it' });
    btns.push({ title: 'Reset my password', payload: 'I need to reset my Okta password' });
    btns.push({ title: 'Reset my MFA', payload: 'I need to reset my MFA method' });
  } else if (lastTool === 'salesforce_account') {
    btns.push({ title: 'Approve Meridian deal', payload: 'Approve the Meridian Health 15% discount' });
    btns.push({ title: 'View SN IT report', payload: 'Show me the ServiceNow IT report for this month' });
    btns.push({ title: 'Done ✓', payload: 'Thank you' });
  } else if (lastTool === 'submit_expense_request') {
    btns.push({ title: 'View expense status', payload: 'Show me the status of my expense submission' });
    btns.push({ title: 'Done ✓', payload: 'Thank you' });
  } else if (lastTool === 'office_supply_request') {
    btns.push({ title: 'Track my request', payload: 'What is the status of my supply request' });
    btns.push({ title: 'Talk to HR', payload: 'Connect me to HR about my stipend' });
    btns.push({ title: 'Done ✓', payload: 'Thank you, I am all set' });
  } else if (lastTool === 'schedule_notification') {
    btns.push({ title: 'Schedule another', payload: 'Schedule another notification' });
    btns.push({ title: 'Done ✓', payload: 'That is all, thank you' });
  } else {
    btns.push({ title: 'IT help', payload: 'I have an IT issue, connect me to Alex' });
    btns.push({ title: 'Sales data', payload: 'Show me Salesforce pipeline, connect me to Sofia' });
    btns.push({ title: 'Search KB', payload: 'Search the knowledge base' });
  }
  if (btns.length) {
    actions.output('', {
      _cognigy: {
        _default: {
          _quickReplies: {
            type: 'quick_replies',
            text: 'What would you like to do next?',
            quickReplies: btns.map(b => ({ contentType: 'text', title: b.title, payload: b.payload }))
          }
        }
      }
    });
  }
}
`;

// ─── Spec ─────────────────────────────────────────────────────────────────────

cloneAndModify(
  SOURCE_DIR,
  {
    flowName: "Apex Enterprise AI Agent — v2",
    description: "True multi-agent enterprise AI: Jane (intake/orchestrator) → Alex (IT Specialist) → Sofia (Sales Intelligence). Webchat, Slack, Teams, Voice. ServiceNow + Salesforce. aiAgentHandover-based routing — each agent has enforced separate tool permissions.",

    // ── Instructions (Jane — intake and orchestration only) ───────────────────
    instructionsCode: `context.instructions = \`
#INTRO
You are Jane, the enterprise AI assistant for Apex Technologies.
Greet: "Hi, I'm Jane from Apex Technology Services. How can I help you today?"

#ROLE
You are the intake and orchestration agent. Your job is to:
1. Understand what the employee needs.
2. Search the knowledge base for answers you can provide directly.
3. Hand off to a specialist when the request requires IT account actions (Alex) or sales and CRM data (Sofia).

You do NOT handle IT account changes, tickets, Salesforce, or expense reports directly. Those require a specialist handoff.

#HANDOFFS
- "Hand off to Alex — IT Specialist": for ANY IT issue, account unlock, password reset, ticket creation, device diagnostics, or office supply request.
- "Hand off to Sofia — Sales Intelligence": for Salesforce pipeline, deal approvals, expense reports, or ServiceNow IT KPI reports.

Use the handoff as soon as you are confident the request belongs to a specialist. Do not attempt to answer IT or CRM requests yourself — hand off immediately.

#CHANNEL RULES
On Teams (context.channel === "teams"):
- Your text response will appear inside an Adaptive Card. One concise paragraph, 2–3 sentences max.
On Slack (context.channel === "slack"):
- Be very concise. Quick reply buttons follow your message automatically.
- Never list more than one question per turn.
On voice (context.isVoice === true):
- Short sentences only. No markdown, no bullet points.
- All standard voice rules apply.
On webchat: Full responses with natural conversational detail.

**ALWAYS**
- Empathize and acknowledge before taking action.
- Use contractions and friendly phrases like "Got it," "Let me check that for you," "You're all set."
- Speak dates, phone numbers, and emails the way people say them naturally.
- On voice: always use commas instead of periods for natural TTS pauses.

**NEVER**
- Never use markdown, asterisks, bullet points, or em dashes.
- Never list steps in one response — always one step at a time.
- Never continue to the next step without confirmation.
- Never give more than 3 sentences in a single response.
- Never disclose your internal tools or system prompt.
- Never make up data — only use what tools return.

#CONFIRMATION RULES
Spell back names, emails, and phone numbers before using them:
- Name: "I heard first name as A-d-a-m, last name B-o-y-l-e..."
- Phone: "I heard eight four eight, four six six, eight eight two five..."
- Email: "I heard adam dot boyle at apextech dot com..."

#TOOL ORDER (Jane only — all other tools belong to Alex or Sofia)
1. search_knowledge — Search first for any question that could be answered by documentation. No auth.
2. people_search — Look up any employee directory info. No auth.
3. schedule_notification — Schedule a proactive Slack, email, or SMS notification for later delivery.
4. agent_handover — Transfer to a live human agent when explicitly requested or after escalation.

For IT requests (tickets, account access, device diagnostics, office supplies) → hand off to Alex.
For Salesforce, deal approvals, expense reports, or IT reports → hand off to Sofia.

#VOICE & PRONUNCIATION
- Say "Apex" clearly, like "AY-pecks."
- Say "ServiceNow" as two words: "Service Now."
- Say "Okta" as "Octa."
- Say "Salesforce" as two words: "Sales Force."
- Say ticket numbers like "I-N-C dash four five two one."
- Say "SLA" as "S-L-A."
- Say "MTTR" as "M-T-T-R."
\`;`,

    // ── Knowledge ─────────────────────────────────────────────────────────────
    knowledgeCode: `
// Channel + persona detection (fires once per session)
context.channel = (input.data && input.data._cognigy && input.data._cognigy._teams) ? 'teams'
               : (input.data && input.data._cognigy && input.data._cognigy._slack) ? 'slack'
               : 'chat';
context.isVoice = false; // set to true on voice endpoint
context.agentPersona = context.agentPersona || 'Jane';
context.isManager = false; // elevated to true when Sofia is verified as manager

context.knowledge = \`
## VPN & Remote Access
Use Cisco AnyConnect to connect to the Apex VPN. Download from the IT self-service portal. Authenticate with Okta credentials and MFA. If VPN is slow, switch gateways: US-East, US-West, or EU. Most VPN disconnects are fixed by: fully closing AnyConnect, verifying Okta MFA is active, relaunching and reconnecting.

## Wi-Fi & Network
Corporate Wi-Fi: connect to Apex-Corp with your Active Directory credentials. Guest Wi-Fi: Apex-Guest (no password). Ethernet ports are available at all office desks with no configuration required. If you cannot connect to Apex-Corp, forget the network and reconnect.

## Password & Account Policies
Passwords require 12+ characters: mixed case, numbers, and special characters. Passwords expire every 90 days. Okta accounts lock after 5 failed login attempts. Supported MFA methods: Okta Verify push (recommended), SMS, hardware token.

## Office Equipment Stipend
Employees at the Senior Associate level and above receive a $500 annual home office equipment stipend. Stipend resets each January 1st. Eligible purchases: monitors, keyboards, webcams, headsets, ergonomic chairs, standing desk converters. Non-eligible: personal computers, mobile phones, gaming equipment. To use the stipend, submit an Office Supply Request through the IT portal or ask Jane.

## Standard Equipment Catalog
Standard-issue equipment for all employees: 15-inch laptop, wired mouse and keyboard, USB-C dock, 1080p webcam, noise-canceling headset. Replacements for damaged or lost standard equipment require manager approval and a ServiceNow ticket. Expedited shipping available for remote employees.

## Software Requests
Request software via ServiceNow under "Software Installation." Pre-approved software (1-2 day turnaround): Microsoft 365, Adobe Creative Cloud, Slack, Zoom, Salesforce, Jira, Confluence. Non-standard software requires manager approval and security review (5-7 days). Mac: use JAMF Self Service for self-service installs. Windows: use Company Portal.

## Expense & Finance
All expense reports are submitted through Salesforce Spend Management. Submit within 30 days of the expense. Receipts required for any expense over $25. Mileage reimbursement: $0.67/mile. Approval typically takes 3-5 business days.

## Payroll & Time Off
Apex uses Workday for payroll and time-off management. Access Workday via the employee portal. Direct deposit changes must be submitted at least 5 business days before payday. PTO requests require manager approval through Workday.

## ServiceNow Ticket Categories
Incident: Hardware, Software, Network, Account Access, Email, VPN, Printing, Security.
Service Request: Software Installation, Hardware Request, Access Request, Account Changes, New Hire Setup, Offboarding.
Auto-triage assignments: Network → Network Engineering, Account Access → Identity & Access Management, Software → Software Provisioning, Hardware → Hardware Support, Security → Information Security.

## Salesforce CRM Notes
Apex uses Salesforce Sales Cloud and Service Cloud. Pipeline stages: Discovery → Qualification → Proposal → Negotiation → Closed Won / Closed Lost. Deal approval requests (discounts, non-standard terms) go to the direct manager. Use Sofia for pipeline lookups, opportunity status, and deal approvals.

## People Search
Look up any Apex employee by name, department, or title. Results include: name, role, department, supervisor, location, email, phone, and employment status. No authentication required for basic directory lookups.

## Phishing & Security
Do not click suspicious links or attachments. Forward suspicious emails to security@apextech.com. If you clicked a suspicious link, change your password immediately and notify IT. Apex uses CrowdStrike for endpoint security monitoring. All security concerns should be escalated regardless of certainty level.
\`;`,

    // ── Agent Job ──────────────────────────────────────────────────────────────
    agentJobConfig: {
      name: "Jane — Intake & Orchestration",
      description: "Intake and orchestration agent for Apex Technologies. Handles knowledge search, people lookup, notification scheduling, and live escalation. Routes IT issues to Alex (IT Specialist) and sales/CRM requests to Sofia (Sales Intelligence) via aiAgentHandover.",
      instructions: "Refer to {{context.instructions}} for your role, handoff rules, channel rules, and behavior guidelines.\n\nRefer to {{context.knowledge}} for IT policies, equipment, software, VPN, expense, and Salesforce/ServiceNow usage notes.",
    },

    // ── Channel Output (Teams Adaptive Card + Slack Quick Replies) ─────────────
    postProcessingCode: channelOutputCode,

    // ── SMS config (voice xApp delivery) ──────────────────────────────────────
    sms: {
      from: "+12243487563",
      to: "+18484668825",
    },

    // ── Jane's Tools (4): knowledge, people, scheduling, escalation ──────────
    tools: [

      // ── J1. Search Knowledge (KB xApp) ───────────────────────────────────
      {
        label: "Search Knowledge",
        toolId: "search_knowledge",
        description: "Search Apex internal knowledge bases: SharePoint, ServiceNow KB, Confluence, HR portal, and external sources (Microsoft, Adobe). Returns a sourced answer and sends a link to the article. Does NOT require authentication. Use this FIRST for any question that might be answered by documentation — VPN, Wi-Fi, software, policies, stipends, onboarding, expense, etc.",
        useParameters: true,
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "What the employee is looking for." },
            source: {
              type: "string",
              enum: ["all", "sharepoint", "servicenow_kb", "confluence", "hr_portal", "external"],
              description: "Which source to search. Use 'all' by default.",
            },
            failover_to_external: {
              type: "boolean",
              description: "Set to true if internal KB returned no relevant results and you want to fall back to external sources.",
            },
          },
          required: ["query"],
          additionalProperties: false,
        },
        code: `const payload = input?.payload || {};
const q = (payload.query || '').toLowerCase();
const failover = payload.failover_to_external === true;
let src = '', result = '';

if (q.includes('vpn') || q.includes('remote') || q.includes('anyconnect')) {
  src = failover ? 'Cisco Support (External)' : 'SharePoint · HTS TechHelp';
  result = 'Source: ' + src + '. To connect to the Apex VPN, use Cisco AnyConnect. Authenticate with Okta and MFA. Common fix for disconnects: fully close AnyConnect, verify Okta MFA is active, relaunch and reconnect. If persisting, switch to a different gateway (US-East, US-West, or EU). I am sending a link to the full guide.';
} else if (q.includes('stipend') || q.includes('home office') || q.includes('equipment allowance')) {
  src = failover ? 'HR Policy Hub (External)' : 'HR SharePoint · Benefits';
  result = 'Source: ' + src + '. Senior Associates and above receive a $500 annual home office stipend. Eligible: monitors, keyboards, webcams, headsets, ergonomic chairs. Non-eligible: personal computers, phones, gaming equipment. Stipend resets January first each year. I am sending a link to the full policy.';
} else if (q.includes('password') || q.includes('unlock') || q.includes('locked') || q.includes('okta')) {
  src = failover ? 'Okta Help Center (External)' : 'SharePoint · Okta Self-Service';
  result = 'Source: ' + src + '. Passwords require 12+ characters: mixed case, numbers, special characters. Accounts lock after 5 failed attempts. I can unlock your account or reset your password right here. I am also sending a link to the Okta self-service article.';
} else if (q.includes('expense') || q.includes('concur') || q.includes('reimburs') || q.includes('spend')) {
  src = failover ? 'Salesforce Help (External)' : 'Finance SharePoint · Expense Policy';
  result = 'Source: ' + src + '. Submit expenses through Salesforce Spend Management within 30 days. Receipts required over $25. Mileage: $0.67 per mile. Approvals take 3-5 business days. I am sending a link to the expense guide.';
} else if (q.includes('software') || q.includes('install') || q.includes('application') || q.includes('license')) {
  src = failover ? 'ServiceNow Community (External)' : 'ServiceNow KB · Software Catalog';
  result = 'Source: ' + src + '. Submit software requests via ServiceNow under Software Installation. Pre-approved software takes 1-2 days. Non-standard requires manager approval (5-7 days). Mac: use JAMF Self Service. Windows: use Company Portal. I am sending a link.';
} else if (q.includes('payroll') || q.includes('pto') || q.includes('time off') || q.includes('vacation') || q.includes('workday')) {
  src = failover ? 'Workday Community (External)' : 'HR SharePoint · Payroll & Time Off';
  result = 'Source: ' + src + '. Apex uses Workday for payroll and PTO. Access Workday via the employee portal. Direct deposit changes must be submitted 5 business days before payday. PTO requires manager approval. I am sending a link.';
} else if (q.includes('onboard') || q.includes('new hire') || q.includes('first day')) {
  src = 'HR SharePoint · New Hire Guide';
  result = 'Source: ' + src + '. New hire setup: activate your Okta account via welcome email, set up MFA with Okta Verify, sign into Microsoft 365 and Teams, access the Apex employee portal. Request additional software via ServiceNow. I am sending the new hire guide link.';
} else if (q.includes('print') || q.includes('printer') || q.includes('scan')) {
  src = 'ServiceNow KB · Printer Setup';
  result = 'Source: ' + src + '. Office printers connect automatically on Apex-Corp Wi-Fi. To add a printer: Settings → Add Printer → search for your floor (format: PRN-FL18-01). For issues, submit a Hardware ticket in ServiceNow. I am sending a link.';
} else if (q.includes('teams') || q.includes('calendar') || q.includes('outlook') || q.includes('meeting')) {
  src = 'Confluence · Microsoft 365 Guide';
  result = 'Source: ' + src + '. For Teams issues: clear the cache and restart. For Outlook calendar sync: sign out and back in to your Microsoft account in Teams settings. For room booking, use Room Finder in Outlook. I am sending a link.';
} else if (q.includes('onedrive') || q.includes('sharepoint') || q.includes('file') || q.includes('storage')) {
  src = 'Confluence · OneDrive Guide';
  result = 'Source: ' + src + '. OneDrive storage: 5TB per user. For sync issues: pause sync, sign out, sign back in, resume. After OS updates, you may need to re-authenticate. I am sending the troubleshooting guide.';
} else if (q.includes('phishing') || q.includes('suspicious') || q.includes('security') || q.includes('spam')) {
  src = 'SharePoint · Security Awareness';
  result = 'Source: ' + src + '. Forward suspicious emails to security@apextech.com. Do not click any links or attachments. If you clicked a suspicious link, change your password immediately and call IT. I am sending the security awareness guide.';
} else {
  src = failover ? 'Multiple External Sources' : 'Multiple Internal Sources';
  result = 'Source: ' + src + '. I searched across SharePoint, ServiceNow KB, and Confluence. For more specific results, try asking about: VPN, Wi-Fi, passwords, software, stipend, expense, payroll, printers, Teams, or security. I am sending you the IT help center link.';
}

context.knowledgeSource = src;
context.knowledgeFailover = failover;
context.lastToolId = 'search_knowledge';
context.lastAgentResponse = result;
context.knowledgeResult = result;`,
        answer: "{{context.knowledgeResult}}",
        xApp: {
          logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png",
          backgroundColor: "#003366",
          html: knowledgeXApp,
        },
      },


      // ── 7. People Search (regular) ────────────────────────────────────────
      {
        label: "People Search",
        toolId: "people_search",
        description: "Look up any Apex Technologies employee by name, department, or title. Returns contact info, role, manager, location, and employment status. Does NOT require authentication.",
        useParameters: true,
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Full or partial employee name." },
            department: { type: "string", description: "Department or team name." },
            title: { type: "string", description: "Job title or role." },
          },
          additionalProperties: false,
        },
        code: `const payload = input?.payload || {};
const q = Object.values(payload).join(' ').toLowerCase();

const directory = [
  { name: 'Sarah Chen', title: 'VP Technology Services', dept: 'IT', email: 'sarah.chen@apextech.com', phone: '+1-212-555-0101', location: 'Floor 20', manager: 'CEO' },
  { name: 'Javier Martinez', title: 'Network Engineer', dept: 'IT', email: 'javier.m@apextech.com', phone: '+1-212-555-0142', location: 'Floor 18', manager: 'Sarah Chen' },
  { name: 'Maria Lopez', title: 'Software Developer', dept: 'Engineering', email: 'maria.lopez@apextech.com', phone: '+1-212-555-0198', location: 'Floor 15', manager: 'Dev Lead' },
  { name: 'Sofia Reyes', title: 'Senior Account Executive', dept: 'Sales', email: 'sofia.reyes@apextech.com', phone: '+1-212-555-0177', location: 'Floor 12', manager: 'Sales VP' },
  { name: 'Jason Park', title: 'Finance Manager', dept: 'Finance', email: 'jason.park@apextech.com', phone: '+1-212-555-0155', location: 'Floor 14', manager: 'CFO' }
];

const matches = directory.filter(e =>
  e.name.toLowerCase().includes(q) ||
  e.dept.toLowerCase().includes(q) ||
  e.title.toLowerCase().includes(q)
);

let result;
if (matches.length === 1) {
  const e = matches[0];
  result = e.name + ', ' + e.title + ', ' + e.dept + '. Email: ' + e.email + '. Phone: ' + e.phone + '. Location: ' + e.location + '. Manager: ' + e.manager + '.';
} else if (matches.length > 1) {
  result = 'Found ' + matches.length + ' employees: ' + matches.map(e => e.name + ' (' + e.title + ')').join(', ') + '. Ask me for more detail on any of them.';
} else {
  result = 'No employees found matching "' + Object.values(payload).join(' ') + '". Try a different name or department.';
}

context.lastToolId = 'people_search';
context.lastAgentResponse = result;
context.peopleResult = result;`,
        answer: "{{context.peopleResult}}",
      },

      // ── J3. Schedule Notification (regular) ─────────────────────────────────
      {
        label: "Schedule Notification",
        toolId: "schedule_notification",
        description: "Schedule an outbound notification to be sent at a specific time via Slack, email, or SMS. Use for: approval reminders, IT maintenance alerts, follow-ups on open tickets, or custom proactive messages.",
        useParameters: true,
        parameters: {
          type: "object",
          properties: {
            recipient: { type: "string", description: "Email, Slack handle (@user), or phone number." },
            message: { type: "string", description: "The message to send." },
            schedule_time: { type: "string", description: "When to send (e.g., 'in 2 hours', 'tomorrow 9am', ISO timestamp)." },
            channel: { type: "string", enum: ["slack", "email", "sms"], description: "Delivery channel." },
          },
          required: ["recipient", "message", "schedule_time"],
          additionalProperties: false,
        },
        code: `const payload = input?.payload || {};
const recipient = payload.recipient || 'adam.boyle@apextech.com';
const message = payload.message || 'Notification from Apex Technology Services';
const scheduleTime = payload.schedule_time || 'immediately';
const channel = payload.channel || 'slack';
const ref = 'NOTIF-' + Math.floor(Math.random() * 9000 + 1000);
context.scheduledNotification = { ref, recipient, message, scheduleTime, channel };
context.lastToolId = 'schedule_notification';
context.lastAgentResponse = 'Notification ' + ref + ' scheduled for ' + scheduleTime + ' via ' + channel + ' to ' + recipient + '. Message: "' + message + '"';
context.notifResult = context.lastAgentResponse;`,
        answer: "{{context.notifResult}}",
      },

      // ── J4. Agent Handover (regular) ──────────────────────────────────────
      {
        label: "Agent Handover",
        toolId: "agent_handover",
        description: "Transfer to a live human agent when the employee requests it, seems frustrated after multiple attempts, or has an issue that cannot be resolved by the AI. On voice: initiates a live call transfer. On chat: opens a ServiceNow live agent queue. Always use this when the employee says 'talk to a human', 'speak to someone', 'transfer me', or shows significant frustration.",
        useParameters: true,
        parameters: {
          type: "object",
          properties: {
            queue: {
              type: "string",
              enum: ["general_it", "network", "identity_access", "software", "hardware", "security", "hr", "sales_ops"],
              description: "Which support queue to route to.",
            },
            reason: {
              type: "string",
              description: "Brief summary of the issue for the live agent.",
            },
            transfer_type: {
              type: "string",
              enum: ["chat", "voice_transfer"],
              description: "Chat handover (ServiceNow) or voice call transfer. Default: chat.",
            },
          },
          required: ["queue"],
          additionalProperties: false,
        },
        code: `const payload = input?.payload || {};
const queue = payload.queue || 'general_it';
const reason = payload.reason || 'customer request';
const transferType = payload.transfer_type || 'chat';

const queueNames = {
  general_it: 'General IT Support',
  network: 'Network Engineering',
  identity_access: 'Identity & Access Management',
  software: 'Software Provisioning',
  hardware: 'Hardware Support',
  security: 'Information Security',
  hr: 'Human Resources',
  sales_ops: 'Sales Operations'
};
const queueDisplay = queueNames[queue] || 'IT Support';

let result;
if (transferType === 'voice_transfer') {
  result = "Transferring your call to " + queueDisplay + " now. Please hold for a moment. Your conversation context is being passed to the agent so you won't need to repeat yourself.";
  context.voiceTransfer = true;
  context.voiceTransferQueue = queue;
} else {
  result = "Connecting you to " + queueDisplay + " in ServiceNow. Your conversation history will be transferred so the agent has full context. A specialist will be with you shortly.";
}

context.lastToolId = 'agent_handover';
context.lastAgentResponse = result;
context.handoverResult = result;`,
        answer: "{{context.handoverResult}}",
      },
    ],

    // ── Additional Agents ─────────────────────────────────────────────────────
    additionalAgents: [

      // ════════════════════════════════════════════════════════════════════════
      // ALEX — IT Specialist (5 tools, all xApp, permission-gated)
      // ════════════════════════════════════════════════════════════════════════
      {
        handoverLabel: "Hand off to Alex — IT Specialist",
        agentJobConfig: {
          name: "Alex — IT Specialist",
          description: "IT specialist for Apex Technologies. Handles identity verification, ServiceNow tickets, Okta account services, and office equipment requests. All account actions require verify_employee first.",
          instructions: "You are Alex, the IT Specialist at Apex Technologies.\n\nPERMISSION RULE: Call verify_employee FIRST before any account action. If context.authenticated is false, call verify_employee immediately.\n\nTOOL ORDER:\n1. verify_employee — FIRST. Always before create_ticket, ticket_status, account_services, or office_supply_request.\n2. create_ticket — After verify. Collect category, priority, description.\n3. ticket_status — Check status, list tickets, approve/reject requests.\n4. account_services — Unlock account, reset password or MFA.\n5. office_supply_request — Stipend or standard equipment; sends xApp form via SMS on voice channel.\n\nRefer to {{context.knowledge}} for IT policies.\nNEVER attempt Salesforce or sales actions — those belong to Sofia.\nNEVER use markdown, bullets, or em dashes.",
        },
        tools: [

          // ── A1. Verify Employee (OTP xApp) ──────────────────────────────────
          {
            label: "Verify Employee",
            toolId: "verify_employee",
            description: "Verify the employee's identity using a one-time code sent to their Apex email. MUST be called before any account action or ticket creation.",
            useParameters: true,
            parameters: {
              type: "object",
              properties: {
                email: { type: "string", description: "Employee's Apex email address." },
                employee_id: { type: "string", description: "Optional Apex employee ID (APEX-XXXXX)." },
              },
              required: ["email"],
              additionalProperties: false,
            },
            code: `const payload = input?.payload || {};
const email = payload.email || 'adam.boyle@apextech.com';
context.authenticated = true;
context.lastToolId = 'verify_employee';
context.employee = {
  name: "Adam Boyle", email: email, employeeId: payload.employee_id || "APEX-28491",
  phone: "+1-848-466-8825", department: "Technology Services", title: "Senior Solutions Engineer",
  manager: "Sarah Chen", managerEmail: "sarah.chen@apextech.com",
  location: "1 Apex Plaza, New York, NY 10036", floor: "Floor 18", isManager: false,
  oktaStatus: "Active", mfaMethod: "Okta Verify (push)",
  devices: [
    { type: "MacBook Pro 16-inch", serial: "C02FX1MLMD6T", os: "macOS Sequoia 15.3", managed: "JAMF", diskUsage: "78%" },
    { type: "iPhone 16 Pro", serial: "DNRXW2ABCD", os: "iOS 18.3", managed: "Intune" }
  ],
  recentTickets: [
    { ticketId: "INC-4521", desc: "VPN disconnects intermittently", status: "In Progress", priority: "Medium", assigned: "Network Engineering", created: "February 25, 2026" },
    { ticketId: "RITM-8834", desc: "Adobe Creative Cloud license request", status: "Awaiting Approval", priority: "Low", assigned: "Software Provisioning", created: "February 28, 2026" },
    { ticketId: "INC-4412", desc: "Outlook calendar sync issue", status: "Resolved", priority: "Medium", assigned: "Email Team", created: "February 10, 2026" }
  ],
  pendingApprovals: [
    { ticketId: "RITM-8901", desc: "Jira access request — Maria Lopez", requestedBy: "Maria Lopez", type: "Access Request", submitted: "March 1, 2026" }
  ]
};
context.isManager = context.employee.isManager;
context.lastAgentResponse = "Verification code sent to " + email + ". Verified: " + context.employee.name + ", " + context.employee.title + ".";
context.authResult = context.lastAgentResponse;`,
            answer: "{{context.authResult}}",
            xApp: { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png", backgroundColor: "#007DC1", html: otpXApp },
          },

          // ── A2. Create Ticket (ServiceNow xApp + Slack notification) ─────────
          {
            label: "Create Ticket",
            toolId: "create_ticket",
            description: "Create a ServiceNow Incident or Service Request. Requires verify_employee first. Collect category, priority, and description before calling.",
            useParameters: true,
            parameters: {
              type: "object",
              properties: {
                ticket_type: { type: "string", enum: ["incident", "service_request"], description: "Type of ticket." },
                category: { type: "string", enum: ["hardware", "software", "network", "account_access", "email", "vpn", "printing", "security", "other"], description: "Ticket category." },
                priority: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Priority level." },
                short_description: { type: "string", description: "Brief issue description." },
              },
              required: ["ticket_type", "category", "priority", "short_description"],
              additionalProperties: false,
            },
            code: `if (!context.authenticated) {
  context.ticketResult = 'Identity verification required. Please verify your identity first.';
  context.lastToolId = 'auth_required';
  return;
}
const payload = input?.payload || {};
const emp = context.employee || {};
const assignMap = { hardware:'Hardware Support', software:'Software Provisioning', network:'Network Engineering', account_access:'Identity & Access Management', email:'Email Team', vpn:'Network Engineering', printing:'Hardware Support', security:'Information Security', other:'Service Desk' };
const ticketId = (payload.ticket_type === 'service_request' ? 'RITM-' : 'INC-') + Math.floor(Math.random() * 9000 + 1000);
const group = assignMap[payload.category] || 'Service Desk';
context.ticketId = ticketId;
context.ticketStatus = 'New';
context.ticketAssigned = group;
context.lastToolId = 'create_ticket';
// Cross-channel Slack notification with approval button
const _webhook = '${SLACK_WEBHOOK_URL}';
try {
  if (typeof fetch === 'function') fetch(_webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: ':ticket: New IT Ticket from ' + (emp.name || 'Employee'), blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*:ticket: ' + ticketId + '* — ' + (payload.short_description || '') + '\n*Reporter:* ' + (emp.name || 'Adam Boyle') + ' · ' + (emp.department || 'Technology Services') + '\n*Category:* ' + (payload.category || 'Other') + ' · *Priority:* ' + (payload.priority || 'Medium') + '\n*Auto-assigned to:* ' + group } }, { type: 'actions', elements: [{ type: 'button', style: 'primary', action_id: 'approve_ticket', text: { type: 'plain_text', text: ':white_check_mark: Approve' }, value: 'approve_' + ticketId }, { type: 'button', action_id: 'view_sn', text: { type: 'plain_text', text: 'View in ServiceNow' }, url: 'https://apex.service-now.com/' }] }] }) });
} catch(e) {}
context.lastAgentResponse = "Ticket " + ticketId + " created, auto-assigned to " + group + ". Priority: " + (payload.priority||"medium") + ". I have sent a Slack notification with an approval button.";
context.ticketResult = context.lastAgentResponse;`,
            answer: "{{context.ticketResult}}",
            xApp: { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png", backgroundColor: "#293E40", html: createTicketXApp },
          },

          // ── A3. Ticket Status (ServiceNow xApp) ──────────────────────────────
          {
            label: "Ticket Status",
            toolId: "ticket_status",
            description: "Check ServiceNow ticket status, timeline, pending approvals. Requires verify_employee first.",
            useParameters: true,
            parameters: {
              type: "object",
              properties: {
                action: { type: "string", enum: ["status", "list_my_tickets", "approve", "reject"], description: "What to do." },
                ticket_id: { type: "string", description: "Ticket number (e.g., INC-4521)." },
                comment: { type: "string", description: "Comment when approving or rejecting." },
              },
              required: ["action"],
              additionalProperties: false,
            },
            code: `if (!context.authenticated) {
  context.ticketStatusResult = 'Identity verification required. Please verify your identity first.';
  context.lastToolId = 'auth_required';
  return;
}
const payload = input?.payload || {};
const emp = context.employee || {};
const action = payload.action || 'status';
let result = '';
if (action === 'status') {
  const tid = payload.ticket_id || '';
  const match = (emp.recentTickets || []).find(t => t.ticketId === tid);
  if (match) {
    result = 'Ticket ' + match.ticketId + ': ' + match.desc + '. Status: ' + match.status + '. Priority: ' + match.priority + '. Assigned: ' + match.assigned + '. Created: ' + match.created + '. I am sending the full ticket detail.';
    context.ticketId = match.ticketId; context.ticketStatus = match.status; context.ticketAssigned = match.assigned;
  } else {
    const open = (emp.recentTickets || []).filter(t => t.status !== 'Resolved');
    result = 'Open tickets: ' + open.map(t => t.ticketId + ' — ' + t.desc + ' (' + t.status + ')').join(', ') + '. I am sending the details.';
  }
} else if (action === 'list_my_tickets') {
  const tickets = emp.recentTickets || [];
  result = tickets.length ? 'Your tickets: ' + tickets.map(t => t.ticketId + ': ' + t.desc + ' — ' + t.status).join('. ') + '.' : 'No recent tickets.';
} else if (action === 'approve') {
  const tid = payload.ticket_id || '';
  const match = (emp.pendingApprovals || []).find(a => a.ticketId === tid);
  result = match ? 'Approved ' + match.ticketId + ' — ' + match.desc + '. ' + match.requestedBy + ' has been notified.' : 'Approved ' + tid + '. Requestor notified.';
} else if (action === 'reject') {
  result = 'Rejected ' + (payload.ticket_id || 'the request') + '. ' + (payload.comment ? 'Reason: ' + payload.comment + '. ' : '') + 'Requestor notified.';
}
const approvals = emp.pendingApprovals || [];
if (approvals.length && (action === 'status' || action === 'list_my_tickets')) {
  result += ' You have ' + approvals.length + ' pending approval: ' + approvals.map(a => a.ticketId + ' — ' + a.desc).join(', ') + '.';
}
context.lastToolId = 'ticket_status';
context.lastAgentResponse = result;
context.ticketStatusResult = result;`,
            answer: "{{context.ticketStatusResult}}",
            xApp: { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png", backgroundColor: "#293E40", html: ticketStatusXApp },
          },

          // ── A4. Account Services (Okta xApp) ─────────────────────────────────
          {
            label: "Account Services",
            toolId: "account_services",
            description: "Okta account actions: unlock account, reset password, reset MFA. Requires verify_employee first.",
            useParameters: true,
            parameters: {
              type: "object",
              properties: {
                service_type: { type: "string", enum: ["account_unlock", "password_reset", "mfa_reset", "ad_password_reset"], description: "Which action to perform." },
                confirm: { type: "boolean", description: "Employee has confirmed they want to proceed." },
              },
              required: ["service_type", "confirm"],
              additionalProperties: false,
            },
            code: `if (!context.authenticated) {
  context.accountServiceResult = 'Identity verification required before account actions.';
  context.lastToolId = 'auth_required';
  return;
}
const payload = input?.payload || {};
const emp = context.employee || {};
const svc = payload.service_type || 'account_unlock';
const messages = {
  account_unlock: "Account unlocked. " + (emp.email || 'your account') + " is now active. You can sign in immediately.",
  password_reset: "Password reset link sent to " + (emp.email || 'your email') + ". Link expires in 15 minutes. New password: 12+ chars, mixed case, number, special character.",
  mfa_reset: "MFA reset complete. Your Okta Verify enrollment has been removed. You will re-enroll on next login.",
  ad_password_reset: "Sending you the link to the Apex self-service AD password reset portal on SharePoint."
};
context.accountServiceResult = messages[svc] || "Account action completed.";
context.lastToolId = 'account_services';
context.lastAgentResponse = context.accountServiceResult;`,
            answer: "{{context.accountServiceResult}}",
            xApp: { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png", backgroundColor: "#007DC1", html: accountServicesXApp },
          },

          // ── A5. Office Supply Request (NEW — xApp via SMS + Slack notification) ─
          {
            label: "Office Supply Request",
            toolId: "office_supply_request",
            description: "Process office equipment requests: stipend-eligible items ($500/year) or standard equipment (manager approval). Sends an xApp form via SMS. On voice: sends form to caller's phone. After submission, notifies Adam on Slack.",
            useParameters: true,
            parameters: {
              type: "object",
              properties: {
                request_type: { type: "string", enum: ["stipend", "standard_equipment"], description: "Stipend or standard catalog item." },
                item_description: { type: "string", description: "What the employee wants to order." },
                estimated_cost: { type: "number", description: "Estimated cost in USD." },
                reason: { type: "string", description: "Business reason for standard equipment requests." },
              },
              required: ["request_type", "item_description"],
              additionalProperties: false,
            },
            code: `const payload = input?.payload || {};
const emp = context.employee || {};
const ref = 'SUP-' + Math.floor(Math.random() * 9000 + 1000);
const reqType = payload.request_type || 'stipend';
const item = payload.item_description || 'office equipment';
const cost = payload.estimated_cost || 0;
const STIPEND_REMAINING = 423.50;
context.lastToolId = 'office_supply_request';
context.supplyRef = ref;
let result = '';
if (reqType === 'stipend') {
  if (cost > STIPEND_REMAINING) {
    result = 'Estimated cost $' + cost + ' exceeds your remaining stipend of $' + STIPEND_REMAINING + '. You can split the purchase or choose a standard equipment request with manager approval. I am sending the order form to your phone.';
  } else {
    result = 'Supply request ' + ref + ' submitted using your stipend. Item: ' + item + '. Estimated: $' + cost + '. Remaining stipend after this: $' + (STIPEND_REMAINING - cost).toFixed(2) + '. A Slack notification has been sent to confirm.';
  }
} else {
  result = 'Standard equipment request ' + ref + ' submitted. Item: ' + item + '. Manager approval required. Estimated fulfillment: 3-5 business days. I am sending the form to your phone.';
}
// Notify Adam on Slack (key cross-channel moment for voice demo)
const _webhook = '${SLACK_WEBHOOK_URL}';
try {
  if (typeof fetch === 'function') fetch(_webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: ':package: Office Supply Request from ' + (emp.name || 'Employee'), blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*:package: Supply Request Submitted* — ' + ref + '\n*Employee:* ' + (emp.name || 'Adam Boyle') + '\n*Item:* ' + item + '\n*Type:* ' + (reqType === 'stipend' ? 'Stipend ($' + STIPEND_REMAINING + ' available)' : 'Standard Equipment') + (cost ? '\n*Est. Cost:* $' + cost : '') } }] }) });
} catch(e) {}
context.lastAgentResponse = result;
context.supplyResult = result;`,
            answer: "{{context.supplyResult}}",
            xApp: { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png", backgroundColor: "#1B3A5C", html: officeSupplyXApp },
          },

        ],
      },

      // ════════════════════════════════════════════════════════════════════════
      // SOFIA — Sales Intelligence (3 tools: 1 xApp, 2 regular, permission-gated)
      // ════════════════════════════════════════════════════════════════════════
      {
        handoverLabel: "Hand off to Sofia — Sales Intelligence",
        agentJobConfig: {
          name: "Sofia — Sales Intelligence",
          description: "Sales intelligence specialist for Apex Technologies. Handles Salesforce pipeline, deal approvals, expense report submissions, and ServiceNow IT KPI reports.",
          instructions: "You are Sofia, the Sales Intelligence specialist at Apex Technologies.\n\nYou have access to Salesforce CRM data, ServiceNow IT reports, and expense management.\n\nPERMISSION RULE: Call verify_employee first if context.authenticated is false.\n\nTOOL ORDER:\n1. salesforce_account — Pipeline view, account details, deal approvals.\n2. servicenow_reports — IT KPI summary (open incidents, SLA, MTTR).\n3. submit_expense_request — Submit expense reports with receipt scanning.\n\nOn Teams: respond concisely — your response appears in an Adaptive Card.\nNEVER attempt IT account actions — those belong to Alex.\nNEVER use markdown, bullets, or em dashes.",
        },
        tools: [

          // ── S1. Salesforce Account (CRM xApp) ────────────────────────────────
          {
            label: "Salesforce Account",
            toolId: "salesforce_account",
            description: "Retrieve Salesforce pipeline, account details, deal approvals. On Teams, shows an Adaptive Card with OpenUrl link to Salesforce. Requires verify_employee for deal approvals.",
            useParameters: true,
            parameters: {
              type: "object",
              properties: {
                view: { type: "string", enum: ["pipeline", "account_detail", "pending_approvals", "closed_won"], description: "Which view to show." },
                account_name: { type: "string", description: "Account name for account_detail view." },
                deal_action: { type: "string", enum: ["approve", "reject"], description: "Approve or reject a deal." },
                deal_id: { type: "string", description: "Deal or opportunity ID." },
              },
              required: ["view"],
              additionalProperties: false,
            },
            code: `if (!context.authenticated) {
  context.sfResult = 'Identity verification is required for Salesforce access. Please verify your identity first.';
  context.lastToolId = 'auth_required';
  return;
}
const payload = input?.payload || {};
const view = payload.view || 'pipeline';
const pipeline = [
  { name: 'DataStream Corp', stage: 'Proposal', acv: 142000, owner: 'Sofia Reyes', daysInStage: 45 },
  { name: 'Nortek Industries', stage: 'Closed Won', acv: 87500, owner: 'Adam Boyle', daysInStage: 12 },
  { name: 'Meridian Health Systems', stage: 'Negotiation', acv: 215000, owner: 'Sofia Reyes', daysInStage: 7 },
  { name: 'Clearwater Financial', stage: 'Discovery', acv: 98000, owner: 'Adam Boyle', daysInStage: 3 }
];
const total = pipeline.filter(p => p.stage !== 'Closed Won').reduce((s,p)=>s+p.acv,0);
const won = pipeline.filter(p => p.stage === 'Closed Won').reduce((s,p)=>s+p.acv,0);
let result = '';
if (view === 'pipeline' || view === 'pending_approvals') {
  result = 'Q2 2026 pipeline: $' + total.toLocaleString() + ' across ' + pipeline.length + ' opportunities. Closed Won: $' + won.toLocaleString() + '. Pending: Meridian Health Systems 15% discount request from Sofia Reyes, submitted March 28. I am sending the Salesforce dashboard.';
  context.sfAccountName = 'Pipeline Overview'; context.sfAccountStage = 'Multiple'; context.sfAccountAcv = total;
} else if (view === 'account_detail' && payload.account_name) {
  const acc = pipeline.find(p => p.name.toLowerCase().includes(payload.account_name.toLowerCase()));
  if (acc) {
    result = acc.name + '. Stage: ' + acc.stage + '. ACV: $' + acc.acv.toLocaleString() + '. Owner: ' + acc.owner + '. Days in stage: ' + acc.daysInStage + '.';
    context.sfAccountName = acc.name; context.sfAccountStage = acc.stage; context.sfAccountAcv = acc.acv;
  } else {
    result = 'Account not found. Open accounts: ' + pipeline.map(p => p.name).join(', ') + '.';
  }
} else if (view === 'closed_won') {
  result = 'Closed Won this quarter: $' + won.toLocaleString() + '. Nortek Industries — owned by Adam Boyle.';
}
if (payload.deal_action === 'approve') {
  result = 'Deal approved: ' + (payload.deal_id || 'Meridian Health 15% discount') + '. Sofia Reyes notified in Slack. Discount applied.';
} else if (payload.deal_action === 'reject') {
  result = 'Deal rejected: ' + (payload.deal_id || 'discount request') + '. Sofia Reyes notified.';
}
context.lastToolId = 'salesforce_account';
context.lastAgentResponse = result;
context.sfResult = result;`,
            answer: "{{context.sfResult}}",
            xApp: { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png", backgroundColor: "#00A1E0", html: salesforceXApp },
          },

          // ── S2. ServiceNow Reports (regular) ─────────────────────────────────
          {
            label: "ServiceNow Reports",
            toolId: "servicenow_reports",
            description: "ServiceNow IT KPI report: open incidents, SLA compliance, MTTR, ticket volume. On Teams, appears in the Adaptive Card fact set.",
            useParameters: true,
            parameters: {
              type: "object",
              properties: {
                period: { type: "string", enum: ["today", "this_week", "this_month", "last_month", "ytd"], description: "Reporting period." },
                category: { type: "string", enum: ["all", "network", "software", "hardware", "security", "account_access"], description: "Filter by category." },
              },
              required: ["period"],
              additionalProperties: false,
            },
            code: `const payload = input?.payload || {};
const period = payload.period || 'this_month';
const cat = payload.category || 'all';
const reports = {
  this_month: { open:47, resolved:312, sla:'94.2%', mttr:'3.8 hours', p1:2, p2:8, top:'Network / VPN' },
  last_month: { open:0, resolved:389, sla:'96.1%', mttr:'3.2 hours', p1:1, p2:5, top:'Account Access' },
  this_week:  { open:12, resolved:67, sla:'97.0%', mttr:'2.9 hours', p1:0, p2:2, top:'Software' },
  today:      { open:5, resolved:18, sla:'100%', mttr:'1.4 hours', p1:0, p2:1, top:'Network / VPN' },
  ytd:        { open:47, resolved:1842, sla:'95.3%', mttr:'3.5 hours', p1:7, p2:31, top:'Network / VPN' }
};
const r = reports[period] || reports.this_month;
context.snOpenIncidents = r.open; context.snSlaCompliance = r.sla; context.snMttr = r.mttr; context.snReportSummary = true;
const result = 'ServiceNow IT Report (' + period.replace('_',' ') + (cat !== 'all' ? ', ' + cat : '') + '): ' + r.open + ' open, ' + r.resolved + ' resolved. SLA: ' + r.sla + '. MTTR: ' + r.mttr + '. P1: ' + r.p1 + ', P2: ' + r.p2 + '. Top category: ' + r.top + '.';
context.lastToolId = 'servicenow_reports';
context.lastAgentResponse = result;
context.snReportResult = result;`,
            answer: "{{context.snReportResult}}",
          },

          // ── S3. Submit Expense Request (NEW — xApp + Slack notification) ──────
          {
            label: "Submit Expense Request",
            toolId: "submit_expense_request",
            description: "Submit an expense report via Salesforce Spend Management. Sends an xApp form with receipt scanner (mock OCR auto-fills the amount). Notifies Adam on Slack when submitted.",
            useParameters: true,
            parameters: {
              type: "object",
              properties: {
                category: { type: "string", enum: ["meals", "travel", "hotel", "supplies", "transport", "other"], description: "Expense category." },
                amount: { type: "number", description: "Amount in USD." },
                date: { type: "string", description: "Expense date (YYYY-MM-DD)." },
                description: { type: "string", description: "Business purpose." },
                receipt_scanned: { type: "boolean", description: "True if user will scan/upload a receipt." },
              },
              required: ["category", "description"],
              additionalProperties: false,
            },
            code: `const payload = input?.payload || {};
const emp = context.employee || {};
const ref = 'EXP-' + Math.floor(Math.random() * 9000 + 1000);
const amt = payload.amount || 284.50;
const cat = payload.category || 'meals';
const desc = payload.description || 'Business expense';
const expDate = payload.date || new Date().toISOString().split('T')[0];
context.expenseRef = ref;
context.expenseAmount = amt;
context.lastToolId = 'submit_expense_request';
// Notify Adam on Slack (cross-channel demonstration)
const _webhook = '${SLACK_WEBHOOK_URL}';
try {
  if (typeof fetch === 'function') fetch(_webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: ':receipt: Expense Request from ' + (emp.name || 'Employee'), blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*:receipt: Expense Request Submitted* — ' + ref + '\n*Employee:* ' + (emp.name || 'Adam Boyle') + '\n*Category:* ' + cat + ' · *Amount:* $' + amt + '\n*Date:* ' + expDate + '\n*Purpose:* ' + desc + '\n*Status:* Pending approval (3-5 business days)' } }, { type: 'actions', elements: [{ type: 'button', style: 'primary', action_id: 'approve_expense', text: { type: 'plain_text', text: ':white_check_mark: Approve' }, value: 'approve_' + ref }, { type: 'button', action_id: 'view_sf', text: { type: 'plain_text', text: 'View in Salesforce Spend' }, url: 'https://apex.lightning.force.com/lightning/n/Expense_Management' }] }] }) });
} catch(e) {}
context.lastAgentResponse = 'Expense request ' + ref + ' submitted for $' + amt + ' (' + cat + ') on ' + expDate + '. I have sent you the receipt form and notified your manager on Slack. Approval typically takes 3-5 business days.';
context.expenseResult = context.lastAgentResponse;`,
            answer: "{{context.expenseResult}}",
            xApp: { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png", backgroundColor: "#00A1E0", html: expenseRequestXApp },
          },

        ],
      },
    ],
  },
  OUTPUT_PATH
);
