---
name: package-builder
description: "Call cloneAndModify(), write a build script, generate a ZIP, or debug package import failures. Use this whenever the task involves clone-and-modify.js, build-*.js scripts, ZIP validation, 'Package Extraction Failed' errors, or any step between having a spec and having an importable ZIP."
user-invocable: false
dependencies: [tool-design, cognigy-package-format]
source-files: [cognigy-package-generator/clone-and-modify.js, build-office-depot.js]
compatibility: { tools: [Bash] }
---

# Package Builder -- Clone-and-Modify

## NEVER
- Never use `buildPackage()` or `writePackageZip()` -- they produce packages that fail import because they miss required fields like `mock`, `transpiled`, and correct cross-references.
- Never use `zip -r` -- it creates directory entries that break Cognigy's ZIP parser with "Package Extraction Failed".
- Never add `knowledgeData` to index.json -- it's not in working packages and its presence causes silent import corruption.
- Never build nodeData from scratch -- always clone from a working template node, because there are dozens of hidden required fields that aren't documented.
- Never omit the `mock` field on any node -- Cognigy's import validator rejects nodes without it.
- Never set `hasError: true` on code nodes -- Cognigy skips execution of error-flagged nodes, so the code silently never runs.
- Never put `transpiled` on a code node with empty `code` -- only add it when code is non-empty, because an empty transpiled field with empty code triggers a validation warning.
- Never guess field names or structures -- read the source template node and clone it exactly, because Cognigy's schema is strict and undocumented fields cause silent failures.

## ALWAYS
- Always clone from `credit-card-analysis/` as the source template -- it's the only proven-working base package.
- Always use `find . -type f | sed 's|^\./||' | zip -D -@ output.zip` for ZIP creation -- this is the only ZIP method that produces directory-entry-free archives Cognigy accepts.
- Always validate the output with `unzip -l` before delivering -- zero directory entries allowed, because even one breaks import.
- Always include `mock: {isEnabled: false, code: ""}` on every node (clone-and-modify handles this automatically).
- Always set `hasError: false` and `transpiled: "<same as code>"` on code nodes with content -- without `transpiled`, Cognigy may skip execution or show a code error in the editor.
- Flatten all tool data to `context.xxxResult` strings (see `tool-design` skill for patterns and examples).

## Working Example (Office Depot -- PROVEN)

```javascript
const { cloneAndModify, DEFAULT_PERSONA } = require("./cognigy-package-generator/clone-and-modify");

// Always destructure — return is { zipPath, siteSpecPath }, not a string
const { zipPath, siteSpecPath } = cloneAndModify("./credit-card-analysis", {
  flowName: "Office Depot - AI Agent",
  description: "AI-powered IVR replacement",

  // Sets context.instructions in OnFirstExecution chain
  instructionsCode: 'context.instructions = `\n#INTRO\nYou are Jane...\n#RULES\n...\n`;',

  // Sets context.knowledge in OnFirstExecution chain
  knowledgeCode: 'context.knowledge = `\n## Print Services\n...\n`;',

  // Configures the AI Agent Job node
  agentJobConfig: {
    name: "Customer Support Specialist",
    description: "You are Office Depot's voice-based virtual assistant...",
    instructions: "Refer to {{context.instructions}}...\nRefer to {{context.knowledge}}..."
  },

  // Each tool becomes: aiAgentJobTool → code → aiAgentToolAnswer
  tools: [
    {
      toolId: "authenticate",
      label: "Authenticate",
      description: "Verify customer identity using phone number...",
      useParameters: true,
      parameters: {
        type: "object",
        properties: {
          phone_number: { type: "string", description: "Customer's phone number." }
        },
        required: ["phone_number"],
        additionalProperties: false
      },
      code: "// Mock auth\ncontext.authenticated = true;\ncontext.customer = {...};",
      answer: "{{context.authResult}}"
    },
    // ... more tools (supports any number)
    {
      toolId: "agent_handover",
      label: "Transfer to Agent",
      description: "Transfer to live human agent when needed.",
      parameters: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] },
      code: "",           // Empty code is fine -- tool answer handles it
      answer: "Transferring to a live agent. Please hold."
    }
  ]
}, "./Output-Demo.zip");
```

## What clone-and-modify Does Internally
1. Reads all files from `credit-card-analysis/` as templates
2. Generates new IDs (shared timestamp+random prefix, incrementing counter)
3. Clones 10 skeleton nodes: start, once, onFirstExecution, afterwards, end, setSessionConfig, Instructions code, FAQ code, aiAgentJob, aiAgentJobDefault
4. For each tool: clones 3 new nodes from templates (aiAgentJobTool, code, aiAgentToolAnswer)
5. Builds chart relations connecting everything
6. Copies locale, aiAgent, connection as-is (shared resources)
7. Writes ZIP with no directory entries

## Flow Structure It Creates
```
Start → Once → [OnFirstExecution → SetSessionConfig → FAQ Code → Instructions Code]
             → [Afterwards → (null)]
       → AI Agent Job → [Default, Tool1, Tool2, ...] → End
