# NiCE + Cognigy Capability Reference

Canonical answers for RFP requirements. Always use product names — never say "our platform."

---

## AI & Virtual Agent (Cognigy.AI)

### NLU / Intent / NLP
**Yes.** Cognigy.AI's ML-based NLU engine handles intent classification, entity extraction, and slot-filling across 100+ languages. Intents are trained with example utterances; the model supports continuous learning from conversation logs. Confidence thresholds are configurable per intent. Third-party NLU engines (Google Dialogflow, Amazon Lex, IBM Watson) can be integrated via the NLU Connector framework.

### Multi-Turn Conversation
**Yes.** Full context is maintained across turns, sessions, and channels. The Cognigy Context object persists variables throughout a conversation lifecycle, and Profile storage enables long-term memory across sessions.

### Language Support
**Yes.** 100+ languages natively. Language detection triggers automatically from the first utterance. Each language runs its own NLU model. French (CA/FR), Spanish (US/ES/LATAM), German, Italian, Dutch, Portuguese are all production-ready with no degradation vs. English. Consistent UI/UX per locale.

### Voice (STT/TTS)
**Yes.** Cognigy Voice Gateway provides SIP-based voice infrastructure. STT: Deepgram Nova-3 (primary), Google STT, Microsoft Azure STT, Amazon Transcribe — configurable per deployment. TTS: ElevenLabs (neural, multilingual), Microsoft Azure Neural TTS, Google WaveNet, Nuance — configurable per voice persona. Custom pronunciation dictionaries supported. Speaker diarization available via Deepgram. Noise filtering and endpointing are configurable.

### Generative AI / LLM Integration
**Yes.** Cognigy LLM nodes connect to Azure OpenAI, OpenAI, Anthropic Claude, Google Gemini, and any OpenAI-compatible endpoint. Prompts are fully configurable. RAG pipelines ground LLM responses in knowledge source documents.

### Knowledge AI / RAG
**Yes.** Knowledge AI ingests PDFs, URLs, and structured documents; chunks and embeds them; and retrieves relevant passages at runtime to ground agent responses. Prevents hallucination by keeping the LLM grounded in verified content. Citations are returned with responses.

### Agent Copilot (Agent Assist)
**Yes.** Cognigy Agent Copilot provides real-time suggestions, next-best-action prompts, knowledge article surfacing, and AI-generated response drafts to human agents during live interactions. Integrates with the agent desktop.

### Agentic AI / Autonomous Agents
**Yes.** Cognigy AI Agent framework enables autonomous tool execution — the AI can call APIs, execute multi-step tasks, and complete goals without turn-by-turn scripting. Tool definitions follow OpenAI function-calling schema. Guardrails are configurable to constrain scope.

### Escalation to Human
**Yes.** OOTB handover protocol transfers full conversation context (transcript, intent, entities, customer data) to the receiving CXone agent. Context is surfaced in the agent desktop pre-populated. Whisper coaching and warm transfer are supported.

### Model Governance
**Yes.** Cognigy supports: audit trails for all model changes, version control for flow deployments, bias testing via intent distribution analysis, RAG grounding for hallucination prevention, confidence thresholds with fallback handling, and prompt injection defenses via input sanitization.

### Auto-Translation
**Yes.** LLM-based auto-translation is available for dynamic content rendering. Static localization is managed per-locale in the CMS. Language detection is automatic.

### Testing & QA for Bots
**Yes.** Intent Trainer for reviewing and correcting misclassifications. Playbook testing framework for scripted regression tests. NLU test suites with expected intent/entity mapping.

### Accessibility
**Yes.** Cognigy Webchat v3 is WCAG 2.1 AA compliant. Voice channel is inherently accessible. Screen reader compatible.

### Third-Party NLU/TTS Integration
**Yes.** NLU Connector framework supports Google Dialogflow, Amazon Lex, IBM Watson, and custom NLU endpoints. TTS/STT are swappable per deployment — multiple providers can run simultaneously for A/B testing.

