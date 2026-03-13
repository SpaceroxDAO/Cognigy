# Hearst Technology Services — AI IT Assistant Demo Overview

## Executive Summary

This demo showcases Cognigy.AI as a full replacement for Moveworks, delivering an intelligent AI IT assistant ("Jane") that integrates with ServiceNow, Okta, SAP Concur, Microsoft Entra-ID, JAMF, Intune, and Sumo Logic. Deployed across Microsoft Teams, Slack, and web chat, the assistant handles ticket management, account self-service, knowledge search, device diagnostics, expense management, and live agent escalation — all through natural conversation with visual confirmation via interactive micro-applications (xApps).

The demo directly addresses every functional requirement in the Hearst Technology Services AI Assistant Requirements document, with working examples of each capability.

---

## What the Demo Shows

### 1. Identity Verification with One-Time Code (OTP)

Before any account-specific action, Jane verifies the employee's identity by sending a one-time verification code to their registered email. The employee receives a branded Okta-style verification screen where they enter the 6-digit code. This demonstrates secure, frictionless authentication without requiring employees to remember additional passwords or navigate to a separate portal.

**Requirement addressed:** Security — SSO capability, secure authentication, separation of requester and executor roles.

### 2. ITSM Support — Full ServiceNow Integration

Jane provides complete ticket lifecycle management through natural conversation:

- **Create tickets**: The employee describes their issue conversationally. Jane collects the category, priority, and description, then presents a ServiceNow-branded form with employee details (name, ID, department, location) pre-filled. The employee reviews and submits directly from the chat.
- **Auto-triage**: Every ticket is automatically classified and assigned to the appropriate support group (Network Team, Software Provisioning, Identity & Access Management, etc.) based on the category — no manual routing required.
- **Check ticket status**: Employees ask about any ticket by number and receive a ServiceNow-branded detail view showing status, priority, assignment, and the full activity timeline.
- **Approve or reject requests**: Pending approvals (software installations, access requests) appear with Approve and Reject buttons directly in the chat. When the employee clicks Approve, the status updates live on screen and the requestor is notified immediately.

**Requirements addressed:** Ticket management, autonomous triage and classification, NLP interactions with tickets, ability to present forms with autofilled fields, streamlined approvals in chat, escalation with full conversation context.

### 3. Self-Service Account Management (Okta / Entra-ID)

Jane handles the most common IT self-service requests without human intervention:

- **Okta Account Unlock**: When an employee reports a locked account, Jane verifies their identity, confirms the action, and unlocks the account. A branded Okta status card shows the action completing in real time with a success confirmation.
- **Password Reset**: Jane sends a single-use password reset link to the employee's email, with clear instructions on requirements (12+ characters, mixed case, numbers, special characters).
- **MFA Reset**: Jane removes the existing MFA method and guides the employee through setting up a new one on their next login.
- **AD Password Reset**: For Active Directory passwords, Jane provides a direct link to the self-service reset portal on the HTS TechHelp SharePoint site.

**Requirements addressed:** Okta account unlock, Okta password reset, Okta MFA reset, AD password reset via SharePoint documentation link.

### 4. Knowledge Search Across All Sources

Jane searches across every connected knowledge source — SharePoint, Confluence, ServiceNow Knowledge Base, FAQ sheets, and MyHearst — and returns accurate, sourced answers. Each response includes a knowledge article viewer showing the source, verification status, last update date, and a step-by-step guide.

Topics covered include: VPN troubleshooting, Wi-Fi setup, new hire onboarding, software requests, password policies, Concur expense procedures, payroll and time-off systems (by division), printer setup, Teams and Outlook issues, OneDrive sync, distribution lists, phishing guidance, and more.

Knowledge search does not require authentication, making it instantly accessible for quick questions.

**Requirements addressed:** Knowledge ingestion from SharePoint, Confluence, ServiceNow KB, FAQ sheets, MyHearst/Liferay; ability to source knowledge from multiple systems; respect for resource-based permissions.

### 5. Device Health Diagnostics

Jane runs comprehensive device health checks by connecting to JAMF (Mac), Microsoft Intune (Windows), and Microsoft Admin Center. The employee receives an interactive diagnostic dashboard showing:

- **Disk space utilization** with a visual progress bar and cleanup recommendations
- **OneDrive sync status** with troubleshooting steps if issues are detected
- **Software license inventory** with alerts for low-usage licenses at risk of reclamation
- **Security scan results** including phishing threat detection via Sumo Logic

The dashboard runs an animated diagnostic scan that completes in real time, creating a visual "health check" experience alongside the conversation.

**Requirements addressed:** Disk space management (JAMF, Intune), OneDrive sync error detection (MS Admin Center), license reclamation (ServiceNow SAM), phishing alerts (Sumo Logic).

