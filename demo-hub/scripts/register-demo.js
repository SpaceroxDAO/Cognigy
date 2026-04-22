#!/usr/bin/env node
/**
 * Register (upsert) a demo in the Supabase flows table.
 *
 * Usage:
 *   node scripts/register-demo.js path/to/my-demo-site-spec.json
 *   node scripts/register-demo.js path/to/spec.json --webrtc-url https://endpoint-trial-us.cognigy.ai/abc123
 *
 * Requires in .env (at demo-hub root):
 *   VITE_SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY=your-service-role-key   (NOT the anon key)
 *
 * The site-spec.json is produced automatically by cloneAndModify() alongside the ZIP.
 * After deploying the Cognigy endpoint, fill in webrtc_url either in the spec file
 * or pass it via --webrtc-url flag.
 */

const fs = require('fs');
const path = require('path');

// Load .env from demo-hub root
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const specPath = process.argv[2];
if (!specPath) {
  console.error('Usage: node scripts/register-demo.js <site-spec.json> [--webrtc-url <url>]');
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

// Optional --webrtc-url override
const urlFlagIdx = process.argv.indexOf('--webrtc-url');
if (urlFlagIdx !== -1 && process.argv[urlFlagIdx + 1]) {
  spec.webrtc_url = process.argv[urlFlagIdx + 1];
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

if (!spec.webrtc_url) {
  console.warn('Warning: webrtc_url is empty. The demo will not be able to connect to Cognigy.');
  console.warn('Add it to the spec file or pass --webrtc-url <url>');
}

const url = `${supabaseUrl}/rest/v1/flows`;
const body = JSON.stringify(spec);

console.log(`Registering demo: ${spec.name} (path: ${spec.path})`);

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Prefer': 'resolution=merge-duplicates',
  },
  body,
})
  .then(async res => {
    if (res.ok) {
      console.log(`Done. Demo "${spec.name}" registered at path "${spec.path}".`);
      console.log('Open the admin Flow Manager to verify or set the avatar image.');
    } else {
      const text = await res.text();
      console.error(`Supabase error ${res.status}: ${text}`);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Request failed:', err.message);
    process.exit(1);
  });