---

## CXone Platform — Omnichannel & Routing

### Channel Coverage
**Yes.** CXone supports: inbound/outbound voice, webchat, email, SMS, WhatsApp Business API, Apple Messages for Business, Facebook Messenger, Twitter/X DMs, Instagram, LINE, Viber, video chat. All channels are managed from a single queue and routing engine.

### Omnichannel Routing / ACD
**Yes.** CXone's ACD routes based on: intent (from Cognigy), customer value/segment, agent skills, real-time queue load, schedule, and priority. Dynamic AI routing adjusts in real-time. Skills-based routing with multi-skill matching and proficiency weighting.

### Agent Affinity / Last-Agent Routing
**Yes.** Configurable at queue level. Last-agent routing preserves preferred-agent relationships. Affinity decay is configurable (time-based fallback to queue).

### Intent-Based Routing
**Yes.** Cognigy.AI classifies intent and passes it via context to CXone routing; the ACD uses intent as a routing attribute alongside other signals.

### Schedule-Aware / After-Hours
**Yes.** OOTB schedule configuration per queue/skill. After-hours handling routes to voicemail, callback scheduling, or async messaging.

### Transfers / Warm Handoff
**Yes.** Warm transfer, cold transfer, conference, and transfer with full context screen-pop. Cross-channel transfers (e.g., bot chat → voice agent) with context preservation.

---

## Workforce Management (CXone WFM)

### Forecasting
**Yes.** Multi-channel, multi-skill forecasting engine. Algorithms: Erlang C, regression, pattern analysis. Supports 15-minute interval granularity. Historical data ingestion from CXone and third-party ACD sources.

### Scheduling
**Yes.** Automated schedule generation respecting skills, hours, labor rules, and preferences. Agent self-scheduling portal (Shift Bidding). Schedule adherence monitoring in real-time.

### Adherence & Real-Time Tracking
**Yes.** Real-time adherence dashboard for supervisors. Threshold alerts for schedule deviation. Automatic state tracking from CXone.

### Performance Dashboards
**Yes.** Agent and team KPI dashboards (AHT, adherence, occupancy, CSAT). Supervisor coaching scorecards. Gamification module for engagement.

### HR/Payroll Integration
**Partial.** CXone WFM integrates with major HRIS (Workday, SAP SuccessFactors, ADP) via REST API for shift data and time reporting. Native pay/incentive calculation is not included — this is handled by the HR system.

---

## Recording, Analytics & QA

### Call & Screen Recording
**Yes.** 100% call recording with configurable retention. Screen recording synchronized with voice. Multi-channel recording (chat transcripts, email threads). PCI pause/resume for payment masking. Storage in CXone cloud with retention policies configurable per region.

### Interaction Analytics / Speech Analytics
**Yes.** CXone Interaction Analytics: automated transcription, topic detection, sentiment analysis, category tagging, trend analysis. Speaker diarization. Custom categories and phrases configurable.

### Real-Time Reporting
**Yes.** Real-time dashboards at queue, team, and agent level. 15-minute interval data. Role-based view configuration. Threshold alerts with configurable notifications. API access for integration with BI tools (Tableau, Power BI).

### Historical Reporting
**Yes.** Prebuilt report library (100+ standard reports). Custom report builder. Scheduled export (CSV, PDF, Excel). Data retention per contractual terms. Data lake integration via CXone APIs.

### Auto-QA
**Yes.** CXone Auto QA evaluates 100% of interactions against configurable scorecards using NLP. Flags coaching opportunities. Reduces manual QA workload by 80%+ on average.

### Survey / CSAT
**Yes.** Post-interaction IVR surveys, SMS surveys, and email surveys. NPS, CSAT, CES scoring. Results correlate with interaction records.

---

## Security & Compliance

### Certifications
SOC 2 Type II, ISO 27001, ISO 9001, PCI DSS Level 1 Service Provider, FedRAMP Moderate (CXone), HIPAA (BAA available), GDPR (DPA and SCCs available), CCPA.

