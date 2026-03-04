---
name: prospect-research
description: Load when researching a prospect company, gathering demo context, identifying IVR pain points, or preparing a demo spec before building.
user-invocable: false
dependencies: []
---

# Prospect Research

## NEVER
- Never guess industry terminology — always verify from the prospect's own website or docs.
- Never assume the prospect's workflow — ask or research first.
- Never use competitor brand names in demo content.
- Never include real customer PII — always use the Adam Boyle demo persona.
- Never skip researching the prospect's existing IVR/phone tree — it's what we're replacing.

## ALWAYS
- Always check the prospect's website for: products, services, support pages, FAQ pages.
- Always identify: what their current customer contact workflow looks like (the "before").
- Always find: their actual terminology (insurance says "illustration" not "quote").
- Always determine: the tone/culture (formal bank vs. casual retail vs. empathetic healthcare).
- Always look for: the rewards program name, return policy, service tiers — things the demo FAQ needs.

## Research Checklist

### Company Context
- [ ] Company name and what they do
- [ ] Industry vertical (retail, finance, healthcare, telecom, etc.)
- [ ] Their products/services
- [ ] Target customer demographic

### Support Workflow (the "before")
- [ ] Current phone number / IVR structure
- [ ] Common reasons people call
- [ ] How calls are routed today
- [ ] Average handle time concerns
- [ ] Pain points (long hold times, menu trees, transfers)

### Demo Framing (the "after")
- [ ] Which workflows should the AI agent handle?
- [ ] What's the "wow moment" in the demo?
- [ ] What escalation scenario shows hybrid human+AI value?
- [ ] What visual artifact (xApp) would impress?

### Content for Knowledge Base
- [ ] FAQ page content
- [ ] Return/cancellation policy
- [ ] Rewards/loyalty program details
- [ ] Service catalog or menu
- [ ] Hours, locations, contact info

### Tone and Voice
- [ ] How do their agents actually talk? (formal, casual, empathetic)
- [ ] Any compliance requirements? (HIPAA, PCI, insurance licensing)
- [ ] What should the agent NEVER say? (medical advice, legal advice, prices)

## Research Sources

### Primary (always check)
- Company website (About, Support, FAQ, Contact pages)
- Their phone number (call it to hear the current IVR)

### Secondary (if available)
- Prep call transcripts from the sales team
- RFP/RFI questions from the prospect
- Slide decks or briefing docs
- Annual reports (for terminology and strategic priorities)

### Web Research
- "[Company] customer service phone number" — reveals IVR structure
- "[Company] rewards program" — reveals loyalty details
- "[Company] return policy" — content for knowledge base
- "[Company] locations near [city]" — realistic store data for mock

## Output: Demo Spec Inputs

After research, you should be able to fill in:

```
Company:       [Name]
Industry:      [Vertical]
Agent Persona: Jane — [personality traits]
Tone:          [formal/balanced/casual]
Channel:       [voice/chat/both]
Demo scenario: [1-2 sentence description]
Tools needed:  [list of 4-7 tools]
Knowledge:     [3-5 FAQ topics to cover]
Escalation:    [what triggers human handoff]
```

## Example: Office Depot Research Output

```
Company:       Office Depot (includes OfficeMax brand)
Industry:      Retail / Office Supplies
Agent Persona: Jane — warm, upbeat, knowledgeable
Tone:          Balanced — friendly but efficient
Channel:       Voice (IVR replacement)
Demo scenario: Customer calls about order status, rewards, returns, store info
Tools:         authenticate, order_status, store_locator, rewards_inquiry, returns, print_services, agent_handover
Knowledge:     Print services menu, rewards program (Basic/VIP tiers), return policy (30 days, 14 for tech)
Escalation:    Customer asks for human, issue unresolvable, customer frustrated
```
