---
name: tool-design
description: Load when designing AI Agent tools, writing tool schemas, creating mock data for tool code nodes, writing tool answer text, or defining the tools array in a build spec.
user-invocable: false
dependencies: [instruction-patterns, node-reference]
source-files: [cognigy-package-generator/clone-and-modify.js]
---

# Tool Design Patterns

## NEVER
- Never use `oneOf`, `anyOf`, or `allOf` at the JSON Schema root — Azure OpenAI rejects them.
- Never omit `additionalProperties: false` — the LLM will hallucinate extra fields.
- Never use `required: []` with no items — omit `required` entirely if nothing is required.
- Never put long prose in tool descriptions — the LLM wastes tokens reading them. 2-3 sentences max.
- Never design tools that overlap in purpose — the LLM won't know which to call.
- Never make a tool do two unrelated things — split it into two tools.
- Never reference `input.payload` in answers — use `{{context.variableName}}` set by the code node.
- Never use array index access in answer templates — `{{context.list.0.field}}` silently returns empty. Flatten in code instead.
- Never use nested object paths in answer templates — `{{context.a.b.c}}` is fragile. Flatten to a single string in the code node.
- Never leave tool code empty if the answer needs data — always write code that sets `context.xxxResult` as a flat string.
- Never make `required` incomplete for tools that need user input — if the AI can call the tool without collecting key info (like item description for returns), it will skip asking.

## ALWAYS
- Always use `snake_case` for toolId.
- Always include `additionalProperties: false` in parameters schema.
- Always start the tool description with WHEN to use it, not HOW.
- Always have `authenticate` as tool #1 and `agent_handover` as the last tool.
- Always make mock code idempotent — calling the tool twice shouldn't break the demo.
- Always set context variables in code nodes, then reference them in answers via `{{context.varName}}`.
- Always use a tool-name prefix for prospect-specific demos (e.g., `dm_` for DreamMapper, `od_` for Office Depot) when building multiple demos that might coexist.

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
**Use `enum`** for fields with known values — it prevents hallucination.
**Use `description`** on every property — the LLM reads these to decide what to pass.

## Mock Code Patterns

**CRITICAL**: Every tool must have code that flattens data into a single `context.xxxResult` string. The answer should be just `{{context.xxxResult}}`. Never rely on nested object access or array indices in answer templates — they silently return empty strings.

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

### Instructional (tells LLM what to do next — also works well)
```
"Tell the user their card is activated and ready to use. Ask if there is anything else."
```

### BROKEN PATTERNS (DO NOT USE)
```
// Array access — silently returns empty:
"{{context.customer.recentOrders.0.orderId}}"

// Nested object path — fragile:
"{{context.customer.preferredStore.name}}"

// Empty code with template answer — data never gets set:
code: ""  +  answer: "{{context.someVar}}"
```

## xApp Tools (6 nodes instead of 3)

xApp tools send a branded HTML page via SMS. Use when a tool's output benefits from a visual — order tracking, consent forms, status cards, brochures.

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
- Never omit the SDK script — the xApp page won't be able to communicate back
- Never use dynamic data in xApp HTML — it's baked into the package at build time
- Never change the SMS body snippet — it's always the fixed `[[snippet-eyJ0eXBl...]]` from the template
- Never create an xApp tool without `spec.sms` — the sendSMS node needs `from`/`to`

## Tool Design Checklist

For each tool, verify:
- [ ] `toolId` is `snake_case` and unique across all tools
- [ ] `description` starts with WHEN to use (e.g., "Use after authentication to...")
- [ ] `parameters` has `additionalProperties: false`
- [ ] `required` includes ALL fields the AI must collect before calling (don't let it skip questions)
- [ ] Code node sets `context.xxxResult` as a FLAT STRING (no nested objects/arrays in the answer path)
- [ ] Answer is just `{{context.xxxResult}}` — never array access, never nested paths
- [ ] Code is NOT empty — every tool needs code that flattens data
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
**Fix**: Same as above — flatten in code, single template ref in answer.

### AI calls tool without collecting required info
**Cause**: The `required` array in parameters is too permissive. E.g., returns tool only requires `reason` but not `order_id` or `item_description`.
**Fix**: Add ALL fields the AI must collect to `required`. Also add to tool description: "You MUST collect X, Y, and Z before calling this tool."

### Demo breaks on second call
**Cause**: Code appends to arrays or increments counters without resetting.
**Fix**: Always overwrite context vars, don't append.
