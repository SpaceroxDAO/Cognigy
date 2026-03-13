---
name: demo-builder
description: "Build a Cognigy demo package end-to-end: research, spec, build, validate, deliver. Use this whenever the user wants to create a demo for a prospect, says 'build a demo', 'create a package', runs /create-demo, or names a company and implies they need a working demo -- even if they skip saying 'end-to-end'."
user-invocable: false
dependencies: [prospect-research, tool-design, instruction-patterns, voice-config, package-builder]
source-files: [build-office-depot.js]
---

# Demo Builder -- End-to-End Process

## NEVER
- Never use the old `buildPackage()` / `writePackageZip()` API -- it produces packages that fail import because it doesn't generate required fields like `mock` and `transpiled`.
- Never start building without understanding the prospect's actual terminology and workflow -- generic demos don't impress prospects and get details wrong.
- Never create more than 7 tools -- the LLM gets confused with too many choices and starts calling the wrong one or skipping tools entirely.
- Never skip the validation step -- import failures waste the user's time and require a rebuild.
- Never use generic placeholder data -- make mock data feel real (real addresses, realistic order numbers, plausible dollar amounts) because prospects notice fake-looking data immediately.
- Never give the agent medical, legal, financial, or insurance advice capabilities -- always escalate, because even in a demo, prospects will test these boundaries and a wrong answer kills credibility.

## ALWAYS
- Always research the prospect's real products, terminology, and customer workflows -- the demo must speak their language to land.
- Always use "Adam Boyle" as the demo persona (the user's testing identity) -- this keeps all demos consistent and testable.
- Always include the standard ALWAYS/NEVER/Confirmation voice rules from the `instruction-patterns` skill in every demo's #RULES section -- these are non-negotiable for voice quality.
- Always use the clone-and-modify approach with `credit-card-analysis/` as source -- building from scratch misses dozens of hidden required fields.
- Always make the greeting specific: "Thank you for calling [Company]! This is Jane..." -- generic greetings feel like a template, not a custom demo.
- Always include a FAQ/knowledge code node -- agents with knowledge give dramatically better demos because they can answer follow-up questions without hallucinating.
- For tool ordering rules (authenticate first, agent_handover last), see `tool-design` skill for full tool design patterns.

## Process

### 1. Research the Prospect
Gather before building:
- Company name, industry, and what they sell/do
- The real customer support scenarios they handle
- Their actual terminology (e.g., "illustration" in insurance, not "quote")
- Current IVR/phone tree structure (what are we replacing?)
- Tone and culture (formal bank vs. casual retail)

**Then run the Web Research & Scraping protocol** from the `prospect-research` skill:
- Auto-discover FAQ, support, policy, and product pages via WebSearch
- Scrape real content from each discovered URL via WebFetch
- Compile the Scraped Knowledge Summary
- **Checkpoint**: Present the Scraped Knowledge Summary to Adam for review before proceeding to Phase 2 (Tool Design)

### 2. Design the Tool Set
Pick 4-7 tools following this pattern:
```
1. authenticate         -- Always first, verify identity
2-6. [domain tools]     -- The core scenarios
7. agent_handover       -- Always last, human escalation
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
#INTRO        -- Who you are (Jane), exact greeting script
#RULES        -- Standard ALWAYS/NEVER/Confirmation rules (from instruction-patterns skill) + demo-specific rules
#TOOL ORDER   -- Numbered tool list with when to use each
#DOMAIN RULES -- Industry-specific constraints
```
**CRITICAL**: Load the `instruction-patterns` skill and copy the standard voice rules verbatim from `instruction-patterns/references/standard-voice-rules.md` into #RULES. These are mandatory for every demo.

**knowledgeCode** (FAQ content):
- Use scraped content from the Scraped Knowledge Summary as the primary source
- Organize into 3-5 sections matching the demo's tool set
- Preserve real details: actual policy timeframes, real product names, actual hours
- Only fabricate data for things that MUST be demo-specific (account numbers, order IDs)
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

[PASTE STANDARD ALWAYS/NEVER/CONFIRMATION RULES FROM instruction-patterns/references/standard-voice-rules.md]

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
**NOTE**: The example above is abbreviated. The full standard ALWAYS/NEVER/Confirmation rules are in `instruction-patterns/references/standard-voice-rules.md` -- load it and copy them verbatim into #RULES for every demo.

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
