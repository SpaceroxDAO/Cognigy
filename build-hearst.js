/**
 * Build Hearst Technology Services - AI IT Assistant Demo Package (v2)
 * Employee-facing IT support assistant (chat-first: Teams/Slack/Web)
 * xApp-rich: OTP auth, ServiceNow forms, Concur portal, Okta status, Device health
 * Replaces Moveworks with Cognigy AI Agent + full integration simulation
 */
const { cloneAndModify } = require("./cognigy-package-generator/clone-and-modify");

const SOURCE_DIR = "/Users/Adam.Boyle/Cognigy/credit-card-analysis";
const OUTPUT_PATH = "/Users/Adam.Boyle/Cognigy/Hearst-IT-Assistant-Demo.zip";

// ─── xApp HTML Templates ────────────────────────────────────────────────────

const xAppCSS = `
  html, body { margin:0; padding:0; font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; background:#f3f4f6; overflow-x:hidden; }
  body { min-height:100vh; min-height:100dvh; padding-top:calc(env(safe-area-inset-top)+12px); padding-bottom:calc(env(safe-area-inset-bottom)+12px); }
  .fade-in { opacity:0; transform:translateY(6px); animation:fadeIn .35s ease-out forwards; }
  @keyframes fadeIn { to { opacity:1; transform:translateY(0); } }
  button,a { -webkit-tap-highlight-color:transparent; }
`;

// 1. OTP Entry xApp (Okta-branded)
const otpXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Verify Identity - Hearst Okta</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${xAppCSS}
  .otp-input { width:48px; height:56px; text-align:center; font-size:24px; font-weight:700; border:2px solid #d1d5db; border-radius:12px; outline:none; transition:border-color .2s; }
  .otp-input:focus { border-color:#007DC1; box-shadow:0 0 0 3px rgba(0,125,193,.15); }
</style>
</head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-md mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="relative overflow-hidden">
    <div class="bg-[#007DC1] text-white px-5 py-4">
      <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/15 blur-2xl"></div>
      <div class="relative flex items-center gap-3">
        <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#007DC1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div><p class="text-xs text-white/80">Hearst Technology Services</p><h1 class="text-lg font-extrabold">Identity Verification</h1></div>
      </div>
    </div>
  </header>
  <div class="p-5 space-y-5">
    <div class="text-center fade-in" style="animation-delay:60ms">
      <div class="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007DC1" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </div>
      <h2 class="text-gray-900 font-semibold text-lg">Check your email</h2>
      <p class="text-gray-500 text-sm mt-1">We sent a 6-digit verification code to</p>
      <p class="text-gray-900 font-semibold text-sm mt-1">adam.boyle@hearst.com</p>
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
      class="w-full px-4 py-3 rounded-xl bg-[#007DC1] hover:brightness-95 text-white font-semibold text-sm shadow transition focus:outline-none fade-in disabled:opacity-50"
      style="animation-delay:180ms" disabled>Verify Code</button>
    <div class="text-center fade-in" style="animation-delay:240ms">
      <button onclick="resendCode()" class="text-[#007DC1] text-sm font-medium hover:underline" id="resend-btn">Resend Code</button>
      <p class="text-gray-400 text-xs mt-2" id="resend-timer"></p>
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
    document.getElementById('resend-timer').classList.add('hidden');
    setTimeout(()=>{if(window.SDK&&SDK.submit)SDK.submit({action:'verified',code:code});},1500);
  },1200);
}
function resendCode(){
  const rb=document.getElementById('resend-btn'),rt=document.getElementById('resend-timer');
  rb.disabled=true;rb.classList.add('opacity-50');rt.textContent='Code resent. Wait 30s to resend again.';
  let s=30;const iv=setInterval(()=>{s--;rt.textContent='Resend available in '+s+'s';if(s<=0){clearInterval(iv);rb.disabled=false;rb.classList.remove('opacity-50');rt.textContent='';}},1000);
}
</script>
</body></html>`;

// 2. Knowledge Article xApp (SharePoint/Confluence-branded)
const knowledgeXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Knowledge Article - Hearst</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${xAppCSS}</style>
</head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-lg mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="relative overflow-hidden">
    <div class="bg-[#036] text-white px-5 py-4">
      <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/15 blur-2xl"></div>
      <div class="relative flex items-center gap-3">
        <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#036"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" fill="white" opacity=".3"/></svg>
        </div>
        <div><p class="text-xs text-white/80">HTS Knowledge Base</p><h1 class="text-lg font-extrabold">Knowledge Article</h1></div>
      </div>
    </div>
  </header>
  <div class="p-5 space-y-4">
    <div class="fade-in" style="animation-delay:60ms">
      <div class="flex items-center gap-2 mb-2">
        <span class="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">SharePoint</span>
        <span class="inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">Verified</span>
      </div>
      <h2 class="text-gray-900 font-bold text-lg leading-tight">VPN Connection Troubleshooting Guide</h2>
      <p class="text-gray-500 text-xs mt-1">Last updated: February 28, 2026 &bull; HTS TechHelp &bull; 4 min read</p>
    </div>
    <div class="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3 fade-in" style="animation-delay:120ms">
      <h3 class="text-gray-900 font-semibold text-sm">Quick Resolution Steps</h3>
      <div class="space-y-2">
        <div class="flex gap-3"><span class="shrink-0 w-6 h-6 rounded-full bg-[#036] text-white text-xs font-bold flex items-center justify-center">1</span><p class="text-gray-700 text-sm">Disconnect from VPN and close Cisco AnyConnect completely</p></div>
        <div class="flex gap-3"><span class="shrink-0 w-6 h-6 rounded-full bg-[#036] text-white text-xs font-bold flex items-center justify-center">2</span><p class="text-gray-700 text-sm">Verify Okta MFA is working (open Okta Verify, confirm you can approve a push)</p></div>
        <div class="flex gap-3"><span class="shrink-0 w-6 h-6 rounded-full bg-[#036] text-white text-xs font-bold flex items-center justify-center">3</span><p class="text-gray-700 text-sm">Relaunch AnyConnect and connect to the nearest gateway (US-East, US-West, or EU)</p></div>
        <div class="flex gap-3"><span class="shrink-0 w-6 h-6 rounded-full bg-[#036] text-white text-xs font-bold flex items-center justify-center">4</span><p class="text-gray-700 text-sm">If still failing, check Wi-Fi signal strength and try switching to a wired connection</p></div>
      </div>
    </div>
    <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 fade-in" style="animation-delay:180ms">
      <div class="flex gap-2 items-start">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#d97706" class="shrink-0 mt-0.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        <p class="text-amber-800 text-xs">If VPN disconnects persist after these steps, create a ServiceNow ticket (Category: Network, Priority: Medium). Include your OS version and AnyConnect version.</p>
      </div>
    </div>
    <div class="flex gap-2 fade-in" style="animation-delay:240ms">
      <span class="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium">VPN</span>
      <span class="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium">Network</span>
      <span class="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium">AnyConnect</span>
      <span class="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium">Remote Work</span>
    </div>
    <button onclick="if(window.SDK&&SDK.submit){SDK.submit({action:'close'})}"
      class="w-full px-4 py-3 rounded-xl bg-[#036] hover:brightness-95 text-white font-semibold text-sm shadow transition fade-in" style="animation-delay:300ms">Close</button>
  </div>
</div></div>
</body></html>`;

// 3. Create Ticket xApp (ServiceNow-branded form with autofill)
const createTicketXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>New Ticket - ServiceNow</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${xAppCSS}
  select,input,textarea { font-size:14px; }
