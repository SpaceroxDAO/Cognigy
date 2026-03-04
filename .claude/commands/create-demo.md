---
name: create-demo
description: Create a Cognigy AI Agent demo package from prospect context
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch
---

# Create Demo Package

You are building a Cognigy.AI demo package for a prospect using the **clone-and-modify** approach.

**BEFORE YOU START**: Load the following skills by reading them (they contain mandatory templates and rules):
1. `instruction-patterns` — Standard voice rules (ALWAYS/NEVER/Confirmation) that MUST be in every demo
2. `tool-design` — Tool schemas, mock code patterns, answer patterns
3. `package-builder` — cloneAndModify() usage, spec format, validation
4. `voice-config` — TTS/STT settings, pronunciation rules

## Step 1: Gather Context
Ask the user for (if not already provided):
- **Company name** and industry
- **Use case** (customer support, intake, sales, IT helpdesk, etc.)
- **Channel** (voice, webchat, or both)
- **Tools needed** (authentication, account lookup, scheduling, payments, escalation, etc.)
- **Any domain-specific rules** (compliance, terminology, etc.)

Note: The agent persona name is always **Jane** (standard for all demos).

## Step 2: Research (if needed)
If the user provides a company website, use WebFetch to gather:
- Company description and branding tone
- Products/services offered
- Common customer support scenarios
- Industry-specific terminology

## Step 3: Write the Build Script
Create a build script (e.g., `build-[company].js`) using `clone-and-modify.js`.

**CRITICAL**: The `instructionsCode` MUST include the standard ALWAYS/NEVER/Confirmation rules from the `instruction-patterns` skill. These are mandatory for every demo — copy them verbatim, then add demo-specific rules after.

```javascript
const { cloneAndModify } = require("./cognigy-package-generator/clone-and-modify");

const spec = {
  flowName: "Company - AI Agent",
  description: "...",
  instructionsCode: 'context.instructions = `\n#INTRO\nYou are Jane, the friendly AI assistant for [Company].\n...\n#RULES\n[Standard ALWAYS/NEVER/Confirmation rules from instruction-patterns skill]\n[Demo-specific rules]\n#TOOL ORDER\n...\n`;',
  knowledgeCode: 'context.knowledge = `...`;',
  agentJobConfig: { name: "...", description: "...", instructions: "Refer to {{context.instructions}} for your behavior rules and tool order.\n\nRefer to {{context.knowledge}} for FAQs." },
  tools: [
    { toolId: "authenticate", label: "Authenticate", description: "...",
      parameters: {...}, code: "// mock auth", answer: "..." },
    // ... more tools
    { toolId: "agent_handover", label: "Transfer to Agent", description: "...",
      parameters: {...}, code: "", answer: "Transferring you now." },
  ]
};

cloneAndModify("./credit-card-analysis", spec, "./Company-Demo.zip");
```

## Step 4: Build and Validate
```bash
node build-[company].js
unzip -l ./Company-Demo.zip | head -5   # Verify NO directory entries (no size-0 lines)
```

## Step 5: Summarize
Tell the user:
- Package location
- Flow name and structure
- Tools included (count and names)
- How to import: Cognigy.AI → Build → Packages → Import
- Post-import steps: set LLM provider, configure TTS voice (agent name is already Jane)