### 6. Expense Management (SAP Concur)

Jane provides full visibility into SAP Concur expense reports:

- **View expense reports**: Employees see their recent reports with status, amount, and individual line items (rides, meals, hotel, mileage) in a Concur-branded interface.
- **Approve or reject expense reports**: Managers see pending reports from their direct reports with full details and can approve or reject directly from the chat. The submitter is notified automatically.

**Requirements addressed:** Concur use case — look up expense reports, look up expense reports pending approval, approve or reject expense reports.

### 7. Live Agent Escalation with Full Context

When an issue requires human expertise, Jane transfers the employee to the appropriate IT support queue in ServiceNow Agent Workspace. The full conversation history — including what was tried, what tools were used, and what data was collected — transfers with the handover, so the live agent has complete context without the employee repeating themselves.

Available queues: General IT, Network Engineering, Identity & Access Management, Software Provisioning, Hardware Support, Information Security, Telecom, and Service Desk.

**Requirements addressed:** Escalation to live agent with full conversation context, routing to appropriate queues, ServiceNow Agent Workspace integration.

---

## How the Demo Meets Hearst's Requirements

### Functional Requirements

| Requirement Category | How the Demo Addresses It |
|---|---|
| **Core Platform — Connectors** | Working integrations with ServiceNow, Okta, Entra-ID, SAP Concur, JAMF, Intune, Sumo Logic, and SharePoint/Confluence |
| **Core Platform — Concur** | Expense report lookup, pending approvals, approve/reject — all with Concur-branded xApp |
| **Multi-channel support** | Single AI agent deployable to Teams, Slack, and web chat with consistent experience |
| **Voice support** | Full voice configuration included (Deepgram STT + ElevenLabs TTS), ready for voice channel |
| **Multi-LLM support** | Cognigy supports Azure OpenAI, Google Gemini, Anthropic Claude, and custom LLM endpoints |
| **Dev/Sandbox environments** | Cognigy provides full development, staging, and production environments |
| **Communications & Campaigns** | Platform supports proactive notifications, scheduled campaigns, and CSAT surveys (configurable post-demo) |
| **Knowledge Ingestion** | SharePoint, Confluence, ServiceNow KB, FAQ sheets, MyHearst/Liferay — all searchable through a single tool |
| **ITSM Support** | Full ticket lifecycle: create, status, update, approve/reject, auto-triage, auto-assign, form autofill |
| **Self-Service** | Okta unlock, password reset, MFA reset, AD password reset, people search (via knowledge tool) |
| **Additional Use Cases** | Payroll/time-off links by division, disk space management, OneDrive sync, license reclamation, phishing alerts |
| **Analytics** | Cognigy Insights provides full conversation analytics, tool usage metrics, CSAT, and task completion rates |

### Non-Functional Requirements

| Requirement | How Cognigy Addresses It |
|---|---|
| **Modularity** | Each tool is an independent, swappable module. New tools can be added without affecting existing ones. |
| **Extensibility** | Open extension framework, REST/webhook integrations, custom code nodes. No vendor lock-in. |
| **Industry Standards** | Supports A2A (Agent-to-Agent), MCP (Model Context Protocol), webhooks, REST, GraphQL. |
| **Agent Development** | Visual flow builder + code nodes. Hearst can build custom agents for any domain. |
| **Connectors Ecosystem** | 100+ pre-built connectors including ServiceNow, Salesforce, SAP, Microsoft Graph, Okta, and more. |
| **Security** | OAuth 2.0, API tokens, role-based access, audit logging, SSO via Okta, end-user permission enforcement. |
| **Knowledge & Trust** | Controlled ingestion pipelines, source attribution on every answer, versioning, allowlists/blocklists. |
| **User Experience** | Natural language conversation, context maintained across turns, clarifying questions when ambiguous, adaptive cards via xApps. |
| **Performance** | Sub-5-second response times, scales to 20,000+ concurrent users, 99.97%+ uptime SLA. |
| **Knowledge Adaptability** | Real-time knowledge updates via connected sources — no model retraining required. |

---

## Benefits of Cognigy Over Moveworks

### 1. Full Integration Control
Unlike Moveworks' closed ecosystem, Cognigy provides direct integration with any system via REST APIs, pre-built connectors, and custom code nodes. Hearst maintains full control over how data flows between systems.

### 2. Visual, Interactive Experiences (xApps)
Every tool action produces a branded, interactive visual confirmation — not just a text response. Employees see ServiceNow-style ticket forms, Okta-branded verification screens, Concur expense reports, and device health dashboards. This creates a familiar, trustworthy experience that mirrors the systems employees already know.

### 3. True Multi-Channel with Consistent Experience
One AI agent, one set of tools, one knowledge base — deployed identically across Teams, Slack, web chat, and voice. No separate configurations per channel.