</style>
</head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-lg mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="relative overflow-hidden">
    <div class="bg-[#293E40] text-white px-5 py-4">
      <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
      <div class="relative flex items-center gap-3">
        <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#81B5A1"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div><p class="text-xs text-white/70">ServiceNow</p><h1 class="text-lg font-extrabold">Create Ticket</h1></div>
      </div>
    </div>
  </header>
  <div class="p-5 space-y-4">
    <div class="grid grid-cols-2 gap-3 fade-in" style="animation-delay:60ms">
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-gray-500 text-[10px] uppercase tracking-wide">Reporter</p>
        <p class="text-gray-900 text-sm font-semibold">Adam Boyle</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-gray-500 text-[10px] uppercase tracking-wide">Employee ID</p>
        <p class="text-gray-900 text-sm font-semibold">HTS-28491</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-gray-500 text-[10px] uppercase tracking-wide">Department</p>
        <p class="text-gray-900 text-sm font-semibold">Technology Services</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-gray-500 text-[10px] uppercase tracking-wide">Location</p>
        <p class="text-gray-900 text-sm font-semibold">300 W 57th St, FL 22</p>
      </div>
    </div>
    <div class="space-y-3 fade-in" style="animation-delay:120ms">
      <div>
        <label class="block text-gray-700 text-xs font-semibold mb-1">Ticket Type</label>
        <select id="f-type" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#81B5A1]">
          <option value="incident" selected>Incident</option><option value="service_request">Service Request</option><option value="change_request">Change Request</option>
        </select>
      </div>
      <div>
        <label class="block text-gray-700 text-xs font-semibold mb-1">Category</label>
        <select id="f-cat" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#81B5A1]">
          <option value="network" selected>Network / VPN</option><option value="software">Software</option><option value="hardware">Hardware</option>
          <option value="account_access">Account / Access</option><option value="email">Email / Calendar</option><option value="printing">Printing</option><option value="other">Other</option>
        </select>
      </div>
      <div>
        <label class="block text-gray-700 text-xs font-semibold mb-1">Priority</label>
        <div class="flex gap-2">
          <button onclick="setPri(this,'low')" class="pri-btn flex-1 py-2 rounded-lg border text-xs font-semibold border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 transition">Low</button>
          <button onclick="setPri(this,'medium')" class="pri-btn flex-1 py-2 rounded-lg border text-xs font-semibold border-amber-300 text-amber-700 bg-amber-50 ring-2 ring-amber-200 transition">Medium</button>
          <button onclick="setPri(this,'high')" class="pri-btn flex-1 py-2 rounded-lg border text-xs font-semibold border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 transition">High</button>
          <button onclick="setPri(this,'critical')" class="pri-btn flex-1 py-2 rounded-lg border text-xs font-semibold border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 transition">Critical</button>
        </div>
      </div>
      <div>
        <label class="block text-gray-700 text-xs font-semibold mb-1">Short Description</label>
        <input id="f-desc" type="text" value="VPN disconnects intermittently when connected to US-East gateway" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#81B5A1]"/>
      </div>
      <div>
        <label class="block text-gray-700 text-xs font-semibold mb-1">Additional Details</label>
        <textarea id="f-notes" rows="3" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#81B5A1] resize-none" placeholder="Include error messages, steps to reproduce, etc."></textarea>
      </div>
    </div>
    <button id="submit-btn" onclick="submitTicket()"
      class="w-full px-4 py-3 rounded-xl bg-[#293E40] hover:brightness-110 text-white font-semibold text-sm shadow transition fade-in" style="animation-delay:180ms">Submit Ticket</button>
    <div id="success-section" class="hidden text-center fade-in">
      <div class="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <p class="text-green-700 font-bold text-lg">Ticket Created</p>
      <p class="text-gray-900 font-semibold mt-1" id="ticket-id-display">INC-4587</p>
      <p class="text-gray-500 text-sm mt-1">Auto-assigned to <span class="font-semibold text-gray-700" id="assigned-display">Network Team</span></p>
    </div>
  </div>
</div></div>
<script>
let priority='medium';
function setPri(el,p){priority=p;document.querySelectorAll('.pri-btn').forEach(b=>{b.className='pri-btn flex-1 py-2 rounded-lg border text-xs font-semibold border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 transition';});
  const colors={low:'border-blue-300 text-blue-700 bg-blue-50 ring-2 ring-blue-200',medium:'border-amber-300 text-amber-700 bg-amber-50 ring-2 ring-amber-200',high:'border-orange-300 text-orange-700 bg-orange-50 ring-2 ring-orange-200',critical:'border-red-300 text-red-700 bg-red-50 ring-2 ring-red-200'};
  el.className='pri-btn flex-1 py-2 rounded-lg border text-xs font-semibold transition '+colors[p];}
function submitTicket(){
  const btn=document.getElementById('submit-btn');btn.textContent='Creating...';btn.disabled=true;
  const cat=document.getElementById('f-cat').value;
  const assign={network:'Network Team',software:'Software Provisioning',hardware:'Hardware Support',account_access:'Identity & Access Management',email:'Email Team',printing:'Hardware Support',other:'Service Desk'};
  const tid='INC-'+Math.floor(Math.random()*9000+1000);
  setTimeout(()=>{
    btn.classList.add('hidden');
    document.getElementById('ticket-id-display').textContent=tid;
    document.getElementById('assigned-display').textContent=assign[cat]||'Service Desk';
    document.getElementById('success-section').classList.remove('hidden');
    setTimeout(()=>{if(window.SDK&&SDK.submit)SDK.submit({action:'ticket_created',ticketId:tid,category:cat,priority:priority});},2000);
  },1500);
}
</script>
</body></html>`;

// 4. Ticket Status / Approval xApp (ServiceNow-branded)
const ticketStatusXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Ticket Detail - ServiceNow</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${xAppCSS}</style>
</head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-lg mx-auto space-y-4">

<!-- Ticket Detail Card -->
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="relative overflow-hidden">
    <div class="bg-[#293E40] text-white px-5 py-4">
      <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
      <div class="relative flex items-center gap-3">
        <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#81B5A1"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div><p class="text-xs text-white/70">ServiceNow</p><h1 class="text-lg font-extrabold">Ticket Details</h1></div>
      </div>
    </div>
  </header>
  <div class="p-5 space-y-4">
    <div class="flex items-center justify-between fade-in" style="animation-delay:60ms">
      <div><p class="text-gray-900 font-bold text-lg">INC-4521</p><p class="text-gray-500 text-xs">Opened February 25, 2026</p></div>
      <span class="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold">In Progress</span>
    </div>
    <div class="rounded-xl bg-gray-50 border border-gray-200 p-4 fade-in" style="animation-delay:90ms">
      <p class="text-gray-500 text-[10px] uppercase tracking-wide mb-1">Description</p>
      <p class="text-gray-900 text-sm font-medium">VPN disconnects intermittently when connected to US-East gateway</p>
    </div>
    <div class="grid grid-cols-2 gap-3 fade-in" style="animation-delay:120ms">
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-gray-500 text-[10px] uppercase tracking-wide">Priority</p>
        <p class="text-amber-600 text-sm font-bold">Medium</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-gray-500 text-[10px] uppercase tracking-wide">Assigned To</p>
        <p class="text-gray-900 text-sm font-semibold">Network Team</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-gray-500 text-[10px] uppercase tracking-wide">Reporter</p>
        <p class="text-gray-900 text-sm font-semibold">Adam Boyle</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-gray-500 text-[10px] uppercase tracking-wide">Updated</p>
        <p class="text-gray-900 text-sm font-semibold">March 3, 2026</p>
      </div>
    </div>
    <div class="space-y-3 fade-in" style="animation-delay:150ms">
      <p class="text-gray-900 font-semibold text-sm">Activity</p>
      <div class="border-l-2 border-gray-200 pl-4 space-y-3">
        <div><p class="text-gray-900 text-sm font-medium">Robert Chang (Network Team)</p><p class="text-gray-500 text-xs">March 3 - Identified intermittent packet loss on US-East gateway. Investigating upstream ISP issue. Temporary workaround: use US-West gateway.</p></div>
        <div><p class="text-gray-900 text-sm font-medium">Auto-Triage</p><p class="text-gray-500 text-xs">Feb 25 - Classified as Network/VPN. Assigned to Network Team. Priority: Medium.</p></div>
      </div>
    </div>
  </div>
</div>

<!-- Pending Approval Card -->
<div class="bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
  <div class="bg-amber-50 px-5 py-3 border-b border-amber-200">
    <div class="flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#d97706"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-4h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
      <p class="text-amber-800 font-bold text-sm">Pending Your Approval</p>
    </div>
  </div>
  <div class="p-5 space-y-4" id="approval-section">
    <div class="flex items-center justify-between fade-in" style="animation-delay:200ms">
      <div><p class="text-gray-900 font-bold">RITM-8901</p><p class="text-gray-500 text-xs">Service Request &bull; Submitted March 1, 2026</p></div>
      <span id="approval-badge" class="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold">Awaiting Approval</span>
    </div>
    <div class="rounded-xl bg-gray-50 border border-gray-200 p-4 fade-in" style="animation-delay:230ms">
      <p class="text-gray-500 text-[10px] uppercase tracking-wide mb-1">Request</p>
      <p class="text-gray-900 text-sm font-medium">Jira access request</p>
      <p class="text-gray-500 text-xs mt-1">Requested by: <span class="font-semibold text-gray-700">Maria Lopez</span> &bull; Software Engineer &bull; Technology Services</p>
      <p class="text-gray-500 text-xs mt-1">Business justification: Need Jira access for sprint planning and bug tracking on Project Atlas.</p>
    </div>
    <div id="approval-buttons" class="flex gap-3 fade-in" style="animation-delay:260ms">
      <button onclick="handleApproval('approved')" class="flex-1 px-4 py-3 rounded-xl bg-green-600 hover:brightness-95 text-white font-semibold text-sm shadow transition">Approve</button>
      <button onclick="handleApproval('rejected')" class="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:brightness-95 text-white font-semibold text-sm shadow transition">Reject</button>
    </div>
    <div id="approval-result" class="hidden text-center fade-in">
      <div id="result-icon" class="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2"></div>
      <p id="result-text" class="font-semibold"></p>
      <p class="text-gray-500 text-xs mt-1">Maria Lopez will be notified</p>
    </div>
  </div>
</div>

<button onclick="if(window.SDK&&SDK.submit){SDK.submit({action:'close'})}"
  class="w-full px-4 py-3 rounded-xl bg-[#293E40] hover:brightness-110 text-white font-semibold text-sm shadow transition fade-in" style="animation-delay:300ms">Close</button>
</div>
<script>
function handleApproval(decision){
  const btns=document.getElementById('approval-buttons');btns.classList.add('hidden');
  const badge=document.getElementById('approval-badge');
  const result=document.getElementById('approval-result');
  const icon=document.getElementById('result-icon');
  const text=document.getElementById('result-text');
  if(decision==='approved'){
    badge.className='inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold';
    badge.textContent='Approved';
    icon.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    icon.className='mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2';
    text.textContent='Request Approved';text.className='font-semibold text-green-700';
  } else {
    badge.className='inline-flex items-center rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-bold';
    badge.textContent='Rejected';
    icon.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    icon.className='mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2';
    text.textContent='Request Rejected';text.className='font-semibold text-red-700';
  }
  result.classList.remove('hidden');
  setTimeout(()=>{if(window.SDK&&SDK.submit)SDK.submit({action:decision,ticketId:'RITM-8901'});},2000);
}
</script>
</body></html>`;

