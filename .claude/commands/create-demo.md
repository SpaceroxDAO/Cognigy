---
name: create-demo
description: Create a Cognigy AI Agent demo package from prospect context
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch
---

# Create Demo Package

You are building a Cognigy.AI demo package for a prospect using the **clone-and-modify** approach.

## Step 1: Gather Context
Ask the user for (if not already provided):
- **Company name** and industry
- **Use case** (customer support, intake, sales, IT helpdesk, etc.)
- **Agent persona name** and personality traits
- **Tools needed** (authentication, account lookup, scheduling, payments, escalation, etc.)
- **Channel** (voice, webchat, or both)
- **Any domain-specific rules** (compliance, terminology, etc.)

## Step 2: Research (if needed)
If the user provides a company website, use WebFetch to gather:
- Company description and branding tone
- Products/services offered
- Common customer support scenarios
- Industry-specific terminology

## Step 3: Write the Build Script
Create a build script (e.g., `build-[company].js`) using `clone-and-modify.js`.
Use `build-office-depot.js` as a reference for the spec format.

```javascript
const { cloneAndModify } = require("./cognigy-package-generator/clone-and-modify");

const spec = {
  flowName: "Company - AI Agent",
  description: "...",
  instructionsCode: 'context.instructions = `...`;',   // #INTRO, #RULES, #TOOL ORDER, #VOICE
  knowledgeCode: 'context.knowledge = `...`;',          // FAQ content
  agentJobConfig: { name: "...", description: "...", instructions: "..." },
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
- Post-import steps: rename AI Agent, set LLM provider, configure TTS voice
