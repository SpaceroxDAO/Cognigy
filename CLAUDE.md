# CLAUDE.md

This project generates Cognigy.AI demo packages programmatically. Given a prospect's context (company, industry, use case), we produce a ready-to-import ZIP package with a complete AI Agent flow.

## Project Structure

```
cognigy-package-generator/     # Node.js package generator
  clone-and-modify.js          # PRIMARY: clone working package, swap content (PROVEN)
  index.js                     # Legacy: buildPackage(), writePackageZip() (DO NOT USE)
  lib/                         # Legacy sub-modules (kept for reference)
credit-card-analysis/          # Extracted working base package (Credit Card Activation)
build-office-depot.js          # Example: Office Depot IVA demo build script
import-package.js              # Upload a ZIP to Cognigy.AI via REST API + auto-register in hub
demo-hub/                      # Private React+Supabase demo portal (local)
  scripts/register-demo.js     # Upsert a site-spec.json row into Supabase flows table
```

## How to Generate a Package (Clone-and-Modify)

```javascript
const { cloneAndModify, DEFAULT_PERSONA } = require("./cognigy-package-generator/clone-and-modify");

// Always destructure — return value is { zipPath, siteSpecPath }, not a string.
const { zipPath, siteSpecPath } = cloneAndModify(
  "./credit-card-analysis",   // Source: extracted working package
  {
    flowName: "Demo Flow Name",
    description: "Package description",
    instructionsCode: 'context.instructions = `...`;',  // supports {{PERSONA_NAME}} etc.
    knowledgeCode: 'context.knowledge = `...`;',
    agentJobConfig: { name: "Jane", description: "...", instructions: "..." },
    persona: { ...DEFAULT_PERSONA },   // optional: override test persona per build
    tools: [
      { toolId: "tool_id", label: "Tool", description: "...", parameters: {...}, code: "...", answer: "..." }
    ]
  },
  "./output.zip"
);
// zipPath:      resolved path to the ZIP
// siteSpecPath: resolved path to the *-site-spec.json for demo hub registration
```

## CRITICAL: Package Import Requirements

1. **ZIP must have NO directory entries** — Cognigy fails on empty dir entries
2. **Every node needs `mock: {isEnabled: false, code: ""}`** — clone-and-modify handles this
3. **Code nodes with content need `hasError: false` and `transpiled`** fields
4. **index.json must NOT have `knowledgeData`** — omit it entirely
5. **Always clone from a working package** — don't build from scratch

## Standard Demo Flow Pattern

```
Start → Once → [OnFirstExecution: SetSessionConfig → FAQ Code → Instructions Code]
      → AI Agent Job (Default + Tool branches) → End
Regular tool: aiAgentJobTool → Code (mock logic) → Resolve Tool Action
xApp tool:    aiAgentJobTool → Code → initAppSession → sendSMS → setHTMLAppState → Resolve Tool Action
```

## xApp Tools (SMS + Branded HTML)

Add `tool.xApp` to make a tool send a branded web page via SMS:
```javascript
tool.xApp = { logoUrl: "https://...", backgroundColor: "#CC0000", html: "<!DOCTYPE html>..." };
spec.sms = { from: "+12243487563", to: "+18484668825" };  // spec-level, shared by all xApp tools
```

## Instruction Prompt Structure

Use `context.instructions` with sections: `#INTRO`, `#RULES` (ALWAYS/NEVER/Confirmation), `#TOOL ORDER`, then domain-specific rules. The standard voice rules (mandatory for every demo) are in the `instruction-patterns` skill. Agent name is always "Jane".

## Key Conventions

- **IDs**: `_id` = 24-char hex (MongoDB ObjectId, shared prefix), `referenceId` = UUID v4
- **Cross-refs**: flow↔chart, chart↔nodeData, nodeData↔locale, flowState/Settings/ITG→flow
- **Node extension**: Always `@cognigy/basic-nodes` (voice nodes: `@cognigy/voicegateway2`)
- **Voice stack**: Deepgram Nova-3 STT + ElevenLabs eleven_multilingual_v2 TTS
- **Demo persona**: "Adam Boyle" (+1-848-466-8825)