Each tool: aiAgentJobTool → Code → Resolve Tool Answer → (null)
```

## Spec Field Reference
| Field | Required | Description |
|-------|----------|-------------|
| `flowName` | Yes | Name shown in Cognigy flow list |
| `description` | No | Package description |
| `instructionsCode` | Yes | JS setting `context.instructions` -- the main prompt |
| `knowledgeCode` | No | JS setting `context.knowledge` -- FAQ content |
| `agentJobConfig.name` | Yes | AI Agent Job name (e.g., "Customer Support Specialist") |
| `agentJobConfig.description` | Yes | Job description for the LLM |
| `agentJobConfig.instructions` | Yes | References to context vars (e.g., `Refer to {{context.instructions}}`) |
| `tools[].toolId` | Yes | snake_case identifier |
| `tools[].label` | Yes | Display name in Cognigy |
| `tools[].description` | Yes | When/how to use (the LLM reads this) |
| `tools[].parameters` | Yes | JSON Schema object |
| `tools[].code` | No | JS to run when tool is called (empty string if none) |
| `tools[].answer` | Yes | What to tell the LLM after tool executes |

## Failure Modes

### "Package Extraction Failed"
**Cause**: ZIP contains directory entries.
**Fix**: Use `find . -type f | sed 's|^\./||' | zip -D -@ output.zip`.
**Verify**: `unzip -l output.zip` -- no lines with size 0.

### Package imports but flow is broken
**Cause**: Chart relations don't match nodeData files.
**Fix**: Run validation script -- all chart node/children/next refs must exist in nodeData.

### AI Agent doesn't use tools
**Cause**: `agentJobConfig.instructions` doesn't reference `{{context.instructions}}`.
**Fix**: Always include `Refer to {{context.instructions}}` in the job instructions.

### Tool code runs but answer is wrong
**Cause**: Answer references context vars that code didn't set.
**Fix**: Ensure code sets the same context keys that the answer template uses.

## Validation Checklist
```bash
# 1. Build
node build-[company].js

# 2. Check ZIP format (NO size-0 directory entries)
unzip -l ./Output.zip | grep "^        0"  # Should return nothing

# 3. Spot-check a node for mock field
unzip -p ./Output.zip nodeData/$(unzip -l ./Output.zip | grep nodeData | head -1 | awk '{print $4}') | python3 -c "import sys,json; n=json.load(sys.stdin); print('mock:', 'mock' in n)"
```

## Demo Hub Integration

`cloneAndModify()` now **auto-writes a `*-site-spec.json`** alongside every ZIP. This file drives the private demo hub (React + Supabase) at `/Users/Adam.Boyle/Cognigy/demo-hub/`.

### Return value change
`cloneAndModify()` now returns an object, not a string:
```javascript
const { zipPath, siteSpecPath } = cloneAndModify("./credit-card-analysis", spec, "./Output.zip");
// zipPath:      "./Output.zip"
// siteSpecPath: "./Output-site-spec.json"
```

### Spec fields that control the site-spec output
| Spec field | site-spec field | Description |
|---|---|---|
| `siteId` | `id` | URL slug (e.g., `"benesys"`) -- required for hub registration |
| `siteColor` | `color` | Hex brand color (e.g., `"#0057A8"`) |
| `siteIcon` | `icon` | Lucide icon name for the demo card (e.g., `"Stethoscope"`) |
| `siteGradient` | `gradient` | Tailwind gradient class (e.g., `"from-blue-600 to-indigo-700"`) |
| `siteFallback` | `fallback` | Fallback initials if no avatar (e.g., `"BS"`) |
| `siteAvatar` | `avatar` | URL or path to avatar PNG (optional, set post-deploy) |
| `siteSortOrder` | `sort_order` | Display order in the hub index |
| `tools[].siteIcon` | `capabilities[].icon` | Lucide icon name per capability badge |

### spec.voice -- set TTS on the aiAgentJob node directly
Pass a `voice` object to configure TTS without touching SetSessionConfig:
```javascript
spec.voice = {
  ttsVendor:   "ElevenLabs",
  ttsVoice:    "Jane - warm and conversational",
  ttsModel:    "eleven_multilingual_v2",
  ttsLanguage: "en-US",
  ttsLabel:    "Jane"   // display label in Cognigy editor
};
```
This sets TTS directly on the aiAgentJob node (SE hub pattern -- one node owns TTS, not session config).

### site-spec.json structure (auto-generated)
```json
{
  "id":          "benesys",
  "name":        "BeneSys",
  "description": "Provider-facing claims IVR",
  "path":        "benesys",
  "icon":        "Stethoscope",
  "color":       "#0057A8",
  "gradient":    "from-blue-600 to-indigo-700",
  "fallback":    "BS",
  "avatar":      null,
  "webrtc_url":  null,
  "capabilities": [
    { "label": "HIPAA Auth", "icon": "ShieldCheck" },
    { "label": "EOB Lookup", "icon": "FileText" }
  ],
  "sort_order":  1,
  "enabled":     true,
  "coming_soon": false
}
```
`webrtc_url` is null until the Cognigy endpoint is deployed. Set it with the register command (see below).

### Register command (after Cognigy endpoint is deployed)
```bash
node demo-hub/scripts/register-demo.js ./Output-site-spec.json --webrtc-url https://endpoint-trial-us.cognigy.ai/TOKEN
```
This pushes the spec to Supabase. The demo appears immediately at `/<demo-path>` on the hub.

### Hub local dev
```bash
cd /Users/Adam.Boyle/Cognigy/demo-hub
npm run dev
```

### Full pipeline (build → import → register in one shot)
```bash
# Step 1: build
node build-benesys.js
# → produces benesys.zip + benesys-site-spec.json