### Encryption
AES-256 at rest. TLS 1.2+ in transit. Certificate management via AWS ACM / Azure Key Vault. BYOK (Bring Your Own Key) available for enterprise accounts. HYOK on roadmap.

### Data Residency
Multi-region deployment: US, EU (Frankfurt), APAC (Sydney, Singapore). Data is isolated per region — no cross-region transfer unless explicitly configured. GDPR Article 46 compliance for EU customers.

### Authentication / SSO
SAML 2.0 and OAuth 2.0/OIDC for SSO. LDAP/Active Directory integration. MFA enforced for admin roles; configurable for agents. SCIM 2.0 for automated provisioning/deprovisioning.

### RBAC
Role-based access control with configurable permission sets. Principle of least privilege. Attribute-based access control available via SSO assertion mapping (Partial — requires IdP configuration).

### Voice Biometrics
**Partial.** CXone supports passive voice biometric authentication and fraud detection via certified integration with leading voice biometric providers (partnership announced January 2026). Not a native NICE-owned capability — answer as "Partial" and offer to discuss provider options during solution design.

### PCI Compliance
**Yes.** PCI DSS Level 1 certified. DTMF masking for card entry during calls. Payment IVR with pause/resume recording. Tokenization via third-party payment processors.

### Audit Trails
**Yes.** Full audit trail for all configuration changes, user actions, and data access. Exportable logs. SIEM integration via Syslog/API.

### Vulnerability Management
Annual penetration tests by third-party. CVE monitoring and patching within SLA (critical: 24h, high: 7d, medium: 30d). Customer notification for relevant vulnerabilities per contract terms.

### Data Retention / Deletion
Configurable retention per data type and region. Right-to-erasure (GDPR Article 17) supported. Deletion confirmation provided. Data portability on request.

---

## DR / High Availability

### Uptime SLA
99.99% monthly availability SLA for all mission-critical CXone services (voice, ACD, recording).

### Architecture
Active-active multi-AZ deployment on AWS. Geographic redundancy across regions. No single point of failure in core call path.

### RTO / RPO
RTO: < 4 hours for full platform recovery. RPO: < 1 hour. Real-time replication across AZs (RPO near-zero for AZ failover).

### DR Testing
Annual DR tests performed. Test reports available to customers under NDA. Customers may observe DR exercises by arrangement.

### Backup
Daily backups of all configuration and interaction data. Replication across AZs in real-time. Cross-region backup for disaster scenarios.

---

## Integrations & APIs

### REST APIs
Full REST API coverage for all platform functions. OpenAPI (Swagger) documentation. Versioned API with 12-month deprecation notice.

### Webhooks / Event Streaming
Real-time webhooks for interaction events (start, end, transfer, disposition). CXone Event Stream (Kinesis-based) for high-volume data streaming.

### CRM Integration
Salesforce (managed package + REST), ServiceNow, Microsoft Dynamics 365, Zendesk, SAP CRM, Oracle Service Cloud. OOTB screen-pop, click-to-dial, case/ticket sync.

### Marketplace
CXexchange: 150+ pre-built integrations. Self-service app installation. Custom app development via CXone APIs.

### Sandbox
Yes. Full-featured sandbox environment. Production cloning available. Separate sandbox API keys.

### Configuration Portability
Configuration export/import via API for flows (Cognigy) and routing configs (CXone). Configuration-as-code supported for Cognigy flows via REST API + CLI.

---

## Outbound Communications

> **Product to reference for all outbound:** CXone SmartReach (formerly LiveVox, acquired by NICE in 2024). Do NOT say "Personal Connection" for proactive/campaign outbound — use SmartReach. Personal Connection remains valid for basic predictive dialing but SmartReach is the flagship outbound product.

