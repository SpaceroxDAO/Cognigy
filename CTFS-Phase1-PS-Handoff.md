# CTFS — Phase 1 Professional Services Handoff

**Account:** Canadian Tire Financial Services (CTFS)
**Date:** March 9, 2026
**Sales Team:** Amitej Vaid (AE), George Downey IV (Sr AI Sales Consultant), Adam Boyle (AI SC)
**Customer Contact:** Jennifer Lambert (Manager, CSOS), Jasmine (backup while Jen OOO March 9–13)

---

## Phase 1 Scope Summary

Per customer direction (Jasmine Lambert): Phase 1 = all toll lines flagged **Y in Column H (Bot Use Cases)** with **scenarios listed in Column K (Phase 1)**.

This yields **2 IVR programs** across **2 main toll lines** (plus satellite lines sharing the same IVR):

| # | IVR Program | Main Toll | LOB | Bank/Non-Bank | Satellite Lines |
|---|---|---|---|---|---|
| 1 | MasterCard Customer Service | 800-459-6415 | CRCC | Bank | 800-461-2800 (Retail EN), 800-265-2111 (Retail FR), 905-735-7256 (Intl Collect) |
| 2 | MasterCard Card Activation | 877-642-2357 | CRCC | Bank | — |

---

## Phase 1 Use Cases by IVR

### 1. MasterCard Customer Service (800-459-6415)

**Application:** IVR - Credit Card | **Sycurio:** Yes | **APIs:** Yes | **External Lookups:** Yes

**Phase 1 — AI Agent Handles Fully:**
- Account information & general account inquiries (natural language)
- Balance inquiries
- Statement information (statement balance, due date, minimum payment)
- Credit limit / available credit information

**Deferred to Future Phases (route to live agent):**
- Payment information / processing *(Phase 2 — requires Sycurio PCI)*
- Credit limit increase requests *(Phase 2 — requires TSYS write-back)*
- Lost/stolen card reporting *(Phase 2 — requires Pega case creation)*
- Card cancellation *(Phase 2 — requires TSYS write + Pega update)*
- Next Best Offer / offers routing *(Phase 2+ — requires SAS RTDM)*

**Satellite Lines (same IVR, same Phase 1 scope):**
| Toll | Description | Notes |
|---|---|---|
| 800-461-2800 | Retail Customer Service English | Shares Credit Card IVR |
| 800-265-2111 | Retail Customer Service French | Shares Credit Card IVR |
| 905-735-7256 | MasterCard Collect Calls International | Shares Credit Card IVR |

### 2. MasterCard Card Activation (877-642-2357)

**Application:** IVR - Activations | **Sycurio:** Yes | **APIs:** Yes | **External Lookups:** Yes

**Phase 1 — AI Agent Handles Fully:**
- Card activation assistance

**Deferred to Future Phases:**
- Next Best Offer / offers routing

---

## Integration Dependencies

| Dependency | Required For | Phase |
|---|---|---|
| TSYS (read) | Account info, balance, statement, credit limit, activation | **Phase 1** |
| Sycurio PCI | Payment processing | Phase 2 |
| TSYS (write) | Credit limit increase, card cancellation | Phase 2 |
| Pega | Lost/stolen reporting, card cancellation (case creation) | Phase 2 |
| SAS RTDM | Next Best Offer routing | Phase 2+ |

---

## What Is NOT in Phase 1

The following toll groups have Bot Use Cases flagged (H=Y) but **no Phase 1 scenarios** — they are future phase candidates only:

| Group | Tolls | Future Use Cases |
|---|---|---|
| After-Sales Service (IVR - ASSP) | 54 brand-specific lines (Yardworks, MotoMaster, Paderno, etc.) | Warranty playback, parts availability, send manual (email/SMS) |
| One Number — Loyalty & Gift Card (800-226-8473) | 1 line | Order details, cancel order, resend email confirmation |
| MasterCard Collections (800-561-4465) | 1 main + ~60 direct-dial lines | Payment info/processing, PTP offers |

---

## Volume Estimate

**Open item:** Call volumes for Phase 1 use cases are needed. George's original email estimated:
- **SERVICE (Credit Card IVR):** ~28,500 avg weekday calls (74.3% of total)
- **Activation IVR:** Volume TBD

**Action needed:** Ask CTFS (Jasmine) for a volume breakdown specific to the Phase 1 use cases above — specifically what percentage of the ~28,500 daily SERVICE calls are account info / balance / statement / credit limit inquiries vs. the deferred use cases (payments, lost/stolen, etc.).

---

## Open Questions for Customer

1. **Volumes:** What are the call volumes for the Phase 1 use case categories specifically? (Account info, balance, statement, credit limit, card activation)
2. **French support:** The Retail FR line (800-265-2111) shares the Credit Card IVR — is bilingual (EN/FR) required for Phase 1, or English-only first?
3. **International collect calls (905-735-7256):** Same IVR — any special handling for international callers?
4. **Authentication:** What is the current caller authentication flow? (Card number + DOB? Last 4 SSN? Other?) What should the AI agent use?
5. **TSYS API access:** Is read-only API access to TSYS available for Phase 1 integration? Any existing API documentation or sandbox environment?
6. **Escalation path:** When the AI agent cannot handle a request (future phase use cases), where does the call route? Which queue/skill?

---

## Phasing Roadmap (High Level)

```
Phase 1 (Current)
├── MasterCard Customer Service — account info, balance, statement, credit limit
└── MasterCard Card Activation — activation assistance

Phase 2 (Sycurio PCI + TSYS Write + Pega)
├── Payment processing
├── Credit limit increase requests
├── Lost/stolen card reporting
└── Card cancellation

Phase 2+ (SAS RTDM + Expanded)
├── Next Best Offer routing (Service + Activation)
├── Collections IVR — payment info, PTP offers
└── One Number — order details, cancel order, resend confirmation

Future
└── After-Sales Service (54 brand lines) — warranty, parts, send manual
```