## Commands

- `/create-demo` — Main workflow: create a demo package from prospect context
- `/analyze-flow` — Analyze an existing flow from a package for reference

## Skills — Auto-Loaded Based on Task Context

Skills are loaded on-demand. CLAUDE.md is always in context and acts as the routing layer.
**You MUST load the relevant skills before starting work.** Don't guess — load the skill and follow it.

### When to Load Each Skill

| When the task involves... | Load these skills |
|---|---|
| Building a new demo end-to-end (from prospect name to ZIP) | `demo-builder` → then `prospect-research`, `tool-design`, `instruction-patterns`, `voice-config`, `package-builder` as each phase begins |
| Writing a build script or calling `cloneAndModify()` | `package-builder` |
| Designing tools (schemas, mock data, answer text) | `tool-design` |
| Writing `context.instructions`, `context.knowledge`, or auth code | `instruction-patterns` |
| Configuring voice (TTS/STT, pronunciation, silence overlay) | `voice-config` |
| Researching a prospect company before building | `prospect-research` |
| Debugging a package import failure or inspecting ZIP structure | `cognigy-package-format` |
| Looking up a node type's config fields or extension name | `node-reference` |
| Modifying `clone-and-modify.js` itself | `package-builder` + `cognigy-package-format` |
| Reviewing or improving an existing demo's content | `instruction-patterns` + `tool-design` |
| Adding voice-specific features (DTMF, barge-in, no-input) | `voice-config` + `node-reference` |
| Reviewing a demo transcript or session logs | `demo-review` |
| QA testing a demo before delivery | `demo-review` + `tool-design` |
| Responding to an RFP, RFI, or vendor questionnaire | `rfp-responder` |
| Filling out a procurement Excel questionnaire | `rfp-responder` |
| Registering a demo in the demo hub / building a demo site | `demo-builder` + `package-builder` |
| Working on `demo-hub/` (React frontend, Supabase, routing) | `package-builder` |

### Source File → Skill Lookup

Before modifying any source file, read the relevant skill first.

| Working on... | Read first |
|---|---|
| `cognigy-package-generator/clone-and-modify.js` | `package-builder` + `cognigy-package-format` |
| `build-office-depot.js` (or any build script) | `package-builder` + `tool-design` |
| `credit-card-analysis/nodeData/*` | `node-reference` |
| `credit-card-analysis/chart/*` | `cognigy-package-format` |

### Skill Reference

- **`demo-builder`** — End-to-end process: research, spec, build, validate, deliver. The orchestrator skill.
- **`package-builder`** — clone-and-modify usage, working examples, failure modes, ZIP validation.
- **`tool-design`** — Tool schemas, mock data patterns, answer patterns, common mistakes.
- **`instruction-patterns`** — Standard voice rules (MANDATORY for every demo), prompt structure, three code node chain.
- **`voice-config`** — TTS/STT settings, pronunciation rules, what breaks in voice demos.
- **`prospect-research`** — How to research a prospect and extract demo-relevant context.
- **`cognigy-package-format`** — ZIP structure, file schemas, cross-references. Debug reference.
- **`demo-review`** — Structured QA from transcripts & logs. Checklist, severity guide, output format.
- **`node-reference`** — All Cognigy node types and their config schemas.
- **`rfp-responder`** — Fill RFP/RFI Excel questionnaires with NiCE+Cognigy answers using Python/openpyxl. Capability reference and company info in skill references/.

## Testing

```bash
node build-office-depot.js    # Build Office Depot demo (example/reference)
# Verify: output should show "nodeData: 34" and "Tools: 7 (1 xApp)"
```
