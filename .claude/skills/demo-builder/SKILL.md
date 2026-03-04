---
name: demo-builder
description: Load when building a new Cognigy demo package end-to-end, creating a demo for a prospect, or running the /create-demo workflow. Covers research, spec, build, validate, deliver.
user-invocable: false
dependencies: [prospect-research, tool-design, instruction-patterns, voice-config, package-builder]
source-files: [build-office-depot.js]
---

# Demo Builder — End-to-End Process

## NEVER
- Never use the old `buildPackage()` / `writePackageZip()` API — it produces broken packages.
- Never start building without understanding the prospect's actual terminology and workflow.
- Never create more than 8 tools — the LLM gets confused with too many choices.
- Never create tools that overlap in purpose — the LLM won't know which to call.
- Never skip the validation step — import failures waste the user's time.
- Never use generic placeholder data — make mock data feel real (real addresses, realistic order numbers, plausible dollar amounts).
- Never give the agent medical, legal, financial, or insurance advice capabilities — always escalate.

## ALWAYS
- Always research the prospect's real products, terminology, and customer workflows.
- Always have `authenticate` as tool #1 and `agent_handover` as the last tool.
- Always use "Adam Boyle" as the demo persona (the user's testing identity).
- Always include the standard ALWAYS/NEVER/Confirmation voice rules from the `instruction-patterns` skill in every demo's #RULES section.
- Always use the clone-and-modify approach with `credit-card-analysis/` as source.
- Always make the greeting specific: "Thank you for calling [Company]! This is Jane..."
- Always include a FAQ/knowledge code node — agents with knowledge give dramatically better demos.

## Process

### 1. Research the Prospect
Gather before building:
- Company name, industry, and what they sell/do
- The real customer support scenarios they handle
- Their actual terminology (e.g., "illustration" in insurance, not "quote")
- Current IVR/phone tree structure (what are we replacing?)
- Tone and culture (formal bank vs. casual retail)

### 2. Design the Tool Set
Pick 4-7 tools following this pattern:
```
1. authenticate         — Always first, verify identity
2-6. [domain tools]     — The core scenarios
7. agent_handover       — Always last, human escalation
```

**Good tool sets by industry:**
- **Retail**: authenticate, order_status, store_locator, rewards_inquiry, returns, agent_handover
- **Healthcare**: authenticate, appointment_scheduling, provider_search, prescription_refill, agent_handover
- **Finance**: authenticate, account_inquiry, claims_status, payments, agent_handover
- **Telecom**: authenticate, account_inquiry, billing, troubleshoot, plan_changes, agent_handover
- **IT Helpdesk**: verify_employee, password_reset, ticket_create, ticket_status, agent_handover

### 3. Write the Spec
Create a build script following `build-office-depot.js` as the reference. The spec needs:

**instructionsCode** (the main prompt):
```
#INTRO        — Who you are (Jane), exact greeting script
#RULES        — Standard ALWAYS/NEVER/Confirmation rules (from instruction-patterns skill) + demo-specific rules
#TOOL ORDER   — Numbered tool list with when to use each
#DOMAIN RULES — Industry-specific constraints
```
**CRITICAL**: Load the `instruction-patterns` skill and copy the standard voice rules verbatim into #RULES. These are mandatory for every demo.

**knowledgeCode** (FAQ content):
- 3-5 topic sections as Q&A or reference material
- Covers the most likely questions for this industry
- Used by the AI Agent via `{{context.knowledge}}`

**Mock data** (in authenticate tool's code):
- Use "Adam Boyle" persona with realistic account details
- Include 2-3 recent orders/cases/appointments
- Make addresses, phone numbers, and IDs plausible

### 4. Build
```bash
node build-[company].js
```

### 5. Validate
```bash
# No directory entries in ZIP (no size-0 lines)
unzip -l ./Output.zip | grep "^        0"
# Should return nothing
```

### 6. Deliver
Tell the user:
- Package file location
- Flow name and tool count
- Post-import steps: set LLM provider, set TTS voice (agent name is already Jane)
- Import path: Cognigy.AI → Build → Packages → Import

## Proven Patterns from Past Demos

### Instructions structure that works
```
context.instructions = `
#INTRO
You are Jane, the friendly AI assistant for [Company].
When the conversation starts, greet the caller warmly: "Thank you for calling [Company]!..."

#RULES
## Conversation & Tool Guidelines

[PASTE STANDARD ALWAYS/NEVER/CONFIRMATION RULES FROM instruction-patterns SKILL HERE]

[Then add demo-specific rules below:]

#TOOL ORDER
1. authenticate -- Always verify first
2. [tool_id] -- [When to use]
...
N. agent_handover -- Transfer when needed

#[COMPANY] SPECIFIC RULES
- [Industry/company-specific constraints]
`;
```
**NOTE**: The example above is abbreviated. The full standard ALWAYS/NEVER/Confirmation rules are in the `instruction-patterns` skill — load it and copy them verbatim into #RULES for every demo.

### agentJobConfig.instructions pattern
```
"Refer to {{context.instructions}} for your behavior rules and tool order.\n\nRefer to {{context.knowledge}} for FAQs about services, rewards, and policies."
```

### context.script pattern (for tighter voice control)
Pair `context.instructions` with `context.script` containing verbatim example dialogue:
```
context.script = `
AGENT: Thanks for calling [Company]. What can I help you with?
CALLER: I need to check on an order.
AGENT: I'd be happy to help with that. Can I get your phone number to pull up your account?
...
`;
```
Then in agentJobConfig.instructions: `"Refer to {{context.script}} for example dialogue."`

## Naming Conventions
- **Flow**: `"CompanyName - AI Agent"` or `"CompanyName - Channel"`
- **Agent Job name**: Role title, not persona name (e.g., "Customer Support Specialist")
- **Tool IDs**: `snake_case` (e.g., `order_status`, `store_locator`)
- **Labels**: Title Case (e.g., "Order Status", "Store Locator")
- **Agent persona**: Always "Jane" (standard name for all demos)
