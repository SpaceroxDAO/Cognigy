# Cognigy AI Agent Demo Package - Complete Analysis

## Package Overview
- **Source**: AB Lab project (Package-AB Lab_2026-03-04_00-08-21.zip)
- **Size**: 77MB, 3,108 files
- **Cognigy Version**: 2026.4.0
- **Locale**: en-US

## Resource Inventory
| Resource Type | Count |
|---|---|
| Flows | 83 |
| Charts | 83 |
| Node Data | 2,498 |
| AI Agents | 35 |
| LLM Models | 12 |
| Knowledge Stores | 7 |
| Knowledge Sources | 13 |
| Knowledge Chunks | 75 |
| Connections | 39 |
| Endpoints | 10 |
| Flow Settings | 83 |
| Flow States | 83 |

---

## Flow Categorization

### AI Agent Flows (23)
Named with "AI Agent" suffix: Amy, Anne, Atom, Ben, Clara, Cognigy Coach, Cora, Elena, Exelon, Fashion-Velora, Finance Agent, Flight Service Rep, Greg, Jane, Jess, Lex, Max, Sam, Sarah, Test, VoiceIVR, test

### Client/Demo Flows (52)
Real prospect demos across industries:
- **Healthcare**: Advanced Dermatology, AnswersNow, Eye South Partners, Kaiser, Lincare, Pediatric Associates, Teledoc, University Orthopedics
- **Finance/Insurance**: Allianz Life, Capital One, FIS Payment, National Debt Relief, NationsBenefits, CogniFinance
- **Automotive**: Cox Automotive, Valvoline (3 versions)
- **Telecom**: Telecom Payment
- **Retail**: RadioShack, Supermarket, Fashion-Velora
- **Travel/Hospitality**: HGV (2 flows), Booking Assist, Flight Service Rep
- **IT/Tech**: Simplisafe, UKG Demo, Philips POV, NQX (2 flows)
- **Education**: York University
- **Legal**: Morgan & Morgan Social Security Intake
- **Real Estate**: Luxer One, RedSpeed (2 flows)

### Utility Flows (8)
demo_flow, end_conversation, escalateToAgent, test, DTMF, Outbound Start, Memory, Reset-Mavis

---

## Node Type Distribution (2,498 total nodes)

### Most Used Node Types
| Node Type | Count | Purpose |
|---|---|---|
| aiAgentJobTool | 326 | Tool definitions for AI agents |
| aiAgentToolAnswer | 300 | Resolve Tool Action nodes |
| code | 229 | JavaScript code execution |
| say | 183 | Text/rich media output |
| sleep | 117 | Delays |
| wait | 107 | Wait for user input |
| once/onFirstExecution/afterwards | 91 each | One-time execution patterns |
| start/end | 83 each | Flow start/end markers |
| aiAgentJob | 80 | AI Agent parent nodes |
| setSessionConfig | 71 | Voice session configuration |
| sendSMS | 60 | SMS sending |
| addToContext | 56 | Context variable storage |
| setHTMLAppState/initAppSession | 39 each | xApp HTML widgets |
| hangup | 28 | Call termination |
| if/then/else | 23 each | Conditional branching |
| llmPromptTool | 20 | LLM prompt tools |
| createCase/onSuccess/onError | 18 each | Case management |
| aiAgentHandover | 16 | AI Agent-to-Agent transfer |
| transfer | 14 | Call transfer |
| httpRequest | 8 | External API calls |
| goTo | 6 | Flow navigation |

---

## AI Agent Configuration (35 Named Agents)

### Agent Names
Alana, Alice, Allie, Amy, Anne, Atom, Avery, Becky, Clara, Cognigy Coach, Cora, Elena, Elle, Finance Agent, Flight Service Rep, Grace, Greg, Jane, Jess, Jessica, Kate (x3), Luxi, Max, Ria, Sam, Sarah, Sophia, Sora, Susan, Taya, Test, Velora, test

### AI Agent Configuration Pattern
Each AI Agent has:
- **Name** (persona name like "Luxi", "Sophia", "Ria")
- **Avatar image** (custom designed, stored as base64 PNG)
- **Referenced in flows via referenceId** (UUID)

