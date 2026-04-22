# Cognigy Demo Hub - Setup Guide

A private, self-hosted version of the NiCE Cognigy AI Specialist Hub.
Auth, user management, flow config, and demo analytics — all DB-driven.

## Stack

- **Frontend**: React 18 + Vite + Tailwind + shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions)
- **Voice**: Cognigy WebRTC via `webRTCWidget.js`
- **Hosting**: Vercel (recommended for frontend), Supabase handles everything else

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (free account works)
2. Click **New Project**
3. Give it a name (e.g., `cognigy-demo-hub`), set a database password, pick a region (US East is closest to Cognigy's trial endpoint)
4. Once created, go to **Project Settings > API** and copy:
   - **Project URL** (e.g., `https://xxxx.supabase.co`)
   - **anon / public key**
   - **service_role key** (keep this secret)

---

## 2. Run the Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Open `public/schema-export.sql` from this repo
3. Paste the entire contents and click **Run**

This creates all tables: `flows`, `profiles`, `user_roles`, `demo_logs`, `feedback`, `access_requests`, `security_attempts`.

---

## 3. Configure Environment Variables

```sh
cp .env.example .env
```

Fill in `.env`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

---

## 4. Create Your First Admin User

1. In Supabase Dashboard, go to **Authentication > Users > Add User**
2. Enter your email + a temporary password
3. Go to **Table Editor > user_roles** and insert a row:
   - `user_id`: paste the UUID from the user you just created
   - `role`: `admin`
4. Also insert a row in **profiles**:
   - `user_id`: same UUID
   - `display_name`: your name
   - `force_security_setup`: `false` (skip the security question gate for your first login)

---

## 5. Run Locally

```sh
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Log in with the admin account you created.

---

## 6. Add Demos via Admin Panel

Once logged in as admin, go to **Admin > Flow Manager** to:
- See all flows in the DB
- Enable/disable demos
- Edit flow names, descriptions, icon, color, gradient, avatar, webrtc_url, and capabilities
- Reorder demos on the home page

Or use `scripts/register-demo.js` to push a demo automatically from the build pipeline.

---

## 7. Register a New Demo (Automated)

After running `node build-*.js` in the Cognigy package generator, a `*-site-spec.json` file is written alongside the ZIP. Once you've deployed the Cognigy endpoint and have the WebRTC URL, run:

```sh
node scripts/register-demo.js ../my-demo-site-spec.json --webrtc-url https://endpoint-trial-us.cognigy.ai/abc123...
```

This upserts a row into the `flows` table. The demo appears on the hub home page immediately.

---

## 8. Deploy to Vercel (Recommended)

Vercel is the easiest host for a Vite/React app with no server-side code.

```sh
npm install -g vercel
vercel login
vercel --prod
```

During setup:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Add environment variables in the Vercel dashboard (Project Settings > Environment Variables):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The `SUPABASE_SERVICE_KEY` is only used by `scripts/register-demo.js` locally - never add it to Vercel.

---

## 9. Deploy to Railway (Alternative)

Railway can serve static files too.

1. Create a new project at [railway.app](https://railway.app)
2. Connect this repo (or deploy from a local directory)
3. Set build command: `npm run build`
4. Set start command: `npx serve dist`
5. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 10. Add a Custom Avatar Image

Each flow can have an avatar PNG. Upload avatar images to **Supabase Storage** or any public CDN and set the `avatar` field in the flow row to the full URL.

Avatar filename convention: `{company-slug}-avatar.png`

---

## Edge Functions (Optional - for Email Features)

The full email system (welcome emails, password reset emails via Resend) requires Supabase Edge Functions. These are located in `supabase/functions/`. To deploy:

```sh
npm install -g supabase
supabase login
supabase functions deploy --project-ref your-project-ref
```

For basic demo use, you can skip edge functions and manage users manually via the Supabase dashboard.

---

## Adding a New Demo - End-to-End Workflow

1. Build the Cognigy package:
   ```sh
   node build-clientname.js
   ```
   This outputs `clientname.zip` (import to Cognigy) and `clientname-site-spec.json`.

2. Import the ZIP to Cognigy.AI and deploy the voice endpoint. Copy the endpoint token from the WebRTC endpoint URL.

3. Register the demo in the hub:
   ```sh
   cd demo-hub
   node scripts/register-demo.js ../clientname-site-spec.json --webrtc-url https://endpoint-trial-us.cognigy.ai/TOKEN
   ```

4. (Optional) Upload an avatar PNG to Supabase Storage or any CDN, then update the `avatar` field via Admin > Flow Manager.

5. The demo is live at `https://your-hub-url.com/clientname`.
