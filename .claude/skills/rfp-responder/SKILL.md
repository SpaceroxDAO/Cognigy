---
name: rfp-responder
description: "Respond to RFPs, RFIs, and vendor questionnaires on behalf of NiCE + Cognigy.AI. Use this whenever the user shares an RFP Excel file or Word doc, says 'fill out this RFP', 'respond to this questionnaire', 'answer these vendor questions', or names a prospect and implies an RFP response is needed. Also use when reviewing or improving an existing NiCE/Cognigy RFP response. Triggers on: RFP, RFI, questionnaire, vendor assessment, security questionnaire, procurement response."
user-invocable: false
dependencies: []
source-files: [rfp/]
---

# RFP Responder

## NEVER
- Never fabricate company financials, employee counts, or certifications — because buyers verify these and a single inaccurate fact damages NiCE's credibility across the entire response. Use only data in `references/nice-capabilities.md` and `references/company-info.md`.
- Never use "No" unless the capability truly doesn't exist — because most apparent gaps can be honestly answered "Partial" with a note about integration, configuration, or roadmap. "No" answers become scoring losses in evaluation matrices.
- Never write generic vendor boilerplate ("our platform provides...") — because evaluators read dozens of RFPs and generic language signals a template response. Always name the product: CXone, Cognigy.AI, Knowledge AI, CXone WFM, NiCE Verify, etc.
- Never fill pricing sheets with specific dollar amounts — because pricing requires commercial scoping that isn't done yet. State the pricing model structure and note that a formal proposal will follow.
- Never overwrite content in the buyer's requirement columns — only write to response/comment/answer columns. Modifying requirements invalidates the RFP.
- Never use markdown in Excel cell responses — TTS doesn't apply here, but asterisks and pound signs appear as raw characters in cells. Plain text only.
- Never use em dashes (—) in any response, Word doc, or Excel cell — because Adam has explicitly banned them. Use a colon, semicolon, or comma instead depending on the context. Verdicts use a colon (e.g., "Yes: via Cognigy..."), clauses use a semicolon or comma.

## ALWAYS
- Always read `references/nice-capabilities.md` before generating answers — because capability positioning evolves and memory alone may be stale or imprecise.
- Always read `references/company-info.md` for supplier/company questions — because NiCE's public facts (employee count, revenue, certifications) must be accurate and consistent across all RFPs.
- Always use Python + openpyxl to fill Excel files — because manually describing what to type is error-prone and doesn't produce a deliverable. The output must be a real file Adam can submit.
- Always save to a NEW file (prefix "NiCE Response - ") — never overwrite the original buyer's template.
- Always confirm row counts per sheet after running the script — because silent write failures (wrong row range, wrong column) are hard to spot without a count check.
- Always match the buyer's compliance scale exactly — FC/PC/NC, Yes/No/Partial, Met/Partially Met/Not Met — because scoring matrices are formula-driven and a wrong string breaks the calculation.

## Process

### 1. Read the RFP File
- List all sheet names
- For each sheet to fill: identify exact column letters for the response columns and the first/last data row numbers
- Note the compliance scale used (FC/PC/NC vs Yes/No/Partial vs other)

### 2. Read Reference Materials
- `references/nice-capabilities.md` — canonical NiCE/Cognigy capability answers by category
- `references/company-info.md` — company facts for Supplier Questions sections
- SimpliSafe completed RFP — for tone calibration and any capability nuances

### 3. Generate Responses
For each requirement:
- Determine the category (AI/Bot, Routing, WFM, Security, etc.)
- Pick the compliance level: Yes (OOTB), Partial (with config/integration/roadmap), No (only if truly absent)
- Write 1–3 sentences: what the capability is called + how it works + why it's relevant
- Reference specific product names: Cognigy.AI, CXone, Knowledge AI, Agent Copilot, CXone WFM, CXone Analytics, NiCE Verify, etc.

### 4. Write and Run Python Script
```python
import openpyxl

wb = openpyxl.load_workbook("/path/to/rfp.xlsx")
ws = wb["Sheet Name"]
# Row-by-row: ws["G5"] = "Yes"; ws["H5"] = "Cognigy.AI provides..."
wb.save("/path/to/output.xlsx")
```

Key rules for the script:
- Use `load_workbook(data_only=False)` to preserve formulas
- Set cell values directly: `ws["G5"] = "Yes"`
- Never delete rows, columns, or sheets
- Verify output with `unzip -l` or a row count check

### 5. Deliver
- State the output file path
- List sheets filled + rows filled per sheet
- Flag any requirements answered "Partial" or "No" with brief explanation (these may need human review)
- Note any sheets skipped (pricing, architecture diagrams)

## Response Quality Guide

### AI & Bot Questions
Lean heavily on Cognigy.AI:
- NLU/intent: "Cognigy.AI's ML-based NLU engine supports intent classification, entity extraction, and slot-filling with continuous learning from conversation logs."
- RAG/grounding: "Knowledge AI uses retrieval-augmented generation to ground LLM responses in verified source documents, preventing hallucination."
- Voice: "Cognigy Voice Gateway integrates natively with Deepgram (STT) and ElevenLabs/Azure Neural (TTS), supporting 40+ languages with custom pronunciation models."
- Multilingual: "Cognigy.AI supports 100+ languages natively; automatic language detection triggers the appropriate locale from the first utterance."
- Agentic AI: "Cognigy's AI Agent framework enables autonomous tool execution, multi-step task completion, and goal-oriented behavior within guardrails."

### Routing Questions
Lean on CXone ACD:
- "CXone's AI-powered routing engine evaluates intent, customer value, agent skills, and real-time queue conditions to optimize assignment."
- "Agent affinity and last-agent routing are configured at the queue level, with priority weighting."

### WFM Questions
CXone WFM:
- "CXone WFM provides multi-skill, multi-channel forecasting at 15-minute intervals, automated schedule generation, and real-time adherence with supervisor alerts."

### Security/Compliance
- "SOC 2 Type II, ISO 27001, PCI DSS Level 1, FedRAMP Moderate, and GDPR-compliant. Full audit trail for all interactions and configuration changes."
- "AES-256 encryption at rest, TLS 1.2+ in transit. BYOK available for enterprise accounts."

### Supplier/Company Questions
Use `references/company-info.md` — do not improvise financials or certifications.

## Common RFP Compliance Scale Mapping

| Scale | Full | Partial | None |
|---|---|---|---|
| FC/PC/NC | FC | PC | NC |
| Yes/No/Partial | Yes | Partial | No |
| Met/PM/NM | Met | Partially Met | Not Met |
| 1/2/3/4 (some RFPs) | 1 or 2 | 3 | 4 |

## File Naming Convention
Output files: `NiCE Response - [Company] [Type] RFP.xlsx`
Build scripts: `rfp/build-rfp-[company].py`