### 4. Transparent AI with Source Attribution
Every knowledge answer includes the source (SharePoint site name, Confluence page, ServiceNow KB article). Employees and managers can verify the accuracy of any response. This directly addresses Hearst's Knowledge & Trust requirements.

### 5. Proactive Notifications and Campaigns
Beyond reactive support, Cognigy can push notifications to employees — ticket updates, approval reminders, security alerts, onboarding journeys — triggered by events in connected systems. This addresses the Communications & Campaign Management requirements that a pure chatbot cannot.

### 6. Approval Workflows in Chat
Software installation requests, access requests, and expense reports can be approved or rejected directly in the conversation — no portal switching. Managers see the request details, click a button, and the workflow completes. This dramatically reduces approval cycle times.

### 7. Autonomous Resolution with Automatic Case Logging
Jane resolves common issues (account lockouts, password resets, knowledge questions) autonomously and automatically logs a ServiceNow ticket documenting what was done. This creates an audit trail and captures resolution data for analytics — even for issues that never required a human.

### 8. No-Code Customization
Hearst's IT team can modify tools, add knowledge sources, adjust prompts, and create new workflows using Cognigy's visual flow builder — no engineering resources required. This addresses the extensibility and agent development requirements directly.

### 9. Enterprise-Grade Analytics
Cognigy Insights provides comprehensive visibility into every interaction: tool usage metrics, resolution rates, CSAT scores, triage accuracy, user adoption, and AI performance trends. Historical data retention supports Hearst's requirement for 5 years of analytics access.

### 10. Future-Proof Architecture
With support for A2A (Agent-to-Agent), MCP (Model Context Protocol), and multi-LLM switching, Cognigy is designed for the evolving AI landscape. Hearst can integrate with ServiceNow's own AI agents, swap LLM providers, or add specialized sub-agents — all without rebuilding.

---

## Demo Walkthrough — Suggested Scenarios

### Scenario 1: "My Account Is Locked" (2 minutes)
Employee reports a locked account. Jane verifies identity via OTP code sent to email. Employee enters the code on the Okta verification screen. Jane confirms identity, then unlocks the account. An Okta status card shows the unlock completing in real time.

**Shows:** OTP authentication, Okta integration, xApp visual confirmation, autonomous resolution.

### Scenario 2: "My VPN Keeps Dropping" (3 minutes)
Employee describes VPN issues. Jane searches the knowledge base and sends a SharePoint article with troubleshooting steps. When basic steps don't help, Jane creates a ServiceNow ticket with a pre-filled form (employee details autofilled, category auto-set to Network/VPN). The ticket is auto-triaged and assigned to the Network Team.

**Shows:** Knowledge search with source attribution, ServiceNow ticket creation with autofill, auto-triage.

### Scenario 3: "Do I Have Any Pending Approvals?" (2 minutes)
Manager asks about pending approvals. Jane shows a Jira access request from Maria Lopez with full details. The manager clicks Approve on the ServiceNow xApp. The status badge changes from "Awaiting Approval" to "Approved" live on screen. Maria is notified.

**Shows:** Approval workflows in chat, interactive xApp with status change, cross-system notification.

### Scenario 4: "Run a Health Check on My Laptop" (2 minutes)
Employee requests a device check. Jane sends a diagnostic dashboard showing disk space (78% used), OneDrive sync (healthy), software licenses (Salesforce flagged for low usage), and security status (no threats). Jane highlights the Salesforce license alert and asks if the employee still needs it.

**Shows:** JAMF/Intune integration, license reclamation, Sumo Logic security scan, proactive guidance.

### Scenario 5: "Show Me My Expense Reports" (2 minutes)
Employee asks about expenses. Jane shows their latest Concur report (NYC Client Meetings, $847.50, Approved) with full line items. Jane also surfaces a pending expense report from Jason Park ($1,245.00) awaiting the employee's approval. The employee approves it directly from the Concur xApp.

**Shows:** SAP Concur integration, expense report visibility, manager approval workflow.

---

## Technical Architecture

The AI IT Assistant is built on Cognigy.AI and consists of:

- **1 AI Agent Flow** with 8 integrated tools
- **7 interactive xApps** providing branded visual experiences
- **Knowledge base** drawing from SharePoint, Confluence, ServiceNow KB, and FAQ sources
- **Connected systems**: ServiceNow (ITSM), Okta (identity), Entra-ID (directory), SAP Concur (expenses), JAMF/Intune (device management), Sumo Logic (security)
- **Channels**: Microsoft Teams, Slack, Web Chat, Voice (optional)
- **LLM**: Azure OpenAI (configurable — supports Claude, Gemini, and others)

---

*Prepared for Hearst Technology Services by Cognigy*
*Demo package: Hearst-IT-Assistant-Demo.zip*
