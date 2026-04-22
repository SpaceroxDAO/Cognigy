---
name: tool-design
description: "Design AI Agent tools: schemas, mock data, code nodes, answer text, and the tools array in a build spec. Use this whenever the task involves tool parameters, tool descriptions, mock code patterns, answer templates, xApp tool chains, or debugging why a tool returns empty data or the wrong result -- even for a single tool tweak."
user-invocable: false
dependencies: [instruction-patterns, node-reference]
source-files: [cognigy-package-generator/clone-and-modify.js]
---

# Tool Design Patterns

## NEVER
- Never use `oneOf`, `anyOf`, or `allOf` at the JSON Schema root -- Azure OpenAI rejects them with a schema validation error, breaking the entire tool.
- Never omit `additionalProperties: false` -- without it, the LLM will hallucinate extra fields that get silently ignored, making debugging impossible.
- Never use `required: []` with no items -- omit `required` entirely if nothing is required, because an empty array can cause schema validation issues on some LLM providers.
- Never put long prose in tool descriptions -- the LLM wastes tokens reading them. 2-3 sentences max, starting with WHEN to use.
- Avoid tools that overlap in purpose -- when two tools match a request, the LLM can't reliably pick the right one, leading to wrong calls or flip-flopping between tools.
- Never make a tool do two unrelated things -- split it into two tools, because the LLM can't reliably decide which "mode" to use and passes wrong parameters.
- Never reference `input.payload` in answers -- use `{{context.variableName}}` set by the code node, because answer templates are CognigyScript, not JS.
- Never use array index access in answer templates -- `{{context.list.0.field}}` silently returns empty in Cognigy's template engine. Flatten in code instead.
- Never use nested object paths in answer templates -- `{{context.a.b.c}}` is fragile and often resolves to empty. Flatten to a single string in the code node.
- Never leave tool code empty if the answer needs data -- always write code that sets `context.xxxResult` as a flat string, otherwise the answer template resolves to blank.
- Never make `required` incomplete for tools that need user input -- if the AI can call the tool without collecting key info (like item description for returns), it will skip asking and the demo looks broken.

## ALWAYS
- Always use `snake_case` for toolId -- Cognigy's tool routing uses exact string matching and mixed case causes misroutes.
- Always include `additionalProperties: false` in parameters schema -- see NEVER above.
- Always start the tool description with WHEN to use it, not HOW -- the LLM scans descriptions to pick a tool, and "Use when the customer asks about..." is faster to match than "This tool retrieves...".
- Always have `authenticate` as tool #1 and `agent_handover` as the last tool -- the LLM follows the numbered tool order as a workflow, and auth must happen before account-specific tools can return data.
- Always make mock code idempotent -- calling the tool twice shouldn't break the demo, because the LLM sometimes retries tool calls.
- Always set context variables in code nodes, then reference them in answers via `{{context.varName}}` -- this is the only reliable data flow path.
- Always flatten all tool data to `context.xxxResult` strings -- see mock code patterns below for examples.
- **Before finalizing any tool spec, scan every parameters block: if nothing is required, omit the `required` key entirely. Never write `required: []`.** This trips up every time -- the NEVER rule exists but empty arrays still get written. Delete it rather than leaving it empty.

## Tool Anatomy (3 nodes per tool)

```
aiAgentJobTool     → Defines: toolId, description, parameters schema
    ↓ next
code               → Runs: mock JS that sets context variables
    ↓ next
aiAgentToolAnswer  → Returns: templated answer the LLM reads as tool output
```

## Parameter Schema Pattern

```json
{
  "type": "object",
  "properties": {
    "required_field": {
      "type": "string",
      "description": "One-sentence explanation."
    },
    "optional_field": {
      "type": "string",
      "enum": ["option_a", "option_b"],
      "description": "Constrain with enum when possible."
    }
  },
  "required": ["required_field"],
  "additionalProperties": false
}
```

**Supported types**: `string`, `number`, `boolean`, `object`, `array`
**Use `enum`** for fields with known values -- it prevents hallucination.
**Use `description`** on every property -- the LLM reads these to decide what to pass.

