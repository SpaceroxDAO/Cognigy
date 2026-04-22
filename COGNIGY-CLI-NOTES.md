# Cognigy CLI — Notes & Future Integration Plan

## What It Is

`@cognigy/cognigy-cli` is a command-line tool for syncing Cognigy.AI projects to/from local disk. Think of it as version control + deployment tooling for agents — not a package generator.

- **Install:** `npm install -g @cognigy/cognigy-cli`
- **GitHub:** https://github.com/Cognigy/Cognigy-CLI
- **Docs:** https://docs.cognigy.com/ai/for-developers/developers/api-and-cli
- **Help Center:** https://support.cognigy.com/hc/en-us/articles/360016865839

---

## Key Commands

| Command | What it does |
|---|---|
| `cognigy init` | Initialize project, creates `config.json` |
| `cognigy clone` | Pull entire agent to disk (flows, endpoints, lexicons, AI agents) |
| `cognigy push` | Upload local changes back to Cognigy.AI |
| `cognigy pull` | Pull specific resources |
| `cognigy diff` | Compare local vs. remote versions |
| `cognigy train flow` | Trigger NLU training |
| `cognigy create snapshot` | Create a deployment snapshot remotely |
| `cognigy run playbooks` | Run scripted test conversations (exit 0 = pass, 1 = fail, 2 = timeout) |
| `cognigy export/import` | Flow content as CSV for localization |

Works on: Flows, Lexicons, Endpoints, Snapshots, Locales, Extensions, AI Agents.

---

## What It Cannot Do (Current Gaps)

- **Cannot import/export ZIP packages** — package import is UI-only today (or REST API)
- **Cannot create resources from scratch** — only Snapshots and Locales can be created; all other resources must already exist
- No programmatic package generation (that's what `clone-and-modify.js` is for)

---

## How CLI + This Project Fit Together

The CLI and `clone-and-modify.js` solve different problems and are complementary:

| Step | Current approach | With CLI / API |
|---|---|---|
| Generate package ZIP | `node build-[company].js` | No change — CLI doesn't cover this |
| Import package | Manual UI import | REST API wrapper (future) |
| Version control demo | Not in place | `cognigy clone` + `cognigy diff` |
| QA / test demo | Manual transcript review | `cognigy run playbooks` (future) |
| Snapshot for delivery | Manual in UI | `cognigy create snapshot` (future) |
| Update demo content | Edit build script, rebuild, re-import | `cognigy push` after local edit (future) |

---

## Planned Future Capabilities

### 1. REST API Package Import Script
**Problem:** After `node build-[company].js` generates a ZIP, we still import manually via the Cognigy UI.
**Plan:** Write a small Node script (`import-package.js`) that calls the Cognigy Management API to POST the ZIP directly. This would make delivery fully automated — build + import in one step.
**Reference:** Cognigy Management API (same endpoint the UI uses for Packages → Import)

### 2. Playbook-Based QA Automation
**Problem:** Demo QA is currently manual — Adam runs it and reviews the transcript.
**Plan:** Write Cognigy playbooks that script each tool call (authenticate → claim lookup → denial details), then run `cognigy run playbooks` as a pre-delivery check. The exit code (0/1/2) makes it pipeable.
**Value:** Catch regressions when updating a demo without a full manual run.

### 3. Snapshot Automation for Delivery
**Problem:** After import + LLM/TTS config, creating a snapshot is a manual UI step.
**Plan:** Once a demo is configured, run `cognigy create snapshot` via CLI to lock it for endpoint deployment. Could be combined with step 1 into a single delivery script.

### 4. Version Control / Diff for Demo Updates
**Problem:** No tracking of what changed between demo versions.
**Plan:** After each demo import, run `cognigy clone` to pull a local copy. Use `cognigy diff` to compare before/after when iterating. Useful for "what changed between the v1 and v2 demos for this prospect."

### 5. Full Delivery Pipeline (Long-term)
Combine all of the above into a single script or Makefile:
```
node build-[company].js           # Generate ZIP
node import-package.js [zip]      # Import via REST API
cognigy create snapshot           # Lock for deployment
cognigy run playbooks             # QA check
```
Would reduce demo delivery from ~10 manual steps to one command.

---

## CI/CD Notes

The CLI is fully designed for CI/CD — it supports:
- Config via environment variables (overrides `config.json` for secrets)
- HTTP proxy support (`HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`)
- Exit codes on playbook runs (pipeable)
- Can be integrated into GitHub Actions, Jenkins, etc.

**Minimum `config.json`:**
```json
{
  "baseUrl": "https://api.cognigy.ai",
  "apiKey": "YOUR_API_KEY",
  "agent": "PROJECT_ID",
  "agentDir": "./local-project",
  "playbookTimeoutSeconds": 300
}
```
