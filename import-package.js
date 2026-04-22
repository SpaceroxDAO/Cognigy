#!/usr/bin/env node
/**
 * Import a Cognigy.AI package ZIP via the Management REST API.
 *
 * Usage:
 *   node import-package.js <path/to/package.zip> [options]
 *
 * Options:
 *   --site-spec <path>     Path to *-site-spec.json — auto-runs register-demo.js after import
 *   --webrtc-url <url>     Override WebRTC URL (skip the endpoint creation prompt)
 *   --base-url <url>       Cognigy API base URL (overrides COGNIGY_BASE_URL env var)
 *   --api-key <key>        API key (overrides COGNIGY_API_KEY env var)
 *   --agent-id <id>        24-char project/agent ID (overrides COGNIGY_AGENT_ID env var)
 *   --no-register          Skip calling register-demo.js even if --site-spec is provided
 *
 * Required env vars (in .env at this directory or demo-hub/):
 *   COGNIGY_BASE_URL=https://api-trial.cognigy.ai      # Your Cognigy API base URL
 *   COGNIGY_API_KEY=your-api-key                       # From Cognigy.AI > My Profile > API Keys
 *   COGNIGY_AGENT_ID=your-24-char-project-id           # Project/agent ID from the URL in Cognigy.AI
 *
 * How to find your COGNIGY_AGENT_ID:
 *   Open Cognigy.AI → your project → look at the URL: .../projects/{AGENT_ID}/...
 *
 * API endpoint notes:
 *   This script targets POST /v2.0/packages — verify in your OpenAPI viewer:
 *   https://api-trial.cognigy.ai/openapi#tag--Packages
 *   If the endpoint or field names differ, adjust PACKAGES_PATH and FORM_FIELD_NAME below.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ── Adjust these if the Cognigy API endpoint or field name differs in your environment ──
const PACKAGES_PATH = "/v2.0/packages";
const TASKS_PATH = "/v2.0/tasks";
const FORM_FIELD_NAME = "packageZip";           // multipart field name for the ZIP file
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 60;                   // 60 × 3s = 3 min timeout
// ─────────────────────────────────────────────────────────────────────────────────────────

// Load .env from this directory, then from demo-hub/
for (const envFile of [
  path.join(__dirname, ".env"),
  path.join(__dirname, "demo-hub", ".env"),
]) {
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

// Parse args
const args = process.argv.slice(2);
if (!args.length || args[0].startsWith("--")) {
  console.error("Usage: node import-package.js <package.zip> [--site-spec <spec.json>] [--webrtc-url <url>] [--base-url <url>] [--api-key <key>] [--agent-id <id>]");
  process.exit(1);
}

const zipPath = path.resolve(args[0]);
if (!fs.existsSync(zipPath)) {
  console.error("File not found:", zipPath);
  process.exit(1);
}

function arg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

const siteSpecPath = arg("--site-spec");
const webrtcUrlOverride = arg("--webrtc-url");
const noRegister = args.includes("--no-register");

const baseUrl = (arg("--base-url") || process.env.COGNIGY_BASE_URL || "").replace(/\/$/, "");
const apiKey = arg("--api-key") || process.env.COGNIGY_API_KEY;
const agentId = arg("--agent-id") || process.env.COGNIGY_AGENT_ID;

if (!baseUrl || !apiKey || !agentId) {
  console.error("Missing required config. Set in .env or pass as flags:");
  if (!baseUrl) console.error("  COGNIGY_BASE_URL (e.g. https://api-trial.cognigy.ai)");
  if (!apiKey) console.error("  COGNIGY_API_KEY (from Cognigy.AI > My Profile > API Keys)");
  if (!agentId) console.error("  COGNIGY_AGENT_ID (24-char project ID from the URL)");
  process.exit(1);
}

async function apiRequest(method, urlPath, options = {}) {
  const url = baseUrl + urlPath;
  const headers = {
    "X-API-Key": apiKey,
    "Accept": "application/json",
    ...options.headers,
  };
  const res = await fetch(url, { method, headers, body: options.body });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (_) { json = null; }
  return { ok: res.ok, status: res.status, json, text };
}

async function pollTask(taskId) {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    const { ok, json } = await apiRequest("GET", `${TASKS_PATH}/${taskId}`);
    if (!ok || !json) continue;
    const status = json.status || json.type;
    process.stdout.write(".");
    if (json.status === "done" || json.status === "completed" || json.status === "finished") {
      console.log(" done.");
      return json;
    }
    if (json.status === "error" || json.status === "failed") {
      console.log(" failed.");
      throw new Error("Task failed: " + JSON.stringify(json));
    }
  }
  console.log(" timed out.");
  throw new Error("Package import timed out after " + (POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS / 1000) + "s");
}

async function main() {
  console.log("Importing package:", path.basename(zipPath));
  console.log("Environment:      ", baseUrl);
  console.log("Agent ID:         ", agentId);

  // Build multipart form data — Node 18+ has built-in FormData + Blob
  const fileBuffer = fs.readFileSync(zipPath);
  const formData = new FormData();
  formData.append(FORM_FIELD_NAME, new Blob([fileBuffer], { type: "application/zip" }), path.basename(zipPath));
  formData.append("agentId", agentId);

  console.log("\nUploading ZIP...");
  const uploadUrl = `${PACKAGES_PATH}?agentId=${encodeURIComponent(agentId)}`;
  const { ok, status, json, text } = await apiRequest("POST", uploadUrl, { body: formData });

  if (!ok) {
    console.error(`\nUpload failed (HTTP ${status}):`);
    console.error(text);
    console.error("\nIf you see a 404, verify your COGNIGY_BASE_URL and check the API docs at:");
    console.error("  " + baseUrl + "/openapi#tag--Packages");
    process.exit(1);
  }

  // Cognigy import is async — response contains a task ID to poll
  const taskId = json?._id || json?.taskId || json?.id;
  if (taskId) {
    console.log("Task ID:", taskId);
    process.stdout.write("Waiting for import to complete");
    await pollTask(taskId);
  } else {
    // Synchronous response (some environments return immediately)
    console.log("Import complete (synchronous response).");
  }

  // At this point the package is imported. Creating a voice endpoint still
  // requires knowing the new flow's ID — the easiest path is to look it up by name
  // in the Cognigy UI and copy the endpoint URL from there.
  //
  // If you want to automate endpoint creation too, add:
  //   POST /v2.0/endpoints with { name, flowId, type: "voice-gateway" }
  // and read the WebRTC token from the response.

  let webrtcUrl = webrtcUrlOverride;

  if (!webrtcUrl) {
    console.log("\nPackage imported successfully.");
    console.log("\nNext: create a Voice Gateway endpoint in Cognigy.AI:");
    console.log("  1. Open the project in Cognigy.AI");
    console.log("  2. Go to Deploy > Endpoints > New Endpoint > Voice Gateway");
    console.log("  3. Connect it to the imported flow");
    console.log("  4. Copy the WebRTC URL and run:");
    if (siteSpecPath && !noRegister) {
      console.log(`     node demo-hub/scripts/register-demo.js ${siteSpecPath} --webrtc-url <URL>`);
    } else {
      console.log("     node demo-hub/scripts/register-demo.js <site-spec.json> --webrtc-url <URL>");
    }
    return;
  }

  // WebRTC URL known — register in the hub
  if (siteSpecPath && !noRegister) {
    const registerScript = path.join(__dirname, "demo-hub", "scripts", "register-demo.js");
    if (fs.existsSync(registerScript)) {
      console.log("\nRegistering demo in hub...");
      execSync(`node "${registerScript}" "${siteSpecPath}" --webrtc-url "${webrtcUrl}"`, { stdio: "inherit" });
    } else {
      console.log("\nregister-demo.js not found at:", registerScript);
      console.log("Run manually:");
      console.log(`  node demo-hub/scripts/register-demo.js ${siteSpecPath} --webrtc-url ${webrtcUrl}`);
    }
  } else {
    console.log("\nWebRTC URL:", webrtcUrl);
    console.log("Run register-demo.js to add this to the hub:");
    console.log(`  node demo-hub/scripts/register-demo.js <site-spec.json> --webrtc-url ${webrtcUrl}`);
  }
}

main().catch(err => {
  console.error("\nFailed:", err.message);
  process.exit(1);
});