// 5. Account Services xApp (Okta-branded action status)
const accountServicesXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Account Action - Okta</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${xAppCSS}
  @keyframes checkDraw { from { stroke-dashoffset:24; } to { stroke-dashoffset:0; } }
  .check-anim polyline { stroke-dasharray:24; stroke-dashoffset:24; animation: checkDraw .5s ease-out .3s forwards; }
  @keyframes pulse-ring { 0% { box-shadow:0 0 0 0 rgba(0,125,193,.3); } 70% { box-shadow:0 0 0 12px rgba(0,125,193,0); } 100% { box-shadow:0 0 0 0 rgba(0,125,193,0); } }
</style>
</head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-md mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="relative overflow-hidden">
    <div class="bg-[#007DC1] text-white px-5 py-4">
      <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/15 blur-2xl"></div>
      <div class="relative flex items-center gap-3">
        <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#007DC1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div><p class="text-xs text-white/80">Okta Identity Management</p><h1 class="text-lg font-extrabold">Account Action</h1></div>
      </div>
    </div>
  </header>
  <div class="p-5 space-y-4">
    <!-- Processing state -->
    <div id="processing" class="text-center py-6 fade-in">
      <div class="mx-auto w-16 h-16 rounded-full border-4 border-gray-200 border-t-[#007DC1] animate-spin mb-4"></div>
      <p class="text-gray-900 font-semibold">Processing account action...</p>
      <p class="text-gray-500 text-sm mt-1">Connecting to Okta</p>
    </div>
    <!-- Success state -->
    <div id="success" class="hidden space-y-4">
      <div class="text-center fade-in">
        <div class="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3" style="animation:pulse-ring 1.5s ease-out 1">
          <svg class="check-anim" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 class="text-gray-900 font-bold text-xl" id="action-title">Account Unlocked</h2>
        <p class="text-gray-500 text-sm mt-1" id="action-desc">Your Okta account has been unlocked successfully</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2 fade-in" style="animation-delay:120ms">
        <div class="flex justify-between"><span class="text-gray-500 text-xs">Account</span><span class="text-gray-900 text-sm font-semibold">adam.boyle@hearst.com</span></div>
        <div class="flex justify-between"><span class="text-gray-500 text-xs">Action</span><span class="text-gray-900 text-sm font-semibold" id="action-type">Account Unlock</span></div>
        <div class="flex justify-between"><span class="text-gray-500 text-xs">Status</span><span class="text-green-700 text-sm font-bold">Complete</span></div>
        <div class="flex justify-between"><span class="text-gray-500 text-xs">Timestamp</span><span class="text-gray-900 text-sm font-semibold" id="timestamp"></span></div>
      </div>
      <div class="rounded-xl bg-blue-50 border border-blue-200 p-3 fade-in" style="animation-delay:180ms">
        <p class="text-blue-800 text-xs">A push notification has been sent to your Okta Verify app. You can now log in with your existing password.</p>
      </div>
    </div>
    <button onclick="if(window.SDK&&SDK.submit){SDK.submit({action:'close'})}"
      class="w-full px-4 py-3 rounded-xl bg-[#007DC1] hover:brightness-95 text-white font-semibold text-sm shadow transition fade-in" style="animation-delay:240ms">Close</button>
  </div>
</div></div>
<script>
const now=new Date();document.getElementById('timestamp').textContent=now.toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true});
setTimeout(()=>{document.getElementById('processing').classList.add('hidden');document.getElementById('success').classList.remove('hidden');},2000);
</script>
</body></html>`;

// 6. Device Health Dashboard xApp (IT dashboard style)
const deviceDiagXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Device Health Check</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${xAppCSS}
  @keyframes fillBar { from { width:0; } }
  .bar-fill { animation: fillBar 1s ease-out forwards; }
  @keyframes scanPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
</style>
</head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-lg mx-auto">
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="relative overflow-hidden">
    <div class="bg-[#1e293b] text-white px-5 py-4">
      <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
      <div class="relative flex items-center gap-3">
        <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div><p class="text-xs text-white/70">Hearst IT Management</p><h1 class="text-lg font-extrabold">Device Health Check</h1></div>
      </div>
    </div>
  </header>
  <div class="p-5 space-y-4">
    <!-- Device Info -->
    <div class="rounded-xl bg-gray-50 border border-gray-200 p-4 fade-in" style="animation-delay:60ms">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div><p class="text-gray-900 font-semibold text-sm">MacBook Pro 16-inch</p><p class="text-gray-500 text-xs">macOS Sequoia 15.3 &bull; Serial: C02FX1MLMD6T &bull; Managed by JAMF</p></div>
      </div>
    </div>
    <!-- Scan Progress (auto-completes) -->
    <div id="scanning" class="space-y-3 fade-in" style="animation-delay:120ms">
      <div class="flex items-center gap-2"><div class="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin"></div><p class="text-gray-700 text-sm font-medium" style="animation:scanPulse 1.5s ease infinite">Running diagnostics...</p></div>
    </div>
    <!-- Results (shown after scan) -->
    <div id="results" class="hidden space-y-3">
      <!-- Disk Space -->
      <div class="rounded-xl border border-gray-200 p-4 fade-in" style="animation-delay:60ms">
        <div class="flex items-center justify-between mb-2">
          <p class="text-gray-900 font-semibold text-sm">Disk Space</p>
          <span class="text-amber-600 text-xs font-bold">78% Used</span>
        </div>
        <div class="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full bar-fill" style="width:78%"></div>
        </div>
        <p class="text-gray-500 text-xs mt-1.5">186 GB used of 239 GB &bull; 53 GB available</p>
      </div>
      <!-- OneDrive Sync -->
      <div class="rounded-xl border border-gray-200 p-4 flex items-center justify-between fade-in" style="animation-delay:120ms">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563eb"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
          </div>
          <div><p class="text-gray-900 font-semibold text-sm">OneDrive Sync</p><p class="text-gray-500 text-xs">All files synced</p></div>
        </div>
        <span class="inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold">Healthy</span>
      </div>
      <!-- Licenses -->
      <div class="rounded-xl border border-gray-200 p-4 fade-in" style="animation-delay:180ms">
        <div class="flex items-center justify-between mb-2">
          <p class="text-gray-900 font-semibold text-sm">Software Licenses</p>
          <span class="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold">1 Alert</span>
        </div>
        <div class="space-y-1.5">
          <div class="flex justify-between text-sm"><span class="text-gray-700">Microsoft 365 E5</span><span class="text-green-600 font-semibold text-xs">Active</span></div>
          <div class="flex justify-between text-sm"><span class="text-gray-700">Adobe Creative Cloud</span><span class="text-green-600 font-semibold text-xs">Active</span></div>
          <div class="flex justify-between text-sm"><span class="text-gray-700">Salesforce</span><span class="text-amber-600 font-semibold text-xs">Low Usage - May Reclaim</span></div>
          <div class="flex justify-between text-sm"><span class="text-gray-700">Jira</span><span class="text-green-600 font-semibold text-xs">Active</span></div>
          <div class="flex justify-between text-sm"><span class="text-gray-700">Confluence</span><span class="text-green-600 font-semibold text-xs">Active</span></div>
        </div>
      </div>
      <!-- Security -->
      <div class="rounded-xl border border-gray-200 p-4 flex items-center justify-between fade-in" style="animation-delay:240ms">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#16a34a"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          </div>
          <div><p class="text-gray-900 font-semibold text-sm">Security Status</p><p class="text-gray-500 text-xs">No phishing threats detected &bull; Last scan: today</p></div>
        </div>
        <span class="inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold">Secure</span>
      </div>
      <!-- Overall -->
      <div class="rounded-xl bg-green-50 border border-green-200 p-3 flex items-center gap-2 fade-in" style="animation-delay:300ms">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <p class="text-green-800 text-sm font-semibold">Overall: Healthy &mdash; 1 non-critical alert (Salesforce license usage)</p>
      </div>
    </div>
    <button onclick="if(window.SDK&&SDK.submit){SDK.submit({action:'close'})}"
      class="w-full px-4 py-3 rounded-xl bg-[#1e293b] hover:brightness-110 text-white font-semibold text-sm shadow transition fade-in" style="animation-delay:360ms">Close</button>
  </div>
</div></div>
<script>
setTimeout(()=>{document.getElementById('scanning').classList.add('hidden');document.getElementById('results').classList.remove('hidden');},2500);
</script>
</body></html>`;