## Mock Code Patterns

**CRITICAL**: Every tool must have code that flattens data into a single `context.xxxResult` string. The answer should be just `{{context.xxxResult}}`. Never rely on nested object access or array indices in answer templates -- they silently return empty strings.

### Pattern 1: Authentication (sets up demo persona + flat result)
```javascript
const payload = input?.payload || {};
context.authenticated = true;
context.customer = {
  name: "Adam Boyle",
  phone: payload.phone_number || "+1-848-466-8825",
  rewardsId: "OD-7742891",
  rewardsTier: "VIP",
  recentOrders: [{ orderId: "OD-98234571", status: "Delivered", items: "..." }]
};
// ALWAYS flatten the answer into a single string
context.authResult = "Customer verified: " + context.customer.name + ". Tier: " + context.customer.rewardsTier + ".";
```

### Pattern 2: Lookup (reads from existing context, flattens to string)
```javascript
// NEVER leave code empty if the answer needs data
const c = context.customer || {};
const orders = c.recentOrders || [];
context.orderResult = orders.map(o => "Order " + o.orderId + ": " + o.items + " - " + o.status).join(". ");
```

### Pattern 3: Action (creates result, flattens to string)
```javascript
const payload = input?.payload || {};
const returnId = "RET-" + Math.floor(Math.random() * 90000 + 10000);
context.returnResult = "Return initiated. Return ID: " + returnId + " for order " + (payload.order_id || "unknown") + ". Item: " + (payload.item_description || "item") + ". Eligible for return.";
```

### Pattern 4: Branching by query_type
```javascript
const payload = input?.payload || {};
const qt = payload.query_type || "balance";
let result = "Customer: " + (context.customer?.name || "Unknown") + ".";
if (qt === "history") {
  result += " Recent activity: Earned $4.47 on Feb 28. Redeemed $15.00 on Feb 15.";
} else if (qt === "benefits") {
  result += " VIP benefits: 5% back on ink, toner, paper.";
}
context.rewardsResult = result;
```

## Answer Patterns

### Voice-Friendly Answer Text
Tool answers are what the agent reads aloud. When flattening data in code nodes, use TTS-friendly formatting:
- Spell out dates: `"April eighteenth, twenty twenty-five"` not `"04/18/2025"`
- Spell out dollars: `"Two hundred thirty-six dollars and thirteen cents"` not `"$236.13"`
- Spell out addresses: `"One-Two-Three Main Street"` not `"123 Main St"`
- Use commas for natural pacing: `"Order confirmed, your reference number is..."` not periods
- Or use the instructional pattern and let the LLM format it naturally (preferred for complex data)

### PROVEN PATTERN: Flat context reference (ALWAYS use this)
```
"{{context.xxxResult}}"
```
The code node does all the work. The answer is just a single template variable.

### Instructional (tells LLM what to do next -- also works well)
```
"Tell the user their card is activated and ready to use. Ask if there is anything else."
```

### Instructional for multi-option results (CRITICAL -- use this when the result has 2+ next steps)
When a tool result presents multiple options or resolution paths (e.g., a denial with two ways to appeal), use the instructional pattern to prevent the agent from listing both options in one turn -- which violates the "never list steps" voice rule.
```javascript
// Code node: include both options in the result string
context.denialResult = "Claim denied. Code CO-97. Reason: no prior auth. Two resolution paths: retrospective prior auth submission, or ERISA appeal within sixty days.";

// Answer: instruct the LLM to surface options one at a time
answer: "{{context.denialResult}} Tell the caller there are two ways to resolve this, then ask which they'd like to explore first -- before describing either one."
```
This keeps the agent conversational instead of reading a list.

### BROKEN PATTERNS (DO NOT USE)
```
// Array access -- silently returns empty:
"{{context.customer.recentOrders.0.orderId}}"

// Nested object path -- fragile:
"{{context.customer.preferredStore.name}}"

// Empty code with template answer -- data never gets set:
code: ""  +  answer: "{{context.someVar}}"
```