# Step 2: import ZIP via REST API (uploads to Cognigy.AI, polls for completion)
node import-package.js ./benesys.zip --site-spec ./benesys-site-spec.json
# → if COGNIGY_BASE_URL/COGNIGY_API_KEY/COGNIGY_AGENT_ID are in .env, uploads automatically
# → prints next steps for endpoint creation (still manual in UI)

# Step 3: after creating Voice Gateway endpoint in UI, copy the WebRTC URL:
node demo-hub/scripts/register-demo.js ./benesys-site-spec.json --webrtc-url https://endpoint-trial-us.cognigy.ai/TOKEN

# Or shortcut: pass --webrtc-url directly to import-package.js to auto-register:
node import-package.js ./benesys.zip --site-spec ./benesys-site-spec.json --webrtc-url https://...TOKEN
```

Required `.env` additions for import-package.js:
```
COGNIGY_BASE_URL=https://api-trial.cognigy.ai
COGNIGY_API_KEY=your-api-key        # Cognigy.AI > My Profile > API Keys
COGNIGY_AGENT_ID=your-24-char-id   # from the URL in Cognigy.AI
```

---

## Persona Support

Demo builds have a configurable test persona. The defaults are Adam Boyle's lab credentials:

```javascript
const { cloneAndModify, DEFAULT_PERSONA } = require("./cognigy-package-generator/clone-and-modify");
// DEFAULT_PERSONA = { name: "Adam Boyle", phone: "+18484668825", dob: "1988-12-05", id: "OD-7742891" }
```

**Option 1 — Template placeholders** (cleanest for new build scripts):
```javascript
const knowledgeCode = `context.knowledge = \`
  ## Caller
  Name: {{PERSONA_NAME}}
  Phone: {{PERSONA_PHONE}}
  DOB: {{PERSONA_DOB}}
  ID: {{PERSONA_ID}}
\`;`;

// Override persona for a specific client demo:
spec.persona = { name: "Sarah Kim", phone: "+12125550199", dob: "1990-03-22", id: "C-998812" };
```
`cloneAndModify()` substitutes `{{PERSONA_*}}` before writing nodes.

**Option 2 — Import the constant** (for scripts that need to build the strings dynamically):
```javascript
const { DEFAULT_PERSONA } = require("./cognigy-package-generator/clone-and-modify");
const knowledgeCode = `context.knowledge = \`Name: ${DEFAULT_PERSONA.name} | Phone: ${DEFAULT_PERSONA.phone}\`;`;
```

---

## Validation (Automatic)

`cloneAndModify()` runs a pre-flight check before writing the ZIP and prints warnings to stdout. No configuration needed. Catches:
- Any node missing `mock` field (auto-fixed)
- Code nodes with content but no `transpiled` (auto-fixed)
- `knowledgeData` in index.json (auto-removed)
- `required: []` in any tool's parameters schema (warning — fix in the build script)
- Empty `instructionsCode` (warning)
- Zero tools (warning)

Warnings never block the build — they're informational. Fix them in the build script before delivery.

---

## Multi-Agent Handover (spec.additionalAgents)

To add a second specialist agent that the primary agent can hand off to:

```javascript
spec.additionalAgents = [
  {
    handoverLabel: "Transfer to Billing Specialist",
    agentJobConfig: {
      name: "Billing Specialist",
      description: "Expert in billing, payments, and account adjustments.",
      instructions: "Refer to {{context.instructions}}. Focus only on billing topics."
    },
    tools: [
      {
        toolId: "adjust_payment",
        label: "Adjust Payment",
        description: "Apply a credit or adjustment to an account.",
        parameters: { type: "object", properties: { amount: { type: "number", description: "Credit amount in dollars." } }, required: ["amount"] },
        code: "context.adjustResult = 'Credit of $' + input.slots.adjust_payment.amount + ' applied.';",
        answer: "{{context.adjustResult}}"
      }
    ]
  }
];
```

This adds an `aiAgentHandover` node as a branch of the primary AI Agent Job. When the primary agent calls it, control transfers to the specialist's own `aiAgentJob` node with its own tool set. The specialist returns to the same `End` node.

Flow structure with one additional agent:
```
Primary AI Agent Job → [Default, Tool1, Tool2, Handover: Billing Specialist] → End
Billing Specialist AI Agent Job → [Default, adjust_payment] → End
```

Note: The frontend (demo hub) detects agent transitions via `agentId` in SIP INFO metadata. To show a different avatar for the specialist, add a `sendMetadata` node or use the SE hub SIP INFO pattern.
