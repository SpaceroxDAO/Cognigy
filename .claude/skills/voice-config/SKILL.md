---
name: voice-config
description: Load when configuring TTS, STT, voice settings, pronunciation rules, silence overlay, barge-in, DTMF, no-input timeout, or SetSessionConfig node values.
user-invocable: false
---

# Voice Configuration

## NEVER
- Never use em dashes (—) in agent instructions or answers — TTS reads them as "dash" or pauses awkwardly.
- Never use markdown, bullet points, or numbered lists in voice output — TTS reads the formatting characters.
- Never use emojis in any voice-facing content.
- Never spell out URLs — say "I can send you a text with that link" instead.
- Never give more than 3 sentences in a single voice response — callers lose track.
- Never ask more than one question per turn.
- Never set `bargeIn: true` unless the demo specifically requires it — it causes false triggers.
- Never use `sttModel: "default"` — always specify the exact model (e.g., `nova-3`).

## ALWAYS
- Always use the proven voice stack: Deepgram Nova-3 STT + ElevenLabs eleven_multilingual_v2 TTS.
- Always set `endpointing: 250` (milliseconds of silence before STT finalizes).
- Always set `userNoInputTimeout: 10000` (10 seconds before no-input event).
- Always say numbers digit by digit for order/reference numbers: "Order 1-2-3-4-5-6."
- Always say dollar amounts naturally: "twelve dollars and ninety-nine cents."
- Always say phone numbers in groups: "area code 8-4-8, 4-6-6, 8-8-2-5."
- Always include a #VOICE & PRONUNCIATION section in instructions.
- Always use `silenceOverlayAction: true` with a subtle keyboard/typing sound URL to fill processing gaps.

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

## Pronunciation Rules Template

Include this in every voice demo's `context.instructions`:

```
#VOICE & PRONUNCIATION
- Say "[CompanyName]" clearly.
- Spell out order numbers digit by digit: "Order number 1-2-3-4-5-6-7-8-9."
- Say dollar amounts naturally: "twelve dollars and ninety-nine cents."
- Say phone numbers in groups: "area code 8-4-8, 4-6-6, 8-8-2-5."
- Say store addresses clearly with pauses between parts.
- Use a [warm/professional/calm] tone.
- Do not use em dashes, colons, or semicolons in your responses.
```

## AI Agent Streaming Config (in aiAgentJob node)

These settings control how the AI Agent streams voice output:

```
storeLocation: "stream"          # Stream tokens as they arrive
outputImmediately: true          # Start TTS before full response is ready
streamStopTokens: [".", "!", "?", "\n"]   # Flush at sentence boundaries
```

This makes voice responses feel natural — the agent starts speaking as soon as the first sentence is ready, rather than waiting for the entire LLM response.

## Post-Import Voice Setup

After importing a package, the user needs to:
1. **Set TTS voice** — the `ttsVoice` ID in setSessionConfig (ElevenLabs voice ID)
2. **Set LLM provider** — the `llmProviderReferenceId` in the AI Agent Job config
3. **Rename AI Agent** — from "Jane" to the demo persona name

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