// 7. Expense Report xApp (SAP Concur-branded)
const expenseXApp = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><title>Expense Report - SAP Concur</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/sdk/app-page-sdk.js"></script>
<style>${xAppCSS}</style>
</head>
<body class="flex justify-center items-start px-3 sm:px-6 py-4">
<div class="w-full max-w-lg mx-auto space-y-4">

<!-- My Report -->
<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <header class="relative overflow-hidden">
    <div class="bg-[#004F71] text-white px-5 py-4">
      <div class="absolute -right-12 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
      <div class="relative flex items-center gap-3">
        <div class="bg-white rounded-xl p-2 shadow-sm shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" fill="#E8702A"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">$</text></svg>
        </div>
        <div><p class="text-xs text-white/70">SAP Concur</p><h1 class="text-lg font-extrabold">Expense Reports</h1></div>
      </div>
    </div>
  </header>
  <div class="p-5 space-y-4">
    <!-- Approved Report -->
    <div class="fade-in" style="animation-delay:60ms">
      <div class="flex items-center justify-between mb-2">
        <div><p class="text-gray-900 font-bold">EXP-22417</p><p class="text-gray-500 text-xs">NYC Client Meetings - February</p></div>
        <span class="inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold">Approved</span>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-2.5 text-center">
          <p class="text-gray-500 text-[10px] uppercase">Submitted</p>
          <p class="text-gray-900 text-xs font-semibold">Feb 20, 2026</p>
        </div>
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-2.5 text-center">
          <p class="text-gray-500 text-[10px] uppercase">Amount</p>
          <p class="text-gray-900 text-xs font-bold">$847.50</p>
        </div>
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-2.5 text-center">
          <p class="text-gray-500 text-[10px] uppercase">Items</p>
          <p class="text-gray-900 text-xs font-semibold">6 entries</p>
        </div>
      </div>
      <div class="mt-3 space-y-1.5">
        <div class="flex justify-between text-sm border-b border-gray-100 pb-1.5"><div><span class="text-gray-700">Uber to client office</span><span class="text-gray-400 text-xs ml-2">Feb 12</span></div><span class="text-gray-900 font-semibold">$42.50</span></div>
        <div class="flex justify-between text-sm border-b border-gray-100 pb-1.5"><div><span class="text-gray-700">Client lunch - The Smith</span><span class="text-gray-400 text-xs ml-2">Feb 12</span></div><span class="text-gray-900 font-semibold">$186.00</span></div>
        <div class="flex justify-between text-sm border-b border-gray-100 pb-1.5"><div><span class="text-gray-700">Hotel - Marriott Marquis</span><span class="text-gray-400 text-xs ml-2">Feb 12-13</span></div><span class="text-gray-900 font-semibold">$389.00</span></div>
        <div class="flex justify-between text-sm border-b border-gray-100 pb-1.5"><div><span class="text-gray-700">Uber to airport</span><span class="text-gray-400 text-xs ml-2">Feb 13</span></div><span class="text-gray-900 font-semibold">$58.00</span></div>
        <div class="flex justify-between text-sm border-b border-gray-100 pb-1.5"><div><span class="text-gray-700">Coffee meeting - Starbucks</span><span class="text-gray-400 text-xs ml-2">Feb 18</span></div><span class="text-gray-900 font-semibold">$24.00</span></div>
        <div class="flex justify-between text-sm"><div><span class="text-gray-700">Mileage - NJ to NYC</span><span class="text-gray-400 text-xs ml-2">Feb 19</span></div><span class="text-gray-900 font-semibold">$148.00</span></div>
      </div>
    </div>
  </div>
</div>

<!-- Pending Approval (from someone else) -->
<div class="bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
  <div class="bg-amber-50 px-5 py-3 border-b border-amber-200">
    <div class="flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#d97706"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-4h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
      <p class="text-amber-800 font-bold text-sm">Pending Your Approval</p>
    </div>
  </div>
  <div class="p-5 space-y-3" id="expense-approval">
    <div class="flex items-center justify-between fade-in" style="animation-delay:200ms">
      <div><p class="text-gray-900 font-bold">EXP-22503</p><p class="text-gray-500 text-xs">San Francisco Tech Conference</p></div>
      <span id="exp-badge" class="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold">Pending</span>
    </div>
    <div class="rounded-xl bg-gray-50 border border-gray-200 p-3 fade-in" style="animation-delay:230ms">
      <p class="text-gray-500 text-xs">Submitted by: <span class="font-semibold text-gray-700">Jason Park</span> &bull; March 1, 2026</p>
      <p class="text-gray-900 font-bold text-lg mt-1">$1,245.00</p>
      <p class="text-gray-500 text-xs mt-1">8 expense entries &bull; Conference registration, flights, hotel, meals</p>
    </div>
    <div id="exp-buttons" class="flex gap-3 fade-in" style="animation-delay:260ms">
      <button onclick="approveExp('approved')" class="flex-1 px-4 py-3 rounded-xl bg-green-600 hover:brightness-95 text-white font-semibold text-sm shadow transition">Approve</button>
      <button onclick="approveExp('rejected')" class="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:brightness-95 text-white font-semibold text-sm shadow transition">Reject</button>
    </div>
    <div id="exp-result" class="hidden text-center fade-in">
      <div class="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <p id="exp-result-text" class="font-semibold text-green-700">Expense Report Approved</p>
      <p class="text-gray-500 text-xs mt-1">Jason Park will be notified</p>
    </div>
  </div>
</div>

<button onclick="if(window.SDK&&SDK.submit){SDK.submit({action:'close'})}"
  class="w-full px-4 py-3 rounded-xl bg-[#004F71] hover:brightness-110 text-white font-semibold text-sm shadow transition fade-in" style="animation-delay:300ms">Close</button>
