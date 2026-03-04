---
name: package-builder
description: Load when calling cloneAndModify(), writing a build script, generating a ZIP package, debugging package import failures, or modifying clone-and-modify.js. Includes working examples, validation, and failure modes.
user-invocable: false
dependencies: [tool-design, cognigy-package-format]
source-files: [cognigy-package-generator/clone-and-modify.js, build-office-depot.js]
---

# Package Builder — Clone-and-Modify

## NEVER
- Never use `buildPackage()` or `writePackageZip()` — they produce packages that fail import.
- Never use `zip -r` — it creates directory entries that break Cognigy's parser.
- Never add `knowledgeData` to index.json.
- Never build nodeData from scratch — always clone from a working template node.
- Never omit the `mock` field on any node.
- Never set `hasError: true` on code nodes — always `false` or omit entirely.
- Never put `transpiled` on a code node with empty `code` — only add it when code is non-empty.
- Never guess field names or structures — read the source template node and clone it exactly.

## ALWAYS
- Always clone from `credit-card-analysis/` as the source template.
- Always use `find . -type f | sed 's|^\./||' | zip -D -@ output.zip` for ZIP creation.
- Always validate the output with `unzip -l` before delivering — zero directory entries allowed.
- Always include `mock: {isEnabled: false, code: ""}` on every node (clone-and-modify handles this).
- Always set `hasError: false` and `transpiled: "<same as code>"` on code nodes with content.

## Working Example (Office Depot — PROVEN)

```javascript
const { cloneAndModify } = require("./cognigy-package-generator/clone-and-modify");

cloneAndModify("./credit-card-analysis", {
  flowName: "Office Depot - AI Agent",
  description: "AI-powered IVR replacement",

  // Sets context.instructions in OnFirstExecution chain
  instructionsCode: 'context.instructions = `\n#INTRO\nYou are Olivia...\n#RULES\n...\n`;',

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
      answer: "Customer verified: {{context.customer.name}}..."
    },
    // ... more tools (supports any number)
    {
      toolId: "agent_handover",
      label: "Transfer to Agent",
      description: "Transfer to live human agent when needed.",
      parameters: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] },
      code: "",           // Empty code is fine — tool answer handles it
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
| `instructionsCode` | Yes | JS setting `context.instructions` — the main prompt |
| `knowledgeCode` | No | JS setting `context.knowledge` — FAQ content |
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
**Verify**: `unzip -l output.zip` — no lines with size 0.

### Package imports but flow is broken
**Cause**: Chart relations don't match nodeData files.
**Fix**: Run validation script — all chart node/children/next refs must exist in nodeData.

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