## xApp Tools (6 nodes instead of 3)

xApp tools send a branded HTML page via SMS. Use when a tool's output benefits from a visual -- order tracking, consent forms, status cards, brochures.

```
aiAgentJobTool → code → initAppSession → sendSMS → setHTMLAppState → aiAgentToolAnswer
```

### Spec format
```javascript
// Per-tool: add xApp property (makes it an xApp tool)
{
  toolId: "order_status",
  label: "Order Status",
  description: "...",
  parameters: {...},
  code: `// Flatten data as usual
context.orderResult = "Order " + match.orderId + ": " + match.status;`,
  answer: "I've sent a tracking link to your phone via text. {{context.orderResult}}",
  xApp: {
    logoUrl: "https://example.com/logo.png",
    backgroundColor: "#CC0000",
    html: `<!DOCTYPE html>...`  // branded HTML with Tailwind + SDK
  }
}

// Spec-level: SMS config (shared by all xApp tools)
spec.sms = { from: "+12243487563", to: "+18484668825" };
```

### HTML Requirements
- Include `<script src="/sdk/app-page-sdk.js"></script>` for the xApp SDK
- Use `SDK.submit({ action: "close" })` for close/action buttons
- Use Tailwind CDN for styling: `<script src="https://cdn.tailwindcss.com"></script>`
- Mobile-responsive with `viewport-fit=cover` and safe-area-inset padding
- Static mock data (HTML is fixed at build time, not dynamic)

### NEVER for xApp tools
- Never omit the SDK script -- the xApp page won't be able to communicate back to the conversation.
- Never use dynamic data in xApp HTML -- it's baked into the package at build time, so template variables won't resolve.
- Never change the SMS body snippet -- it's always the fixed `[[snippet-eyJ0eXBl...]]` from the template that Cognigy uses to generate the xApp URL.
- Never create an xApp tool without `spec.sms` -- the sendSMS node needs `from`/`to` to deliver the link.

## Tool Design Checklist

For each tool, verify:
- [ ] `toolId` is `snake_case` and unique across all tools
- [ ] `description` starts with WHEN to use (e.g., "Use after authentication to...")
- [ ] `parameters` has `additionalProperties: false`
- [ ] `required` includes ALL fields the AI must collect before calling (don't let it skip questions)
- [ ] Code node sets `context.xxxResult` as a FLAT STRING (no nested objects/arrays in the answer path)
- [ ] Answer is just `{{context.xxxResult}}` -- never array access, never nested paths
- [ ] Code is NOT empty -- every tool needs code that flattens data
- [ ] Tool doesn't overlap with another tool's responsibility

## Common Mistakes

### The LLM calls the wrong tool
**Cause**: Tool descriptions overlap. E.g., both `order_status` and `returns` say "look up order info."
**Fix**: Make descriptions mutually exclusive. Start with the trigger: "Use when the customer asks about returning an item."

### The LLM passes wrong parameters
**Cause**: Property descriptions are vague or missing.
**Fix**: Add `description` to every property. Use `enum` to constrain values.

### Tool answer has `undefined` or empty values
**Cause**: Answer template uses array access (`{{context.list.0.field}}`) or nested paths that don't resolve in Cognigy's template engine.
**Fix**: Flatten ALL data into a single `context.xxxResult` string in the code node. Answer should be just `{{context.xxxResult}}`.

### AI says "details didn't load correctly" or "information isn't available"
**Cause**: Answer template resolved to mostly empty strings because of nested/array access. The AI sees blanks and assumes the lookup failed.
**Fix**: Same as above -- flatten in code, single template ref in answer.

### AI calls tool without collecting required info
**Cause**: The `required` array in parameters is too permissive. E.g., returns tool only requires `reason` but not `order_id` or `item_description`.
**Fix**: Add ALL fields the AI must collect to `required`. Also add to tool description: "You MUST collect X, Y, and Z before calling this tool."

### Demo breaks on second call
**Cause**: Code appends to arrays or increments counters without resetting.
**Fix**: Always overwrite context vars, don't append.