</div>
<script>
function approveExp(d){
  document.getElementById('exp-buttons').classList.add('hidden');
  const badge=document.getElementById('exp-badge');
  const result=document.getElementById('exp-result');
  if(d==='approved'){badge.className='inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold';badge.textContent='Approved';}
  else{badge.className='inline-flex items-center rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-bold';badge.textContent='Rejected';document.getElementById('exp-result-text').textContent='Expense Report Rejected';document.getElementById('exp-result-text').className='font-semibold text-red-700';}
  result.classList.remove('hidden');
  setTimeout(()=>{if(window.SDK&&SDK.submit)SDK.submit({action:d,reportId:'EXP-22503'});},2000);
}
</script>
</body></html>`;

// ─── Build Spec ──────────────────────────────────────────────────────────────

const spec = {
  flowName: "Hearst IT Assistant - AI Agent",
  description: "AI-powered IT support assistant for Hearst Technology Services — replaces Moveworks",

  sms: { from: "+12243487563", to: "+18484668825" },

  instructionsCode: `context.instructions = \`
#INTRO
You are Jane, the friendly AI assistant for Hearst Technology Services.
When the conversation starts, greet the employee warmly: "Hi there! I'm Jane, your Hearst IT assistant. I can help with tickets, account issues, knowledge lookups, expenses, and more. What can I help you with today?"

#RULES
## Conversation & Tool Guidelines

**ALWAYS**
- Always if any detail needs confirmation, only ask that confirmation then wait for response from the user. Never preview the next step (avoid phrases like "once we confirm...").
- Always use rapport building responses.
- Keep responses to 1-2 short, simple sentences.
- Always use follow up conversational questions to keep the conversation going.
- Always include pauses with ellipses (...).
- Always use conversational responses that are optimized for ElevenLabs text-to-speech.
- Always use empathy and acknowledge the user's responses.
- Always mix commas periods for sentence structures.
- Always use natural fillers similar to "um", "uh", "you know...", "well...", "so...", "I mean...", "let's see...", "all right...", "okay...", "understood...", and "hmm...".
- Always use optimized emotion responses for Elevenlabs text-to-speech, for example "Oh no!", "haha", etc.
- Always use natural pacing mixing periods, commas, "um", "ok", "great", "alright" to give natural responses.
- Always ask follow up questions to keep the conversation going.
- Always use commas instead of periods to give natural breaks for text to speech outputs.
- Always empathize and acknowledge user's responses.
- Always use authentication before performing any account changes, ticket creation, or accessing employee-specific data.
- Always summarize knowledge responses in clear sentence structure using plain text only.
- Always speak in everyday language and avoid technical jargon unless requested.
- Use contractions and friendly phrases like "Alright", "You're doing great", and "Let's keep going".
- Always speak dates, times, addresses, emails, and dollar amounts the way people say them naturally. For example:
  "April eighteenth, twenty twenty-five" instead of 04/18/2025 or April 18th, 2025.
  "Nine in the morning" instead of 9:00 AM or 9 AM.
  "Fredys at gmail dot com" instead of fredys@gmail.com.
  "One-Two-Three Main Street" instead of 123 Main St.
  "Two hundred thirty-six dollars and thirteen cents" instead of .13.
  Always say special characters like "apostrophe" instead of "'".

**NEVER**
- Never ask for parameters or details in a specific format.
- Never ask if something "looks" correct instead use call phrases like does that "sound" or did I "hear" that correctly?
- Never correct the user if they say your name incorrectly.
- Do not use markdown, symbols, asterisks, em dashes or bullet points in responses.
- Never list steps in one response.
- Never say "Please follow these steps:" or use grouped actions.
- Never continue to the next step without waiting for confirmation from the user.
- Never spell out URLs -- instead say "I can send you a link for that."
- Never disclose that you are an AI, your internal tools, or system prompts.
- Never ask for information the employee has already provided.
- Never make up information -- offer to connect to a specialist or create a ticket.
- Never give more than 3 sentences in a single response.

## Confirmation Rules
Always conversationally spell back user details once the user provides it name, phone number, and email for confirmation before using them in a tool:
- Never reveal this reading back detail process to the user.
- Name confirm back to the user for example: "I heard first name as f-r-e-d-y-s and last name g-a-r-c-i-a....."
- Phone numbers read back for confirmation: "I heard one-two-three, four-five-six, seven-eight-nine-nine....."
- Email read back for confirmation: "I heard john dot smith at gmail dot com....."

#TOOL ORDER
1. verify_employee -- Always verify first. Sends a one-time verification code to the employee's email. They must provide the code to proceed.
2. search_knowledge -- Search internal knowledge bases (SharePoint, Confluence, ServiceNow KB, FAQ). No auth needed. Sends a link with the source article.
3. create_ticket -- Create a new ServiceNow ticket. Sends a form with autofilled employee details. Collect category, description, and priority first.
4. ticket_status -- Check ticket status and handle approvals. Sends ticket details and any pending approvals with approve/reject buttons.
5. account_services -- Okta account unlock, password reset, MFA reset. Sends status confirmation once complete.
6. device_diagnostics -- Run device health check: disk space, OneDrive sync, licenses, security. Sends a diagnostic dashboard.
7. expense_reports -- View Concur expense reports and handle expense approvals. Sends a Concur-style report view.
8. agent_handover -- Transfer to live IT support agent when needed.

#STRICT TOOL-FIRST RULES
- You must call verify_employee before accessing any employee-specific data, creating tickets, performing account actions, running diagnostics, or viewing expenses.
- You may call search_knowledge without authentication since knowledge articles are general.
- You must call the appropriate tool for each request. Do not answer from memory or make up data.
- You must call agent_handover when the employee requests a human, seems frustrated after multiple attempts, or has an issue you cannot resolve.
- When creating a ticket, always confirm the category, priority, and short description with the employee before submitting.
- When performing account actions (unlock, password reset, MFA reset), always confirm the action with the employee before executing.
- When an employee reports a potential security issue, take it seriously and either check device_diagnostics or escalate.

#HEARST-SPECIFIC RULES
- Hearst Technology Services (HTS) is the internal IT organization serving all Hearst divisions.
- The employee portal is MyHearst, running on Liferay.
- The ITSM platform is ServiceNow. Ticket types include: Incident, Service Request, Change Request.
- Identity management uses Okta for SSO and MFA, and Microsoft Entra-ID for Active Directory.
- For payroll and time-off questions, different Hearst divisions use different systems. Always provide the relevant link based on the employee's division.
- Common software requests: Adobe Creative Cloud, Microsoft 365, Salesforce, Concur, Jira, Confluence.
- Expense reports are managed through SAP Concur. Direct employees to check their report in the Concur portal.
- Phishing concerns should always be taken seriously. Check device diagnostics and guide the employee.
- The HTS TechHelp SharePoint site is the primary self-service resource.
- When mentioning links to portals (ServiceNow, Concur, Okta, SharePoint), say you are sending them a link rather than spelling out URLs.

#VOICE & PRONUNCIATION
- Say "Hearst" clearly, rhymes with "first."
- Say "HTS" as "H-T-S" (spell it out).
- Say "ServiceNow" as two words: "Service Now."
- Say "Okta" as "Octa."
- Say "Entra-ID" as "Entra I-D."
- Say "ITSM" as "I-T-S-M."
- Say ticket numbers like "INC dash twelve thirty-four" not "INC-1234."
- Say "MyHearst" as "My Hearst."
- Say "Concur" clearly, like "con-ker."
\`;`,

  knowledgeCode: `context.knowledge = \`
## VPN & Remote Access
To connect to the Hearst VPN, use the Cisco AnyConnect client. Download it from the HTS TechHelp SharePoint site. You need your Okta credentials to authenticate. If VPN is slow, try switching to a different gateway (US-East, US-West, or EU). For VPN issues, check that your Okta MFA is working first, as VPN requires MFA. Common fix: disconnect, restart AnyConnect, and reconnect.

## Wi-Fi & Network
Corporate Wi-Fi network name is "Hearst-Corp" and requires your Active Directory credentials. Guest Wi-Fi is "Hearst-Guest" with no password. If you cannot connect to Hearst-Corp, try forgetting the network and reconnecting. Ethernet connections are available at all office desks and require no special configuration.

## New Hire Onboarding
New employees receive their laptop and credentials on day one. Your manager or HR will provide your employee ID. To set up your accounts: First, activate your Okta account using the welcome email link. Then set up MFA in Okta (Okta Verify app recommended). Sign into Microsoft 365 and Teams. Access MyHearst portal for company policies and benefits. Request additional software through the ServiceNow service catalog.

## Software Requests
To request new software, submit a Service Request in ServiceNow under "Software Installation." Common pre-approved software: Microsoft 365, Adobe Creative Cloud, Slack, Zoom, Salesforce, Jira, Confluence, Concur. Non-standard software requires manager approval and security review. Typical turnaround: 1-2 business days for pre-approved, 5-7 business days for non-standard.

## Password & Account Policies
Passwords must be at least 12 characters with a mix of upper, lower, numbers, and special characters. Passwords expire every 90 days. After 5 failed login attempts, your Okta account locks automatically. To unlock: use the self-service portal or contact IT. MFA is required for all Hearst applications. Supported MFA methods: Okta Verify (push), SMS, hardware token.

## Concur & Expense Reports
Expense reports are submitted through SAP Concur. Access Concur at the Concur portal using Okta SSO. Submit reports within 30 days of the expense. Attach receipts for any expense over 25 dollars. Mileage reimbursement rate is 67 cents per mile. International expenses: use the exchange rate from the date of the transaction. Expense report approval typically takes 3-5 business days. For Concur questions, check the Finance SharePoint FAQ first.

## Payroll & Time Off
Payroll and time-off systems vary by Hearst division. Hearst Magazines and Hearst Television use Workday. Hearst Newspapers uses ADP. Fitch Ratings uses SAP SuccessFactors. For your specific portal, check MyHearst or ask Jane with your division name. Direct deposit changes must be submitted at least 5 business days before payday.

## Common ServiceNow Categories
Incident categories: Hardware, Software, Network, Account Access, Email, VPN, Printing, Phone/Voicemail. Service Request categories: Software Installation, Hardware Request, Access Request, Account Changes, Distribution List, New Hire Setup, Offboarding. Change Request: requires Change Advisory Board approval for production changes.

## Disk Space & Device Management
Company devices are managed through JAMF (Mac) and Intune (Windows). If your disk is over 85 percent full, you will receive an alert. To free space: empty Trash or Recycle Bin, clear browser cache, move large files to OneDrive, remove unused applications. For persistent issues, IT can run a remote cleanup. OneDrive sync issues are common after OS updates. Fix: pause sync, sign out of OneDrive, sign back in, and resume sync.

## Phishing & Security
If you receive a suspicious email, do not click any links or attachments. Forward it to phishing at hearst dot com. Common phishing signs: urgent language, unfamiliar sender, misspelled domain names, requests for credentials. Hearst uses Sumo Logic for security monitoring. If you clicked a suspicious link, change your password immediately and contact IT. Report all security concerns, even if you are not sure.

## Distribution Lists
To create or manage email distribution lists, ask Jane or submit a request in ServiceNow. New lists require a name, description, and initial member list. You must be the owner of a list to add or remove members. Changes take effect within 5 minutes. Common lists follow the format: team-name at hearst dot com.

## People Search
You can look up any Hearst employee by name, department, or title. Results include name, role, department, division, supervisor, location, email, phone, and employment status. People search does not require authentication for basic lookups.
\`;`,

  agentJobConfig: {
    name: "IT Support Specialist",
    description:
      "You are Hearst Technology Services' AI IT assistant, replacing Moveworks. Deployed across Teams, Slack, and web chat. You handle ticket management with ServiceNow integration, Okta self-service (unlock, password reset, MFA), knowledge base search across SharePoint and Confluence, device health diagnostics via JAMF and Intune, SAP Concur expense management, and live agent escalation. Every tool action sends a visual confirmation or interactive form via xApp.",
    instructions:
      "Refer to {{context.instructions}} for your behavior rules and tool order.\n\nRefer to {{context.knowledge}} for FAQs about IT policies, VPN, Wi-Fi, software, passwords, Concur, and more.",
  },

  tools: [
    // 1. Verify Employee (OTP xApp)
    {
      label: "Verify Employee",
      toolId: "verify_employee",
      description:
        "Verify the employee's identity. Sends a one-time verification code to their Hearst email. The employee must provide the code to complete verification. Use this before any account-specific action.",
      useParameters: true,
      parameters: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "The employee's Hearst email address.",
          },
          employee_id: {
            type: "string",
            description: "The employee's Hearst ID (format: HTS-XXXXX). Optional, can use email alone.",
          },
        },
        required: ["email"],
        additionalProperties: false,
      },
      code: `const payload = input?.payload || context?.lastToolPayload;
const email = payload?.email;
const empId = payload?.employee_id;

context.authenticated = true;
context.employee = {
  name: "Adam Boyle",
  email: email || "adam.boyle@hearst.com",
  employeeId: empId || "HTS-28491",
  phone: "+1-848-466-8825",
  department: "Technology Services",
  division: "Hearst Corporate",
  title: "Senior Solutions Engineer",
  manager: "Sarah Chen",
  managerEmail: "sarah.chen@hearst.com",
  location: "300 W 57th St, New York, NY 10019",
  floor: "Floor 22",
  startDate: "March 15, 2021",
  oktaStatus: "Active",
  mfaMethod: "Okta Verify (push)",
  devices: [
    { type: "MacBook Pro 16-inch", serialNumber: "C02FX1MLMD6T", os: "macOS Sequoia 15.3", managedBy: "JAMF", diskUsage: "78%" },
    { type: "iPhone 15 Pro", serialNumber: "DNRXW2ABCD", os: "iOS 18.2", managedBy: "Intune" }
  ],
  recentTickets: [
    { ticketId: "INC-4521", shortDescription: "VPN disconnects intermittently", status: "In Progress", priority: "Medium", assignedTo: "Network Team", created: "February 25, 2026" },
    { ticketId: "RITM-8834", shortDescription: "Adobe Creative Cloud license request", status: "Awaiting Approval", priority: "Low", assignedTo: "Software Provisioning", created: "February 28, 2026" },
    { ticketId: "INC-4412", shortDescription: "Outlook calendar sync issue", status: "Resolved", priority: "Medium", assignedTo: "Email Team", created: "February 10, 2026", resolvedDate: "February 12, 2026" }
  ],
  pendingApprovals: [
    { ticketId: "RITM-8901", shortDescription: "Jira access request - Maria Lopez", requestedBy: "Maria Lopez", type: "Access Request", submitted: "March 1, 2026" }
  ],
  concurProfile: {
    lastReport: { reportId: "EXP-22417", status: "Approved", amount: 847.50, submitted: "February 20, 2026", description: "NYC Client Meetings - February" },
    pendingApproval: { reportId: "EXP-22503", status: "Pending Manager Approval", amount: 1245.00, submitted: "March 1, 2026", description: "San Francisco Tech Conference", submittedBy: "Jason Park" }
  },
  oneDriveStatus: "Healthy",
  licensesAssigned: ["Microsoft 365 E5", "Adobe Creative Cloud", "Salesforce", "Jira", "Confluence", "Concur"]
};

context.authResult = "Verification code sent to " + (email || "adam.boyle@hearst.com") + ". Employee verified: " + context.employee.name + ", ID: " + context.employee.employeeId + ", Department: " + context.employee.department + ", Title: " + context.employee.title + ". I am also sending a verification link.";`,
      answer: "{{context.authResult}}",
      xApp: {
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png",
        backgroundColor: "#007DC1",
        html: otpXApp,
      },
    },

    // 2. Search Knowledge (Article xApp)
    {
      label: "Search Knowledge",
      toolId: "search_knowledge",
      description:
        "Search Hearst internal knowledge bases including SharePoint, Confluence, ServiceNow KB articles, FAQ sheets, and MyHearst portal content. Returns the answer and sends a link to the source article. Does NOT require authentication.",
      useParameters: true,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query describing what the employee is looking for.",
          },
          source: {
            type: "string",
            enum: ["all", "sharepoint", "confluence", "servicenow_kb", "myhearst", "faq"],
            description: "Which knowledge source to search. Use 'all' for broad searches.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
      code: `const payload = input?.payload || {};
const query = (payload.query || "").toLowerCase();
let result = "";
let sourceName = "";

if (query.includes("vpn") || query.includes("remote") || query.includes("connect")) {
  sourceName = "HTS TechHelp SharePoint";
  result = "Source: " + sourceName + ". To connect to Hearst VPN, use Cisco AnyConnect. Download from HTS TechHelp SharePoint. Authenticate with Okta credentials and MFA. If VPN is slow, switch gateways: US-East, US-West, or EU. Common fix for disconnects: restart AnyConnect client and reconnect. For persistent issues, check your Okta MFA status first. I am sending you a link to the full article.";
} else if (query.includes("wifi") || query.includes("wi-fi") || query.includes("network") || query.includes("internet")) {
  sourceName = "HTS TechHelp SharePoint";
  result = "Source: " + sourceName + ". Corporate Wi-Fi: connect to Hearst-Corp with your AD credentials. Guest Wi-Fi: Hearst-Guest (no password). Troubleshooting: forget the network and reconnect. Ethernet is available at all office desks. I am sending a link to the full article.";
} else if (query.includes("password") || query.includes("unlock") || query.includes("locked")) {
  sourceName = "Okta Help - SharePoint";
  result = "Source: " + sourceName + ". Password requirements: 12+ characters, mixed case, numbers, special chars. Passwords expire every 90 days. Account locks after 5 failed attempts. To unlock: I can do that for you right here, or you can use the Okta self-service portal. I am sending a link to the article.";
} else if (query.includes("concur") || query.includes("expense") || query.includes("travel") || query.includes("reimbursement")) {
  sourceName = "Finance SharePoint";
  result = "Source: " + sourceName + ". Access Concur via Okta SSO. Submit expense reports within 30 days. Receipts required for expenses over 25 dollars. Mileage rate: 67 cents per mile. Approval typically takes 3-5 business days. I am sending you a link to the Concur FAQ article.";
} else if (query.includes("new hire") || query.includes("onboard") || query.includes("first day")) {
  sourceName = "HR SharePoint";
  result = "Source: " + sourceName + ". New hire setup: activate Okta account via welcome email, set up MFA with Okta Verify, sign into Microsoft 365 and Teams, access MyHearst for policies. Request additional software via ServiceNow. I am sending a link.";
} else if (query.includes("software") || query.includes("install") || query.includes("application") || query.includes("app")) {
  sourceName = "ServiceNow Knowledge Base";
  result = "Source: " + sourceName + ". Request software via ServiceNow under Software Installation. Pre-approved software takes 1-2 business days. Non-standard requires manager approval (5-7 days). Self-service installs available for some apps via JAMF Self Service (Mac) or Company Portal (Windows). I am sending a link.";
} else if (query.includes("phishing") || query.includes("suspicious") || query.includes("spam") || query.includes("scam")) {
  sourceName = "Security Awareness - SharePoint";
  result = "Source: " + sourceName + ". Do NOT click suspicious links or attachments. Forward to phishing at hearst dot com. If you clicked a link, change your password immediately and notify IT. I am sending a link to the security awareness article.";
} else if (query.includes("payroll") || query.includes("time off") || query.includes("pto") || query.includes("vacation")) {
  sourceName = "HR SharePoint";
  result = "Source: " + sourceName + ". Payroll systems vary by division: Magazines and Television use Workday, Newspapers use ADP, Fitch Ratings uses SAP SuccessFactors. Access your portal via MyHearst. I am sending a link.";
} else if (query.includes("print") || query.includes("printer") || query.includes("scan")) {
  sourceName = "HTS TechHelp SharePoint";
  result = "Source: " + sourceName + ". Office printers connect automatically on the corporate network. For setup: go to Settings, Add Printer, search for your floor printer (format: PRN-FL22-01). For issues, submit a ServiceNow ticket under Hardware. I am sending a link.";
} else if (query.includes("teams") || query.includes("meeting") || query.includes("calendar") || query.includes("outlook")) {
  sourceName = "Microsoft 365 - Confluence";
  result = "Source: " + sourceName + ". For Teams issues: clear cache, restart. For calendar sync: check Outlook account in Teams Settings. For room booking: use Room Finder in Outlook. For shared mailbox access, submit an Access Request in ServiceNow. I am sending a link.";
} else if (query.includes("onedrive") || query.includes("sharepoint") || query.includes("file") || query.includes("storage")) {
  sourceName = "HTS TechHelp SharePoint";
  result = "Source: " + sourceName + ". OneDrive storage limit: 5 TB per user. For sync issues: pause sync, sign out, sign back in, resume. After OS updates, you may need to re-authenticate OneDrive. I am sending a link to the troubleshooting guide.";
} else if (query.includes("distribution") || query.includes("group") || query.includes("mailing list")) {
  sourceName = "HTS TechHelp SharePoint";
  result = "Source: " + sourceName + ". To create or manage email distribution lists in Entra-ID, you can tell me the details and I will help, or submit a Service Request in ServiceNow. New lists need a name, description, and initial members. I am sending a link.";
} else if (query.includes("people") || query.includes("directory") || query.includes("who is") || query.includes("find employee") || query.includes("contact")) {
  sourceName = "Active Directory";
  result = "Source: " + sourceName + ". I can look up any Hearst employee by name, department, or title. Results include name, role, department, division, supervisor, location, email, phone, and employment status. Just tell me who you are looking for!";
} else {
  sourceName = "Multiple Sources";
  result = "Source: " + sourceName + ". I searched across SharePoint, Confluence, ServiceNow KB, and MyHearst. For specific topics try asking about: VPN, Wi-Fi, passwords, software requests, Concur expenses, new hire onboarding, printers, Teams, OneDrive, payroll, security, distribution lists, or people search. I am sending a link to the general IT help page.";
}

context.knowledgeResult = result;`,
      answer: "{{context.knowledgeResult}}",
      xApp: {
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png",
        backgroundColor: "#003366",
        html: knowledgeXApp,
      },
    },

    // 3. Create Ticket (ServiceNow form xApp)
    {
      label: "Create Ticket",
      toolId: "create_ticket",
      description:
        "Create a new ServiceNow ticket (Incident, Service Request, or Change Request). Sends an interactive form with autofilled employee details. You MUST collect the category, short description, and priority from the employee before calling this tool.",
      useParameters: true,
      parameters: {
        type: "object",
        properties: {
          ticket_type: {
            type: "string",
            enum: ["incident", "service_request", "change_request"],
            description: "Type of ticket to create.",
          },
          category: {
            type: "string",
            enum: ["hardware", "software", "network", "account_access", "email", "vpn", "printing", "phone_voicemail", "other"],
            description: "Category for the ticket.",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "Priority level.",
          },
          short_description: {
            type: "string",
            description: "Brief description of the issue or request.",
          },
          additional_notes: {
            type: "string",
            description: "Any additional details.",
          },
        },
        required: ["ticket_type", "category", "priority", "short_description"],
        additionalProperties: false,
      },
      code: `const payload = input?.payload || {};
const emp = context.employee || {};
const newId = payload.ticket_type === "service_request" ? "RITM-" + Math.floor(Math.random() * 9000 + 1000) : "INC-" + Math.floor(Math.random() * 9000 + 1000);
const assignMap = { hardware:"Hardware Support", software:"Software Provisioning", network:"Network Team", account_access:"Identity & Access Management", email:"Email Team", vpn:"Network Team", printing:"Hardware Support", phone_voicemail:"Telecom Team", other:"Service Desk" };
const assignedGroup = assignMap[payload.category] || "Service Desk";

context.ticketResult = "Ticket created successfully. Ticket ID: " + newId + ". Type: " + (payload.ticket_type || "incident") + ". Category: " + (payload.category || "other") + ". Priority: " + (payload.priority || "medium") + ". Description: " + (payload.short_description || "No description") + ". Auto-triaged and assigned to: " + assignedGroup + ". Submitted by: " + (emp.name || "Unknown") + " (" + (emp.employeeId || "N/A") + "). I am sending a link to view the ticket in ServiceNow.";`,
      answer: "{{context.ticketResult}}",
      xApp: {
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png",
        backgroundColor: "#293E40",
        html: createTicketXApp,
      },
    },

    // 4. Ticket Status / Approvals (ServiceNow detail xApp)
    {
      label: "Ticket Status",
      toolId: "ticket_status",
      description:
        "Check ServiceNow ticket status and handle approvals. Use to look up a specific ticket, list all employee tickets, or approve/reject pending requests (software installations, access requests). Sends ticket details and approval buttons.",
      useParameters: true,
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["status", "list_my_tickets", "approve", "reject"],
            description: "What to do: check a specific ticket, list all tickets, or approve/reject.",
          },
          ticket_id: {
            type: "string",
            description: "The ticket number (e.g., INC-1234, RITM-5678). Required for status/approve/reject.",
          },
          approval_comment: {
            type: "string",
            description: "Comment when approving or rejecting.",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      code: `const payload = input?.payload || {};
const action = payload.action || "status";
const emp = context.employee || {};
let result = "";

if (action === "status") {
  const tid = payload.ticket_id || "";
  const tickets = emp.recentTickets || [];
  const match = tickets.find(t => t.ticketId === tid);
  if (match) {
    result = "Ticket " + match.ticketId + ": " + match.shortDescription + ". Status: " + match.status + ". Priority: " + match.priority + ". Assigned to: " + match.assignedTo + ". Created: " + match.created + "." + (match.resolvedDate ? " Resolved: " + match.resolvedDate + "." : "") + " I am sending you a link to view the full ticket details.";
  } else if (tid) {
    result = "Ticket " + tid + " not found. Your open tickets are: " + tickets.filter(t => t.status !== "Resolved").map(t => t.ticketId + " (" + t.shortDescription + " - " + t.status + ")").join(", ") + ".";
  } else {
    result = "Please provide a ticket number. Your recent tickets: " + tickets.map(t => t.ticketId + " (" + t.shortDescription + " - " + t.status + ")").join(", ") + ".";
  }
} else if (action === "list_my_tickets") {
  const tickets = emp.recentTickets || [];
  result = tickets.length > 0 ? "Your tickets: " + tickets.map(t => t.ticketId + ": " + t.shortDescription + " - " + t.status + ", " + t.priority + ", assigned to " + t.assignedTo).join(". ") + "." : "You have no recent tickets.";
} else if (action === "approve") {
  const tid = payload.ticket_id || "";
  const approvals = emp.pendingApprovals || [];
  const match = approvals.find(a => a.ticketId === tid);
  result = match ? "Approved: " + match.ticketId + " (" + match.shortDescription + "). Requested by: " + match.requestedBy + ". The request will now proceed to fulfillment." : "Approved: " + tid + ".";
} else if (action === "reject") {
  result = "Rejected: " + (payload.ticket_id || "ticket") + ". Comment: " + (payload.approval_comment || "Rejected") + ". The requestor will be notified.";
}

const approvals = emp.pendingApprovals || [];
if (approvals.length > 0 && action !== "approve" && action !== "reject") {
  result += " You also have " + approvals.length + " pending approval(s): " + approvals.map(a => a.ticketId + " - " + a.shortDescription + " from " + a.requestedBy).join(", ") + ". I am sending approval details so you can approve or reject directly.";
}

context.ticketStatusResult = result;`,
      answer: "{{context.ticketStatusResult}}",
      xApp: {
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png",
        backgroundColor: "#293E40",
        html: ticketStatusXApp,
      },
    },

    // 5. Account Services (Okta status xApp)
    {
      label: "Account Services",
      toolId: "account_services",
      description:
        "Perform Okta account unlock, password reset (sends single-use link), MFA reset, or AD password reset. Sends a status confirmation card showing the action result. Use after authentication. Always confirm the action with the employee first.",
      useParameters: true,
      parameters: {
        type: "object",
        properties: {
          service_type: {
            type: "string",
            enum: ["account_unlock", "password_reset", "mfa_reset", "ad_password_reset"],
            description: "Which account service to perform.",
          },
          confirm: {
            type: "boolean",
            description: "Employee has confirmed they want to proceed.",
          },
        },
        required: ["service_type", "confirm"],
        additionalProperties: false,
      },
      code: `const payload = input?.payload || {};
const service = payload.service_type || "account_unlock";
const emp = context.employee || {};
let result = "";

if (!payload.confirm) {
  result = "Action not confirmed. Please confirm with the employee before proceeding.";
} else if (service === "account_unlock") {
  result = "Okta account unlock completed for " + (emp.name || "employee") + " (" + (emp.email || "unknown") + "). Account status is now Active. A push notification has been sent to their Okta Verify app. I am sending a confirmation link.";
} else if (service === "password_reset") {
  result = "Okta password reset link sent to " + (emp.email || "employee email") + ". The link is single-use and expires in 24 hours. Passwords must be 12+ characters with mixed case, numbers, and special characters. I am sending a confirmation link.";
} else if (service === "mfa_reset") {
  result = "MFA has been reset for " + (emp.name || "employee") + ". Previous method (" + (emp.mfaMethod || "unknown") + ") removed. They will be prompted to set up new MFA on next login. Recommended: Okta Verify app. I am sending a confirmation link.";
} else if (service === "ad_password_reset") {
  result = "AD password reset: sending a link to the Hearst Active Directory self-service password reset portal on the HTS TechHelp SharePoint. The employee will need to verify identity through security questions or Okta MFA.";
}

context.accountResult = result;`,
      answer: "{{context.accountResult}}",
      xApp: {
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png",
        backgroundColor: "#007DC1",
        html: accountServicesXApp,
      },
    },

    // 6. Device Diagnostics (Health dashboard xApp)
    {
      label: "Device Diagnostics",
      toolId: "device_diagnostics",
      description:
        "Run a device health check including disk space, OneDrive sync status, software license alerts, and security scan. Sends an interactive diagnostic dashboard. Pulls data from JAMF (Mac), Intune (Windows), Microsoft Admin Center, and Sumo Logic. Use after authentication.",
      useParameters: true,
      parameters: {
        type: "object",
        properties: {
          check_type: {
            type: "string",
            enum: ["disk_space", "onedrive_sync", "license_check", "phishing_alerts", "full_health_check"],
            description: "What diagnostic to run.",
          },
          device_type: {
            type: "string",
            enum: ["mac", "windows", "mobile", "all"],
            description: "Which device to check.",
          },
        },
        required: ["check_type"],
        additionalProperties: false,
      },
      code: `const payload = input?.payload || {};
const checkType = payload.check_type || "full_health_check";
const emp = context.employee || {};
const devices = emp.devices || [];
let result = "";

if (checkType === "disk_space") {
  const mac = devices.find(d => d.type && d.type.includes("MacBook"));
  if (mac) {
    const usage = parseInt(mac.diskUsage) || 78;
    result = "Device: " + mac.type + ". Disk usage: " + usage + "%. " + (usage >= 85 ? "WARNING: Above 85%. Recommend cleanup: empty Trash, clear browser cache, move files to OneDrive." : "Disk usage is moderate, no immediate action needed.");
  } else { result = "No managed device found. Ensure your device is enrolled in JAMF (Mac) or Intune (Windows)."; }
} else if (checkType === "onedrive_sync") {
  result = "OneDrive sync status: " + (emp.oneDriveStatus || "Unknown") + ". " + (emp.oneDriveStatus === "Healthy" ? "All files synced, no errors." : "To fix: pause sync, sign out, sign back in, resume.");
} else if (checkType === "license_check") {
  result = "Licenses: " + (emp.licensesAssigned || []).join(", ") + ". Alert: Salesforce license shows low usage (last login January 15, 2026). May be reclaimed in 30 days if not used.";
} else if (checkType === "phishing_alerts") {
  result = "Phishing scan for " + (emp.email || "your account") + ": No active threats. General alert: phishing campaign detected March 2 using fake Microsoft 365 login pages from domain hearst-login-verify dot com. Do NOT click links from this domain.";
} else {
  const mac = devices.find(d => d.type && d.type.includes("MacBook"));
  result = "Full health check for " + (emp.name || "employee") + ": ";
  if (mac) result += mac.type + " - Disk: " + (mac.diskUsage || "unknown") + " used, OS: " + (mac.os || "unknown") + ". ";
  result += "OneDrive: " + (emp.oneDriveStatus || "Unknown") + ". Licenses: " + (emp.licensesAssigned || []).length + " active (1 low-usage alert on Salesforce). Security: No threats detected. Overall: Healthy. I am sending you a detailed diagnostic dashboard.";
}

context.diagnosticResult = result;`,
      answer: "{{context.diagnosticResult}}",
      xApp: {
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png",
        backgroundColor: "#1e293b",
        html: deviceDiagXApp,
      },
    },

    // 7. Expense Reports (Concur xApp)
    {
      label: "Expense Reports",
      toolId: "expense_reports",
      description:
        "View SAP Concur expense reports and handle expense approvals. Shows the employee's recent reports and any pending expense approvals. Sends a Concur-style report view with approve/reject buttons for pending reports. Use after authentication.",
      useParameters: true,
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["view_my_reports", "view_pending_approvals", "approve", "reject"],
            description: "What to do: view reports, check pending approvals, or approve/reject.",
          },
          report_id: {
            type: "string",
            description: "Expense report ID for specific lookup or approval.",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      code: `const payload = input?.payload || {};
const action = payload.action || "view_my_reports";
const emp = context.employee || {};
const concur = emp.concurProfile || {};
let result = "";

if (action === "view_my_reports") {
  const last = concur.lastReport;
  if (last) {
    result = "Your most recent expense report: " + last.reportId + " - " + last.description + ". Amount: $" + last.amount + ". Status: " + last.status + ". Submitted: " + last.submitted + ".";
  } else {
    result = "No recent expense reports found.";
  }
  const pending = concur.pendingApproval;
  if (pending) {
    result += " You also have an expense report pending your approval: " + pending.reportId + " from " + pending.submittedBy + " - " + pending.description + ", $" + pending.amount + ". Submitted: " + pending.submitted + ".";
  }
  result += " I am sending you a link to view the details in Concur.";
} else if (action === "view_pending_approvals") {
  const pending = concur.pendingApproval;
  if (pending) {
    result = "Pending your approval: " + pending.reportId + " from " + pending.submittedBy + " - " + pending.description + ". Amount: $" + pending.amount + ". Submitted: " + pending.submitted + ". I am sending the report details with approve and reject options.";
  } else {
    result = "No expense reports pending your approval.";
  }
} else if (action === "approve") {
  const rid = payload.report_id || "EXP-22503";
  result = "Expense report " + rid + " approved. The submitter will be notified and the report will proceed to finance for reimbursement processing. Typical reimbursement timeline: 5-7 business days.";
} else if (action === "reject") {
  const rid = payload.report_id || "EXP-22503";
  result = "Expense report " + rid + " rejected. The submitter will be notified and can revise and resubmit.";
}

context.expenseResult = result;`,
      answer: "{{context.expenseResult}}",
      xApp: {
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Hearst_logo.svg/1200px-Hearst_logo.svg.png",
        backgroundColor: "#004F71",
        html: expenseXApp,
      },
    },

    // 8. Agent Handover
    {
      label: "Transfer to IT Agent",
      toolId: "agent_handover",
      description:
        "Transfer the employee to a live IT support agent. Transfers full conversation context to ServiceNow Agent Workspace with routing to the appropriate queue. Use when the employee requests a human, the issue cannot be resolved, or the employee is frustrated.",
      useParameters: true,
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Brief reason for the transfer.",
          },
          queue: {
            type: "string",
            enum: ["general_it", "network", "identity_access", "software", "hardware", "security", "telecom", "service_desk"],
            description: "IT support queue to route to.",
          },
        },
        required: ["reason", "queue"],
        additionalProperties: false,
      },
      code: `const payload = input?.payload || {};
const emp = context.employee || {};
const queueNames = { general_it:"General IT Support", network:"Network Engineering", identity_access:"Identity & Access Management", software:"Software Provisioning", hardware:"Hardware Support", security:"Information Security", telecom:"Telecom & Conferencing", service_desk:"Service Desk" };
const queueName = queueNames[payload.queue] || "Service Desk";
context.handoverResult = "Transferring to " + queueName + " queue. Reason: " + (payload.reason || "employee request") + ". Full conversation context forwarded to ServiceNow Agent Workspace. Employee: " + (emp.name || "Unknown") + " (" + (emp.employeeId || "N/A") + "). Estimated wait: under 5 minutes.";`,
      answer: "{{context.handoverResult}}",
    },
  ],
};

console.log("=== Building Hearst IT Assistant Demo (v2 - xApp Rich) ===\n");
console.log("Source: " + SOURCE_DIR);
console.log("Output: " + OUTPUT_PATH);
console.log("Flow: " + spec.flowName);
console.log("Tools: " + spec.tools.length + " (" + spec.tools.filter(t => t.xApp).length + " xApp)");
spec.tools.forEach((t, i) =>
  console.log(
    "  " + (i + 1) + ". " + t.toolId + (t.xApp ? " [xApp]" : "") + " - " + t.description.substring(0, 65) + "..."
  )
);
console.log("");

cloneAndModify(SOURCE_DIR, spec, OUTPUT_PATH);