### CXone SmartReach (Primary Outbound Product)
**Yes.** CXone SmartReach is NICE's omnichannel proactive outreach platform, acquired via LiveVox (closed 2024). Core capabilities:
- **Omnichannel outbound campaigns** across voice, SMS, email, and WhatsApp from a single campaign engine
- **Predictive, progressive, and preview dialing** with no-pause dialer and direct-drop voicemail
- **Proactive notifications** — event-triggered outbound (abandoned cart, order exceptions, appointment reminders, promotion awareness)
- **Up to 50 business data fields** importable per contact for personalised outreach
- **Attempt Supervisor** — centralised attempt controls and pacing across campaigns and channels
- **Embedded consent management** — captures and tracks channel consent across all outbound types
- **Full TCPA, CTIA, CAN-SPAM compliance automation** — DNC scrubbing, time-zone-aware dialing, suppression list management
- **Unified agent UI** — inbound and outbound in one interface; no separate desktop training
- **Universal queue** — blends inbound and outbound within CXone's ACD
- Integrated with CXone Interaction Analytics, QM, and recording

**Key positioning for retail/luxury use cases:**
- Abandoned cart follow-up via voice, SMS, or email — triggered by ecommerce events
- Promotional outbound campaigns with personalisation from CRM/CDP data
- Proactive service recovery outreach based on order exceptions from OMS
- VIP/loyalty proactive engagement journeys

### AMD (Answering Machine Detection)
**Yes.** Configurable AMD within CXone SmartReach with message-leave option or call abandon. Accuracy tunable per campaign.

### Contact Blending
**Yes.** Inbound/outbound blending via CXone's universal queue. SmartReach outbound campaigns blend dynamically with inbound based on real-time queue load and agent availability.

---

## Retail / Luxury-Specific

### Customer 360 / VIC Clienteling
**Yes (with CRM integration).** CXone integrates with Salesforce Service Cloud (or equivalent CRM) to surface unified customer profiles at interaction start: purchase history, VIC/loyalty tier, preferences, prior interactions. Cognigy.AI can call CRM APIs mid-conversation to enrich context.

### Personalized Self-Service
**Yes.** Customer-specific IVR/chatbot experiences based on data lookups. Recognized callers get personalized greeting and pre-populated context. Proactive notifications (order status, appointments) via outbound voice/SMS.

### Guided Selling
**Partial.** Cognigy.AI can be configured for guided selling dialogs using decision-tree + AI flows. Product catalog integration via API. Full guided selling with recommendations requires CRM/e-commerce integration (Salesforce Commerce Cloud, Shopify, etc.).

### Case Management (Orders, Returns, Exchanges)
**Partial.** CXone provides native case management with CRM. Deep retail case actions (order modification, return initiation, waitlist management, promotions) require Salesforce/ServiceNow integration. OOTB order-status lookup and return initiation are available via Cognigy tool-calling to commerce APIs.

### Boutique / Store Context
**Yes (with CRM integration).** Store and boutique associate context can be passed via CTI screen-pop. Store inventory lookup, appointment scheduling, and in-store event triggers are configurable via Cognigy API tool calls.

### Consent / Privacy / Right to Delete
**Yes.** Interaction consent capture configurable in IVR/chatbot. Do-not-contact management. GDPR/CCPA right-to-erasure supported. Data deletion workflows available.

---

## Pricing Structure Notes (for Pricing Sheets)

NiCE CXone is priced on a named-user or concurrent-agent subscription model. Key components:
- **Agent licenses:** Named agent or concurrent agent (CXone Ultimate, Complete, or Core tiers)
- **Cognigy.AI:** Priced per monthly active session volume or per deployment
- **WFM:** Per agent per month add-on
- **Analytics/QA:** Per agent per month or per interaction volume
- **Storage:** Included up to threshold; overage per GB/TB
- **Integrations:** Standard CRM integrations included; custom integrations via Professional Services
- **Support:** Standard (24/7 P1), Premium, and Dedicated support tiers
- Formal pricing requires a commercial proposal scoped to exact seat count, channel mix, and geographic deployment.
