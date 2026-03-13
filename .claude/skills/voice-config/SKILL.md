---
name: voice-config
description: "Configure TTS/STT, pronunciation, silence overlay, barge-in, DTMF, no-input timeout, or SetSessionConfig values for voice demos. Use this skill whenever the task involves voice output, audio settings, anything spoken aloud by the agent, or phrases like 'it sounds weird' or 'the agent talks too fast' -- even if the user doesn't say 'voice config'."
user-invocable: false
dependencies: [node-reference]
source-files: [credit-card-analysis/nodeData/]
---

# Voice Configuration

## NEVER
- Never use em dashes (the long dash character) in agent instructions or answers -- TTS reads them as "dash" or pauses awkwardly. Use commas or short sentences instead.
- Never use markdown, bullet points, or numbered lists in voice output -- TTS reads the formatting characters aloud ("asterisk", "hash", "dash").
- Never use emojis in any voice-facing content -- TTS either skips them or reads their Unicode names.
- Never spell out URLs -- say "I can send you a text with that link" instead, because TTS mangles URLs into gibberish.
- Never give more than 3 sentences in a single voice response -- callers lose track after 3 sentences and stop listening.
- Never ask more than one question per turn -- callers can only answer one thing at a time, and multi-question turns confuse STT.
- Never set `bargeIn: true` unless the demo specifically requires it -- it causes false triggers where background noise or the agent's own audio cuts off the response.
- Never use `sttModel: "default"` -- always specify the exact model (e.g., `nova-3`), because "default" maps to an older, less accurate model.

## ALWAYS
- Always use the proven voice stack: Deepgram Nova-3 STT + ElevenLabs eleven_multilingual_v2 TTS -- this combination has been tested across all 13 demos and consistently produces the best quality.
- Always set `endpointing: 250` (milliseconds of silence before STT finalizes) -- lower values cut off callers mid-sentence, higher values add noticeable lag.
- Always set `userNoInputTimeout: 10000` (10 seconds before no-input event) -- shorter timeouts trigger while callers are still thinking.
- Always say numbers digit by digit for order/reference numbers: "Order 1-2-3-4-5-6" -- grouping digits prevents TTS from reading them as large numbers.
- Always say dollar amounts naturally: "twelve dollars and ninety-nine cents" -- TTS mangles "$12.99" into inconsistent readings.
- Always say phone numbers in groups: "area code 8-4-8, 4-6-6, 8-8-2-5" -- this matches how people naturally say and hear phone numbers.
- Always include company-specific pronunciation guidance in instructions (company name, product names, etc.) -- TTS often mispronounces brand names without explicit guidance.
- Always use `silenceOverlayAction: true` with a subtle keyboard/typing sound URL to fill processing gaps -- dead silence makes callers think the call dropped.

## SetSessionConfig Reference (68 keys in production)

The setSessionConfig node is cloned from the source template with all 68 keys intact. Key values:

```
STT:  deepgramflux / en-US / nova-3
TTS:  elevenlabs / eleven_multilingual_v2 / en
      ttsVoice: "iNwc1Lv2YQLywnCvjfn1" (or set in Cognigy after import)

Endpointing: deepgramEndpointing=true, deepgramEndpointingValue=250
No-input:    userNoInputTimeoutEnable=true, userNoInputTimeout=10000
DTMF:        dtmfEnable=false (speech-only demos)
Silence:     silenceOverlayAction=true, silenceOverlayDelay=2
             silenceOverlayURL="https://eyal-aws-bucket.s3.amazonaws.com/public/computer_keyboard_pr.mp3"
```

## Pronunciation Rules

The standard ALWAYS rules in `instruction-patterns` already cover general pronunciation (dates, dollars, addresses, emails, times, special characters). Use the `#[COMPANY] SPECIFIC RULES` section for company-specific pronunciation only:

```
#[COMPANY] SPECIFIC RULES
- Say "[CompanyName]" as "[phonetic pronunciation]".
- [Product name] is pronounced "[phonetic]".
- Use a [warm/professional/calm] tone.
```

## AI Agent Streaming Config (in aiAgentJob node)

These settings control how the AI Agent streams voice output:

```
storeLocation: "stream"          # Stream tokens as they arrive
outputImmediately: true          # Start TTS before full response is ready
streamStopTokens: [".", "!", "?", "\n"]   # Flush at sentence boundaries
```

This makes voice responses feel natural -- the agent starts speaking as soon as the first sentence is ready, rather than waiting for the entire LLM response.

## Post-Import Voice Setup

After importing a package, the user needs to:
1. **Set TTS voice** -- the `ttsVoice` ID in setSessionConfig (ElevenLabs voice ID)
2. **Set LLM provider** -- the `llmProviderReferenceId` in the AI Agent Job config
3. **Verify AI Agent name** -- should already be "Jane" (standard for all demos)

## What Breaks in Voice Demos

### Agent speaks too fast/robotic
**Cause**: `streamStopTokens` not set, or `outputImmediately: false`.
**Fix**: Ensure streaming config is correct (clone-and-modify preserves this).

### Long silence before agent responds
**Cause**: Processing delay with no silence overlay.
**Fix**: Enable `silenceOverlayAction` with a subtle sound URL.

### Agent cuts off the caller
**Cause**: `bargeIn` enabled, endpointing too low.
**Fix**: Disable `bargeIn`, set endpointing to 250ms.

### Agent keeps saying "I didn't catch that"
**Cause**: `userNoInputTimeout` too short.
**Fix**: Set to 10000ms (10 seconds).

### TTS says "dash" or reads formatting
**Cause**: Instructions or tool answers contain em dashes, markdown, or special characters.
**Fix**: Strip all formatting. Use only plain text with commas and periods.
