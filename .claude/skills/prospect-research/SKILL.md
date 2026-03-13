---
name: prospect-research
description: "Research a prospect company to gather demo context: products, terminology, IVR pain points, FAQ content, and tone. Use this whenever the user names a company to demo for, asks 'what do they do', shares a prospect name or website, or needs to understand the customer's world before building -- even if they just say 'build a demo for X'."
user-invocable: false
dependencies: []
compatibility: { tools: [WebSearch, WebFetch] }
---

# Prospect Research

## NEVER
- Never guess industry terminology -- always verify from the prospect's own website or docs, because using the wrong term (e.g., "quote" instead of "illustration" in insurance) makes the demo feel generic.
- Never assume the prospect's workflow -- ask or research first, because getting the process wrong is worse than having no demo at all.
- Never use competitor brand names in demo content -- prospects notice immediately and it kills trust.
- Never include real customer PII -- always use the Adam Boyle demo persona to keep demos safe for any audience.
- Never skip researching the prospect's existing IVR/phone tree -- it's what we're replacing, and understanding the "before" makes the "after" compelling.

## ALWAYS
- Always check the prospect's website for: products, services, support pages, FAQ pages -- this is the primary source of truth for terminology and tone.
- Always identify: what their current customer contact workflow looks like (the "before") -- the demo is only impressive when the audience can compare it to what they have today.
- Always find: their actual terminology (insurance says "illustration" not "quote") -- the LLM will use whatever words you put in the instructions, so they must match the prospect's language.
- Always determine: the tone/culture (formal bank vs. casual retail vs. empathetic healthcare) -- mismatched tone is the #1 reason demos feel "off" even when the tools work perfectly.
- Always look for: the rewards program name, return policy, service tiers -- things the demo FAQ needs to sound knowledgeable about the prospect's business.

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
- "[Company] customer service phone number" -- reveals IVR structure
- "[Company] rewards program" -- reveals loyalty details
- "[Company] return policy" -- content for knowledge base
- "[Company] locations near [city]" -- realistic store data for mock

## Output: Demo Spec Inputs

After research, you should be able to fill in:

```
Company:       [Name]
Industry:      [Vertical]
Agent Persona: Jane -- [personality traits]
Tone:          [formal/balanced/casual]
Channel:       [voice/chat/both]
Demo scenario: [1-2 sentence description]
Tools needed:  [list of 4-7 tools]
Knowledge:     [3-5 FAQ topics to cover]
Escalation:    [what triggers human handoff]
```

## Phase 2: Web Research & Scraping

After completing the Research Checklist above, run this automated protocol to gather real content from the prospect's public web presence. This makes `context.knowledge` authentic instead of fabricated.

### Step 1: Auto-Discovery (WebSearch)

Run these searches for every demo, substituting the company name and use-case keywords:

```
"[Company] FAQ"
"[Company] frequently asked questions"
"[Company] help center"
"[Company] support"
"[Company] [use-case keyword] policy"     (e.g., return policy, billing, claims)
"[Company] customer service phone number"
"[Company] [product/service] pricing"
"[Company] locations hours"
```

From the results, collect the top 5-10 most relevant URLs: FAQ pages, help centers, policy pages, product/service pages, and location/contact pages.

### Step 2: Content Scraping (WebFetch)

Fetch each discovered URL with a targeted extraction prompt:

| Page Type | WebFetch Prompt |
|---|---|
| FAQ page | "Extract all question-and-answer pairs from this page" |
| Policy page | "Extract the complete return/cancellation/billing policy with specific rules, timeframes, and exceptions" |
| Product/service page | "Extract product names, descriptions, pricing, and key features" |
| Help/troubleshooting article | "Extract the troubleshooting steps and resolution information" |
| Location/contact page | "Extract addresses, phone numbers, and hours of operation" |
| Homepage | "Extract the company tagline, main value proposition, and brand tone" |

Also fetch the prospect's main homepage for tone and branding context.

### Step 3: Content Audit

After scraping, audit the results against the demo's tool set:
- List what was found vs. what's needed for each tool
- Flag gaps (e.g., "No public pricing found, will use representative data")
- Present the Scraped Knowledge Summary to Adam for review before proceeding

### Output: Scraped Knowledge Summary

Present this deliverable after scraping, before moving to spec writing:

```
## Scraped Knowledge Summary

### Sources Fetched
1. [URL] - FAQ page (12 Q&A pairs extracted)
2. [URL] - Return policy (full policy with timeframes)
3. [URL] - Product catalog (8 products/services)
...

### Content by Topic
[Organized extracts grouped by topic, ready to feed into context.knowledge]

### Gaps
- [Topic X]: No public content found, will use representative data
- [Topic Y]: Found partial info, supplemented with plausible details
```

Adam reviews and approves this summary before it feeds into `context.knowledge`.

---

## Example: Office Depot Research Output

```
Company:       Office Depot (includes OfficeMax brand)
Industry:      Retail / Office Supplies
Agent Persona: Jane -- warm, upbeat, knowledgeable
Tone:          Balanced -- friendly but efficient
Channel:       Voice (IVR replacement)
Demo scenario: Customer calls about order status, rewards, returns, store info
Tools:         authenticate, order_status, store_locator, rewards_inquiry, returns, print_services, agent_handover
Knowledge:     Print services menu, rewards program (Basic/VIP tiers), return policy (30 days, 14 for tech)
Escalation:    Customer asks for human, issue unresolvable, customer frustrated
```
