---
name: demo-review
description: Load when reviewing a demo transcript or session logs, QA testing a demo, analyzing agent behavior, or identifying issues to fix before delivery.
user-invocable: false
dependencies: [tool-design, instruction-patterns]
---

# Demo Review — Structured QA from Transcripts & Logs

## How to Review

The user will paste either:
- **Transcript**: The interaction panel showing agent/user messages and tool calls
- **Session logs**: Raw Cognigy logs with timestamps, traceIds, flowIds, and message payloads

Both contain the same conversation — logs have more technical detail (streaming chunks, tool_calls finishReason, sessionConfig payloads). Use whichever is provided.

## Review Checklist

Run through every section below for each review. Report findings as a table with Pass/Fail/Note per item.

### 1. Tool Resolution (did data come through?)

For every tool call in the transcript:
- Did the answer contain real data, or did the AI say "didn't load correctly" / "isn't available" / "let me connect you to someone"?
- If the AI offered to transfer instead of answering, the tool answer likely resolved to empty strings
- Check: was there a `_finishReason: "tool_calls"` followed by actual data in the next message?

**Common failure**: Answer template uses array access (`{{context.list.0.field}}`) or nested paths that resolve to empty. Fix: flatten to `context.xxxResult` string in code node.

### 2. Data Accuracy (is the data correct?)

For each tool that returned data:
- Do the values match what's in the build script's mock data?
- Are dollar amounts, dates, order numbers, and addresses correct?
- Did the AI invent data that wasn't in the mock? (hallucination)
- Did the AI omit data that WAS in the mock?

### 3. Conversation Flow (natural and efficient?)

- **Greeting**: Does it match the #INTRO script exactly?
- **Authentication**: Was auth requested before account-specific tools?
- **One question per turn**: Did the agent ever ask 2+ questions in one response?
- **Response length**: Are responses 1-3 sentences? (Voice demos must be concise)
- **Topic switching**: Did the agent handle topic changes smoothly without losing context?
- **Follow-ups**: When the user said "yes please" or asked for more detail, did the agent use existing context or re-call the tool?
- **Closing**: Was there a natural wrap-up with "anything else?" and a warm goodbye?

### 4. Tool Behavior (correct tool usage?)

- Did the AI call the right tool for each request?
- Did the AI collect ALL required parameters before calling? (Check `required` array in the spec)
- Did the AI ever call a tool unnecessarily (e.g., re-authenticating)?
- Did the AI ever skip a tool and answer from its own knowledge when it should have called a tool?
- Were there any tool calls with `_finishReason: "tool_calls"` that didn't produce a visible response? (indicates tool call but the answer was empty/broken)

### 5. Voice Readiness (would this sound good spoken?)

- No markdown, bullets, numbered lists, or special characters in responses
- Numbers spelled appropriately: "5-6-4-3-5-6-3" not "5643563", "$47.82" not "$47.82000"
- Phone numbers in groups: "8-4-8, 4-6-6, 8-8-2-5"
- Addresses read clearly with natural pauses
- No URLs spoken aloud (offer to text/email instead)
- Responses use conversational fillers: "sure thing", "absolutely", "let me check"
- No robotic phrasing like "I have retrieved the following information"

### 6. Edge Cases & Guardrails

- Did the AI ever disclose it's an AI or mention its tools/system prompts?
- Did the AI make up information not in the mock data?
- If the user gave incomplete/messy input, did the agent handle it gracefully?
- Did the agent offer handover when appropriate (frustration, out-of-scope, repeated failures)?
- Did the agent correctly refuse to do things outside its scope?

## Output Format

Structure your review as:

```
## Demo Review: [Demo Name] — [Date]

### Summary
[1-2 sentence overall assessment]

### Tool Results
| Tool | Called | Data Resolved | Accurate | Notes |
|---|---|---|---|---|
| authenticate | Yes | Yes | Yes | Recognized Adam, used first name |
| order_status | Yes | Yes | Yes | Both orders shown with correct dates |
| ... | ... | ... | ... | ... |

### Issues Found
1. **[Severity: Critical/Medium/Minor]** — [Description of issue]
   - **What happened**: [exact quote from transcript]
   - **Expected**: [what should have happened]
   - **Fix**: [what to change in the build script]

### Passing Highlights
- [Things that worked well worth noting]

### Verdict
[Ready for delivery / Needs fixes / Needs rebuild]
```

## Severity Guide

- **Critical**: Tool returns empty data, AI hallucinates answers, greeting is wrong, auth bypassed — blocks delivery
- **Medium**: AI asks 2 questions in one turn, response too long for voice, missed a follow-up opportunity — should fix before demo
- **Minor**: Slightly awkward phrasing, could use better filler words, minor pronunciation concern — nice to fix

## What to Check in Logs vs Transcript

**Logs show things transcripts don't:**
- `_finishReason: "tool_calls"` — confirms a tool was actually called (not just the AI saying it did something)
- `_finishReason: "stop"` — normal text response, no tool call
- Streaming chunks — you can see the exact text pieces the AI generated in sequence
- `voiceGateway2Config` — confirms TTS/STT settings are correct (vendor, model, voice ID, endpointing)
- `sessionId` — confirms all messages are from the same session
- Timing — gaps between messages show response latency

**Red flags in logs:**
- Multiple `tool_calls` in a row without a text response between them — tool chain may be broken
- Very long text in a single message chunk — response too verbose for voice
- `text: null` with only `data` — session config, not a spoken response (expected at start)
- Missing `tool_calls` finishReason when the transcript shows "AI Agent: Tool Call" — possible mismatch

## Lessons from Past Reviews

### Office Depot v1 (all tools broken)
- **Root cause**: Answer templates used `{{context.customer.recentOrders.0.orderId}}` — array index access doesn't resolve in Cognigy
- **Symptom**: AI said "details didn't load correctly" and offered to transfer for EVERY tool
- **Fix**: Flatten all data into `context.xxxResult` strings in code nodes, answer is just `{{context.xxxResult}}`

### Office Depot v1 (returns skipped item description)
- **Root cause**: `required: ["reason"]` didn't include `item_description`, so AI called tool after getting just the reason
- **Symptom**: "Your return has been initiated" without ever asking what the item was
- **Fix**: Added `item_description` to `required` array AND added "You MUST collect..." to tool description

### Office Depot v2 (all tools working)
- Every tool had code that flattened to `context.xxxResult`
- Returns tool persisted through 3 turns collecting all required fields
- Print services proactively surfaced pending order
- Voice formatting correct throughout (digit-by-digit numbers, natural dollar amounts)
