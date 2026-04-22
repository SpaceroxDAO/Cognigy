# NiCE COGNiGY AI Specialist Hub

A full-featured showcase platform for Cognigy AI virtual agents, built with React, TypeScript, and Lovable Cloud (Supabase).

**Live**: [ai-specialist-demos.lovable.app](https://ai-specialist-demos.lovable.app)

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Authentication & Security](#authentication--security)
- [User Onboarding](#user-onboarding)
- [Password Management](#password-management)
- [Admin Portal](#admin-portal)
- [Demo Showcase](#demo-showcase)
- [WebRTC Voice Calling](#webrtc-voice-calling)
- [Edge Functions](#edge-functions)
- [Database Schema](#database-schema)
- [Email System](#email-system)
- [Local Development](#local-development)

---

## Overview

The AI Specialist Hub is an internal demo platform that allows sales engineers, account executives, and partners to experience Cognigy AI virtual agents via WebRTC voice calls. Each demo showcases a different industry use case (healthcare, finance, insurance, home services, airlines, general support).

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Lovable Cloud) — Auth, PostgreSQL, Edge Functions, Storage
- **Voice**: WebRTC with Cognigy endpoints
- **Email**: Resend (transactional onboarding & recovery emails)
- **Routing**: React Router v6

## Architecture

```
src/
├── components/
│   ├── admin/           # Admin panel components
│   ├── WebRTC/          # Voice call engine (hooks, utils, components)
│   └── ui/              # shadcn/ui component library
├── contexts/
│   ├── AuthContext.tsx   # Authentication state & role management
│   └── FlowContext.tsx   # Demo flow configuration (cached, DB-driven)
├── pages/               # Route-level pages
├── services/
│   ├── admin.ts         # Admin API service (user CRUD, flow management)
│   ├── request.ts       # Access request service
│   └── roleService.ts   # Role management
└── utils/               # Logging, storage, endpoints, icons

supabase/functions/      # Edge Functions (Deno)
```

## Authentication & Security

### Login
- Email/password authentication via Supabase Auth
- No self-service signup — accounts are admin-controlled

### Access Requests
- Unauthenticated users can submit an access request from the login page
- Admins approve or decline requests from the admin portal
- Approved requests automatically create an account and send a branded welcome email

### Security Challenge System
- **Mandatory two-question setup**: All users must configure two unique security questions with hashed answers on first login (enforced by `force_security_setup` profile flag)
- Security questions gate the self-service password reset flow
- Authenticated users can update their security questions via the Profile page

### Rate Limiting & Account Lockout
- **5 failed attempts** on security question verification triggers a **15-minute account lockout**
- Lockout applies to both the question lookup and answer verification endpoints
- Failed attempts are tracked per email in the `security_attempts` table
- Non-existent emails also consume attempts (prevents enumeration timing attacks)
- Lockout auto-expires — no admin intervention needed
- Successful verification clears all attempts
- Old attempt records are auto-cleaned after 24 hours

### Migrated User Fallback
- Users migrated from the legacy platform who haven't set up security questions can still self-service reset their password
- The system detects the absence of security questions and sends the reset email directly (skipping the challenge)
- On first login after password setup, they are forced to configure security questions via the `force_security_setup` gate

### Role-Based Access Control
Roles are stored in the `user_roles` table:
- **admin** — Full platform access including admin portal
- **user** — Standard demo access
- **feedback-manager** — Can manage user feedback
- **user-manager** — Can manage users
- **flow-manager** — Can manage demo flow configurations

## User Onboarding

Onboarding is fully admin-controlled via a two-step process:

1. Admin creates a user (or approves an access request) — the account is created but no link is generated yet
2. When ready to send, the admin goes to **Manage Users**, clicks the link icon to generate a fresh onboarding link (OTP valid for 1 hour), and copies it to share via Teams or Slack
3. The user's profile is also flagged with a 48-hour `force_password_reset` window — if the link expires unused, the user is still prompted to set a password on next login
4. After setting their password, the user is prompted to configure two security questions on first login

This two-step approach ensures the 1-hour OTP window starts only when the admin is ready to distribute the link.

## Password Management

### Self-Service Reset (Login Page)
Uses an **email-after-challenge** workflow:
1. User enters their email
2. System checks for security questions:
   - **If configured**: User must correctly answer both questions → branded recovery email sent
   - **If not configured** (migrated users): Recovery email sent directly (no challenge)
3. Recovery links use `token` + `email` parameters verified client-side via `supabase.auth.verifyOtp`
4. This prevents automated link previewers (Teams, Outlook) from consuming the one-time tokens
5. After 5 failed security question attempts, the account is locked for 15 minutes

### Admin-Initiated Reset
- Admins generate a fresh reset link on-demand from the **Manage Users** tab (link icon)
- The link's OTP is valid for **1 hour** — a warning toast reminds the admin to send it immediately
- The user's profile is also flagged for a forced password reset (48-hour window) as a safety net

### Authenticated Password Change
- Users can update their password via the Profile page by verifying their current password

## Admin Portal

Accessible to users with `admin`, `user-manager`, `flow-manager`, or `feedback-manager` roles.

### Tabs

| Tab | Features |
|-----|----------|
| **Manage Users** | Searchable/filterable user list, role/type editing, delete users, send reset emails, bulk CSV import with per-user password & role/type assignment |
| **Add User** | Create individual users — auto-generates temp password and sends welcome email |
| **Access Requests** | Approve/decline pending requests — account is created on approval; admin then generates the onboarding link from Manage Users when ready to send |
| **Flow Manager** | Enable/disable demos, edit flow configs (name, description, icon, color, gradient, avatar, WebRTC URL, capabilities), reorder demos |
| **Feedback** | View and manage user feedback submissions with status tracking |
| **Roles** | Configure and assign granular role-based permissions |
| **Audit Log** | View demo usage tracking (session start/end, duration, user, flow) |
| **Guide** | In-app quick-reference guide with collapsible sections covering all admin features, security, and best practices |

### Statistics Dashboard
- Total Users, Admins, Active (logged in), Never Logged In counts
- CSV export of user list

## Demo Showcase

### Home Page
- Grid of AI demo cards with gradient backgrounds, icons, avatars, and capability badges
- "Coming Soon" badge support for disabled demos
- Responsive card layout

### Available Demos
| Demo | Industry | Description |
|------|----------|-------------|
| CogniCare | Healthcare | Patient support & appointment scheduling |
| CogniFinance | Finance | Banking & financial services |
| CogniSupport | IT Support | Technical support & troubleshooting |
| CogniInsure | Insurance | Claims & policy management |
| CogniHome | Home Services | Home maintenance & repair |
| Solara Airlines | Airlines | Flight booking & travel support |

### Flow Configuration
- Stored in the `flows` database table
- Client-side caching with 30-minute TTL via FlowContext
- Each flow defines: name, path, description, icon, color, gradient, avatar, WebRTC endpoint URL, capabilities, enabled/coming_soon flags, sort order

## WebRTC Voice Calling

Each demo page integrates WebRTC voice calling with Cognigy endpoints:

- **Call controls**: Start/end calls, mute/unmute, camera toggle
- **Connection quality**: Real-time status indicators
- **SIP message parsing**: Drives dynamic interface transitions (appointments, forms, confirmations, XApp overlays)
- **Agent avatar & status**: Visual feedback during active calls
- **Call duration timer**
- **Admin debug panel**: Shows SIP messages and WebRTC state (admin users only)
- **Demo session logging**: Tracks start/end times, duration, and metadata

## Edge Functions

All edge functions run on Deno and require admin authentication (JWT + role check):

| Function | Purpose |
|----------|---------|
| `admin-update-email` | Centralized admin operations: user CRUD, role management, password resets |
| `get-reset-link` | Generates recovery OTP tokens via Supabase Admin API |
| `send-reset-email` | Sends context-aware branded emails via Resend (welcome vs. reset) |
| `get-security-question` | Retrieves a user's security questions; optionally sends reset email directly for users without questions configured (migrated user fallback). Enforces rate limiting/lockout. |
| `set-security-question` | Stores hashed security question answers |
| `verify-security-answer` | Verifies security question answers with rate limiting (5 attempts / 15-min lockout) and sends branded recovery email on success |
| `send-invites` | Sends invitation emails |
| `api-proxy` | OData/CORS API proxy for external integrations |
| `safe-redirect` | Bot-safe redirect handler for recovery links |

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (display name, avatar, user type, security questions, force_password_reset, force_security_setup) |
| `user_roles` | Role assignments (admin, user, feedback-manager, user-manager, flow-manager) |
| `flows` | Demo flow configurations with Cognigy WebRTC endpoints |
| `access_requests` | Pending/approved/declined access requests |
| `feedback` | User feedback with ratings and status tracking |
| `demo_logs` | Demo usage tracking for analytics |
| `security_attempts` | Rate limiting tracker for security question verification (email, attempt count, lockout timestamp) |

All tables have Row-Level Security (RLS) policies enforcing appropriate access controls.

## Email System

Branded transactional emails are sent via **Resend** from `onboarding@resend.dev`:

- **Welcome emails** (new users): "Welcome aboard! 👋" — Set Your Password CTA
- **Reset emails** (existing users): "Password Reset 🔐" — Reset Password CTA
- Both use the NiCE COGNiGY branding: blue-to-purple gradient header, glassmorphism UI elements, branded logo from Supabase Storage
- Personalized greetings extracted from email prefix
- 1-hour token expiry with contextual guidance

## Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

Requires Node.js 18+ and npm. The app connects to the Lovable Cloud backend automatically via environment variables.