---

## LLM Models Used (12)
| Model Name | Provider |
|---|---|
| Azure GPT-4o | Azure OpenAI |
| Azure GPT 4.1 | Azure OpenAI |
| Azure GPT 4.1 Mini | Azure OpenAI |
| Azure GPT 4.1 Nano | Azure OpenAI |
| ChatGPT 5.1 Chat | Azure OpenAI |
| GPT-5-chat | OpenAI |
| GPT-5-chat (2), (3) | Azure OpenAI |
| Gemini Flash (Quota Test) | Google Gemini |
| text-embedding-3-large | Azure OpenAI |
| text-embedding-3-small | Azure OpenAI |
| text-embedding-ada-002 | Azure OpenAI |

---

## Core Flow Architecture Pattern

### Typical AI Agent Demo Flow Structure

```
Start
  └─> Once (onFirstExecution)
       └─> Code Node: "Instructions" (sets context.instructions with detailed system prompt)
       └─> Code Node: "Auth" (sets context with mock customer data)
       └─> Code Node: "Knowledge" (sets context with FAQ/knowledge base content)
  └─> If / Lookup (conditional logic)
  └─> Set Session Config (voice settings for voice demos)
  └─> AI Agent Job Node (parent)
       ├── Default (fallback branch)
       ├── Tool: authenticate (verify customer identity)
       ├── Tool: account_inquiry (lookup account info)
       ├── Tool: appointment (schedule/manage appointments)
       ├── Tool: payment (process payments)
       ├── Tool: agent_handover (transfer to live agent)
       ├── Tool: [domain-specific tools]
       └── Each Tool Branch:
            └─> Code Node (mock API response / business logic)
            └─> Resolve Tool Action (return result to AI Agent)
  └─> End
```

### Key Pattern: Instructions via Code Node
Instructions are stored in `context.instructions` using a Code node that runs before the AI Agent. This allows complex, multi-section prompts:

```javascript
context.instructions = `
#INTRO
[Introduction instructions]

#RULES
## Conversation & Tool Guidelines

**ALWAYS**
- [Always do this...]

**NEVER**
- [Never do this...]

#[DOMAIN-SPECIFIC SECTIONS]
- [Additional domain rules]
`;
```

### Key Pattern: Mock Data via Code Nodes
Demo data is set up in Code nodes:

```javascript
context.knowledge = `[FAQ content, product info, policies]`;
context.customerData = { name: "...", account: "...", ... };
```

---

## Tool Configuration Patterns

