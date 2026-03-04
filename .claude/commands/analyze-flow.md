---
name: analyze-flow
description: Analyze an existing Cognigy flow from the reference package for learning/reference
allowed-tools: Read, Glob, Grep, Bash
---

# Analyze Flow

Analyze a flow from the user's reference package at `package-analysis/`.

## Usage
The user will specify a flow name or keyword. Search for it:

1. **Find the flow**: `grep` for the name in `package-analysis/flow/` files
2. **Read the chart**: Use the flow's `chartReference` to read the chart from `package-analysis/chart/`
3. **Trace the nodes**: Read each nodeData file referenced in the chart relations
4. **Report**: Summarize the flow structure, node types, tools, instructions, and patterns

## Output Format
```
Flow: [Name]
Nodes: [count]
Pattern: [A/B/C/D/E]
Structure:
  Start → [node sequence] → End
Tools: [list with descriptions]
Instructions: [summary of prompt sections]
Voice Config: [STT/TTS settings if present]
Key Patterns: [notable techniques used]
```