### Common Tool Categories
1. **Authentication** - verify customer identity (account #, zip, OTP, broker code)
2. **Account Inquiry** - lookup balances, profile info, Flex Card balances
3. **Appointment Scheduling** - check availability, book/reschedule
4. **Payment Processing** - balances, payments, refunds, payment plans
5. **Live Agent Handover** - escalate to human agent
6. **Case/Claims Management** - lookup, create, update cases
7. **Inventory/Pricing** - stock checks, price lookups
8. **Store Locator** - find nearby locations
9. **SMS/Messaging** - send text messages, xApp links
10. **Domain-Specific** - prescriptions, insurance, credit card activation, etc.

### Tool Node JSON Structure
```json
{
  "_id": "...",
  "type": "aiAgentJobTool",
  "extension": "@cognigy/basic-nodes",
  "label": "Tool Name",
  "localizedData": [{
    "config": {
      "toolId": "snake_case_id",
      "description": "Detailed description of what this tool does and when to use it.",
      "useParameters": true,
      "parameters": "{ JSON Schema }",
      "debugMessage": true,
      "condition": ""
    }
  }]
}
```

### Tool Parameter JSON Schema Pattern
```json
{
  "type": "object",
  "properties": {
    "action": { "type": "string", "enum": ["get", "update"], "description": "Operation to run." },
    "param_name": { "type": "string", "description": "What this param is for." }
  },
  "required": ["action"],
  "additionalProperties": false
}
```

---

## Valvoline Care Specialist v3 (Webchat) - Deep Dive

### Flow Structure (60+ nodes)
- Start → Once → Code(Auth) → Code(Instructions) → Code(Knowledge)
- → Set Session Config (x4) → AI Agent Job → End
- AI Agent has 10 tool branches: Default, Store Locator, Cases & Claims, Inventory, Pricing, Invoices, Payments & Refunds, Transfer to Agent, + 2 generic tools
- Each tool branch → Code Node (mock business logic) → Resolve Tool Action
- Some tools → If conditions → Additional processing
- xApp: Init Session + xApp: Show HTML for rich web experiences
- SMS sending for appointment links, payment links

### Instruction Prompt Structure (Valvoline)
Sections: #INTRO, #RULES with **ALWAYS** and **NEVER** subsections
Key instruction patterns:
- "Pretend to be an expert in your area"
- "Ask no more than one question per turn"
- "Use natural fillers (um, uh, well, let's see)"
- "Use transitional phrases (first, next, lastly)"
- "Use plain text responses only"
- "Acknowledge out-of-scope questions softly"
- "Use empathy and acknowledge user's responses"
- "Never disclose internal tools or processes"
- "Never ask for info already provided"
- Domain-specific rules (no appointments for Valvoline drive-thru, no direct store numbers)

---

## AI Agent Job Node Configuration Pattern

### Key Fields
```json
{
  "type": "aiAgentJob",
  "config": {
    "aiAgent": "UUID-of-ai-agent",
    "name": "Customer Support Specialist",
    "description": "Job description and responsibilities",
    "instructions": "Additional instructions",
    "toolChoice": "auto",
    "memoryType": "inherit",
    "memoryContextInjection": "[[snippet for short-term memory]]",
    "knowledgeSearchBehavior": "onDemand",
    "knowledgeSearchTopK": 3,
    "knowledgeSearchGenerateSearchPrompt": true,
    "storeLocation": "stream",
    "outputImmediately": true,
    "streamStopTokens": [".", "!", "?", "\\n"],
    "temperature": 0.7,
    "maxTokens": 4000,
    "timeoutInMs": 8000,
    "processImages": false,
    "errorHandling": "continue",
    "debugConfig": true
  }
}
```

### Common AI Agent Job Names
- "Customer Support Specialist"
- "Insurance Specialist"
- "Healthcare Coordinator"
- "Financial Advisor"
- "Technical Support Agent"

---

## Voice Configuration Pattern

### Set Session Config Nodes
- 71 total across all flows
- Used to configure TTS (Text-to-Speech) and STT (Speech-to-Text) settings
- Typically placed before AI Agent node
- Multiple configs for different conversation phases

---

## Package File Structure (for creating new packages)

```
package.zip/
├── index.json                    # Package metadata
├── locale/{id}                   # Locale definitions
├── flow/{id}                     # Flow definitions (metadata)
├── chart/{id}                    # Chart definitions (node relations)
├── nodeData/{id}                 # Individual node configurations
├── flowState/{id}                # Flow state (intent blacklists)
├── flowSettings/{id}             # Flow settings
├── intentTrainGroup/{id}         # Intent training groups
├── aiAgent/{id}                  # AI Agent configurations
├── largeLanguageModel/{id}       # LLM model references
├── knowledgeStore/{id}           # Knowledge store definitions
├── knowledgeSource/{id}          # Knowledge sources
├── knowledgeChunk/{id}           # Knowledge content chunks
├── connection/{id}               # API connections
├── endpoint/{id}                 # Endpoint configurations
├── goal/{id}                     # Goal definitions
└── playbook/{id}                 # Playbook definitions
```

---

## Key Observations for Replication

1. **Code Node is the Power Tool**: Used extensively for setting up context (instructions, mock data, knowledge), processing tool results, and complex business logic
2. **AI Agent is Central**: Nearly every demo flow centers on an AI Agent Job node with multiple tool branches
3. **Mock Data Pattern**: Demos use Code nodes to simulate API responses rather than making real API calls
4. **Instruction Prompts are Detailed**: Multi-section prompts with INTRO, RULES, ALWAYS/NEVER lists, domain-specific guidelines
5. **Tools are Well-Defined**: Each tool has a clear ID, description, and JSON Schema parameters
6. **Voice-First Design**: Heavy use of Set Session Config, natural language patterns, TTS-optimized responses
7. **xApp Integration**: HTML-based micro-apps for rich interactions (payment forms, scheduling)
8. **SMS as Channel**: Frequent use of SMS for sending links to xApps, confirmations
9. **Handover Pattern**: Always include an "agent handover" tool for escalation to live agent
10. **Short-Term Memory**: Uses context.shortTermMemory snippet for conversation continuity
11. **Demo Identity**: "Adam Boyle" is the default demo customer persona across multiple flows
12. **Once Pattern**: Use `once/onFirstExecution/afterwards` nodes to run setup code only on first turn
13. **CognigyScript in Tool Answers**: Rich templating with `{{context.*}}` and `{{#if}}` blocks for dynamic responses
14. **Streaming Output**: AI Agent set to `storeLocation: "stream"` with `outputImmediately: true` for real-time responses
15. **Multiple Set Session Configs**: Voice flows often have 2-4 Set Session Config nodes for different conversation phases

---

## Voice Configuration (Set Session Config)

### Standard Voice Stack
- **STT Vendor**: deepgramflux (Deepgram Nova-3)
- **STT Language**: en-US
- **TTS Vendor**: elevenlabs (ElevenLabs)
- **TTS Model**: eleven_multilingual_v2
- **TTS Language**: en
- **Endpointing**: Deepgram endpointing at 250ms
- **No-input timeout**: 10,000ms with 1 retry
- **End-of-turn threshold**: 0.9

---

## Resolve Tool Action Patterns
Tool results are returned via "answer" strings:
- **Simple**: "Caller is authenticated.", "Text has been sent."
- **CognigyScript**: `{{#if context.data}}...{{else}}...{{/if}}`
- **Instruction-style**: "IF disposition == RESOLVED: Say X."
- **Data injection**: `{{JSON.stringify(context.appointmentDetails)}}`

---

## Auth Code Node Pattern (Mock Authentication)
Uses `input?.payload || context?.lastToolPayload` for tool params, demo identity fallback to "Adam Boyle" (NB-0012345, DOB 1988-12-05, +1-848-466-8825).

---

## Instruction Prompt Patterns

### Common Sections
1. **#INTRO** - Word-for-word greeting
2. **#RULES** with ALWAYS/NEVER subsections
3. **#TOOL ORDER** - Strict tool calling sequence
4. **#DOMAIN-SPECIFIC RULES** - Industry overrides
5. **#VOICE & PRONUNCIATION** - TTS guidance
6. **#FLOW** - Demo conversation path

### Universal Rules (appear in most demos)
- "Ask no more than one question per turn"
- "Use natural fillers (um, uh, well, let's see)"
- "Use plain text, no markdown/formatting"
- "Never disclose internal tools or processes"
- "Escalate to human if frustration rises"

---

## Flow Architecture Patterns (5 Distinct Types)

### Pattern A: Simple AI Agent Flow (Most Common - ~50 flows)
```
Start → Once [SetSessionConfig] → AI Agent Job (Default + Tools) → End
```
Standard 7-node pattern. AI Agent Job handles everything.

### Pattern B: Multi-Job AI Agent Flow (Healthcare demos)
```
Start → Once [SetSessionConfig] → AI Agent Job 1 (greeting/triage) → AI Agent Job 2 (specialist search) → AI Agent Job 3 (scheduler) → End
```
Used by: Amy, Eye South Partners, University Orthopedics

### Pattern C: Scripted Voice Flow (Older pattern)
```
Start → SetSessionConfig → Say → Wait → Say → Wait → ... → CreateCase → HangUp
```
Linear Say/Wait chain for scripted conversations (HGV, Carnival)

### Pattern D: Context-Injected AI Agent Flow (Newest "template" pattern)
```
Start → Once [Code: load context.instructions + context.knowledge] → SetSessionConfig → AI Agent Job → End
```
Instructions/knowledge loaded as context variables. Most scalable. Used by: Cox, Luxer One, Valvoline, Kaiser, Capital One, Simplisafe, etc.

### Pattern E: Dispatcher/Multi-Flow Architecture
```
demo_flow (dispatcher) → AI Agent Handover → sub-flows (escalateToAgent, end_conversation, etc.)
```
RadioShack demo uses this shared architecture.

---

## AI Agent Persona Details (35 Agents)

### Speaking Style Distribution
- **balanced/concise**: ~22 agents (most common)
- **balanced/balanced**: ~8 agents
- **informal/concise**: 2 (Atom, Sam)
- **informal/balanced**: 2 (Grace, Jessica)
- **informal/comprehensive**: 1 (Cognigy Coach)
- **formal/concise**: 1 (Finance Agent)

### Standard AI Agent Instructions
Most agents include: `"- Only introduce yourself at the beginning of a conversation or when asked. - Ask a single follow-up question to keep the conversation going."`

### Safety Settings
All agents use all safety settings enabled (avoidHarmfulContent, avoidUngroundedContent, avoidCopyrightInfringements, preventJailbreakAndManipulation) except Jessica (all disabled).

---

## Voice Configuration Details

### TTS Vendors
1. **ElevenLabs** (most common): `eleven_multilingual_v2`, `eleven_turbo_v2_5`, `eleven_flash_v2_5`
2. **Deepgram**: `aura-luna-en`, `aura-2-thalia-en`, `aura-2-harmonia-en`, `aura-2-asteria-en`
3. **Microsoft**: `es-US-PalomaNeural` for Spanish

### STT Vendors
1. **Deepgram** (most common): `nova-3`, language `en-US` or `multi`
2. **Deepgram Flux** (`deepgramflux`): For HGV, Telecom, Simplisafe
3. **Google**: For Spanish (`es-US`)
4. **Microsoft**: For RadioShack (`es-CO`)

### Standard Settings
- Endpointing: 250ms (standard), 300ms (AnswersNow), 375ms (Valvoline), 450ms (Simplisafe)
- No-input timeout: 10000ms (standard), 20000ms (healthcare)
- DTMF: Disabled (except TPA Exchange)

---

## Integration Patterns

### Salesforce
- `createCase`: 18 nodes (UKG, SIS FAQ)
- `searchContact/entityRequest/salesforceQuery`: Contact/object lookup

### Twilio SMS
- `sendSMS`: 60 nodes (verification codes, Google Maps links, appointment confirmations)

### Hubspot
- `findEntity/createTicket/createContact/updateEntity`: CRM operations

### CXone (NICE)
- `handoverToCXone`: 9 nodes for live agent handoff

### xApp (Micro-Apps)
- `initAppSession + setHTMLAppState`: Rich HTML widgets (payment forms, scheduling, dashboards)

### MCP (Model Context Protocol)
- `aiAgentJobMCPTool`: Used in Atom personal assistant (email/calendar/tasks)

---

## Package Generator

### Location
`/Users/adamcognigy/Cognigy/cognigy-package-generator/`

### Usage
```javascript
const { buildPackage, writePackageZip } = require("./index");
const files = buildPackage(packageSpec);
writePackageZip(files, "/path/to/output.zip");
```

### Package Spec Format
```javascript
{
  name: "Package Name",
  aiAgent: { name, description, instructions, speakingStyle },
  flows: [{
    name: "Flow Name",
    agentName, agentDescription, agentInstructions,
    instructionsCode: "context.instructions = `...`",
    authCode: "// mock auth JS",
    knowledgeCode: "// knowledge setup JS",
    voiceConfig: { sttVendor, sttModel, ttsVendor, ttsVoice, ... },
    tools: [{
      label, toolId, description, useParameters, parameters,
      code: "// tool logic JS",  // optional
      answer: "Simple answer" | codeAnswer: "{{context.result}}"
    }]
  }]
}
```

### Validated Cross-References
All file names match `_id` fields, and all inter-resource references (flow↔chart, chart↔nodeData, flow↔locale, AI Agent Job↔AI Agent) are correctly wired.
