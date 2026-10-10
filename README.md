# ⚡ DropBrief

> **Zero-friction client asset & brief collection portal for freelancers, web designers, and creative agencies.**  
> Stop chasing clients across endless email threads and broken Google Drive permissions. Give them a private, no-login portal to drop everything you need to start work.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-usedropbrief.xyz-4f46e5?style=for-the-badge&logo=vercel&logoColor=white)](https://usedropbrief.xyz)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%26%20Storage-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Resend](https://img.shields.io/badge/Resend-Transactional%20Email-000000?style=for-the-badge&logo=resend&logoColor=white)](https://resend.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 💡 The Problem & The Solution

Every creative service business faces the same bottleneck: **client onboarding and asset collection**.
- ❌ Clients send partial files over WhatsApp, email chains, and expired WeTransfer links.
- ❌ Google Drive / Dropbox requires sign-ins, requests permissions, or confuses non-technical clients.
- ❌ Freelancers spend hours manually following up, tracking checklist items, and delaying project kickoffs.

### 🌟 How DropBrief Solves This:
DropBrief generates a **frictionless, dedicated client portal** via a secure direct link (`?p=project-slug`).
- 🚀 **Zero Login Barriers:** Clients don't need an account or password.
- 📂 **Structured Checklist:** Drag-and-drop file uploaders with file-type validations and auto-saving text fields.
- ⚡ **Realtime Feedback:** Live progress bar, instant updates, and celebration confetti once 100% completed.
- 📬 **One-Click Reminders:** Polite transactional follow-up emails sent via Resend API with customized copy and missing asset summaries.

---

## ✨ Features

### 1. 🎯 Frictionless Client Portal
- **Zero Registration:** Clients simply open their unique link (`https://usedropbrief.xyz/?p=client-slug`) on mobile or desktop.
- **Drag & Drop Uploads:** Upload files directly to secure Supabase cloud storage (`client-uploads` bucket) with instant size & type checks.
- **Auto-Saving Text Areas:** Brief questionnaires, credentials, and notes auto-save with debounce as the client types.
- **Milestone Celebration:** Triggers confetti (`canvas-confetti`) when all required checklist items are complete.

### 2. 📊 Freelancer Mission Control
- **Quick Metrics:** Active client projects, pending checklist items, completed briefs, and estimated hours saved.
- **Real-Time Project Cards:** Dynamic progress indicators synced via Supabase WebSockets.
- **Instant Sharing:** One-click client link copy to clipboard.
- **Asset Access:** View, download, or review any submitted asset directly from the dashboard.
- **Lightweight Auth:** Secure Nickname + 6-digit PIN authentication (hashed using SHA-256 client-side) with offline demo fallback.

### 3. 📬 Transactional Email Reminders (Resend API)
- **Built-in Serverless Function:** Production-ready endpoint at `/api/send-reminder` running on Vercel Serverless (with Vite dev server middleware for local testing).
- **Personalized & Card Templates:** Choose between an authentic personal email format or a modern structured card design.
- **Automated Asset Breakdown:** Automatically itemizes exactly which items remain incomplete.
- **Deliverability-First:** Clean RFC-compliant headers, `List-Unsubscribe` support, and custom domain authentication (e.g., via Namecheap + Resend).

### 4. 📋 Pre-Built Industry Templates (1-Click)
- 🌐 **Web Design & Development:** Vector logos (SVG/AI), homepage copy, team/product photos, hosting & domain credentials.
- 🎨 **Logo & Visual Identity:** Brand name, slogan guidelines, inspirational moodboards, color palette preferences.
- 📊 **Accounting & Tax Filing:** Bank statements (PDF/CSV), issued sales invoices, expense receipts.
- 📱 **Social Media Management:** Monthly promotion priorities, raw video reels, photos, offer updates.
- ✏️ **Custom Projects:** Create tailored checklists with custom file types and text requirements on the fly.

### 5. 🛡️ GDPR & European Data Privacy
- **EU Hosted:** Supabase database and storage hosted in the European Union (Ireland / Frankfurt).
- **Security Disclosures:** Built-in Terms of Service, Data Processor disclosures, and safe asset handling policies.

---

## 🏗️ Architecture & Technology Stack

```
[ Client / Freelancer Browser ]
               │
               ▼
   [ Vercel Edge / CDN ]  ── Vite 6 Single Page Application (React 18)
               │
       ┌───────┴────────────────────────┐
       ▼                                ▼
[ Supabase EU Cloud ]         [ Vercel Serverless Function ]
 ├── Postgres Database             └── /api/send-reminder
 ├── Storage: 'client-uploads'                  │
 └── Realtime WebSockets                        ▼
                                      [ Resend Transactional API ]
                                       ├── Personalized Reminders
                                       └── Verified Domain SMTP
```

### Free-Tier Operating Stack ($0 / month)

| Service | Tier | Usage Limit | Cost |
| :--- | :--- | :--- | :--- |
| **Vercel** | Hobby | Fast Global CDN, automated Git builds & serverless functions | **$0** / mo |
| **Supabase** | Free Tier | 500 MB PostgreSQL DB, 1 GB Cloud Storage, Realtime WebSockets | **$0** / mo |
| **Resend** | Free Tier | 3,000 transactional emails/month, custom domain verification | **$0** / mo |
| **Total** | | **Complete Production Micro-SaaS Stack** | **$0** / mo |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js `18.x` or later
- npm `9.x` or later

### 1. Clone the repository
```bash
git clone https://github.com/Ron-SVKbc/dropbrief.git
cd dropbrief
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the example environment configuration:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase and Resend credentials:
```env
# Supabase Configuration (from Supabase Dashboard -> Project Settings -> API)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Resend API Key (from https://resend.com/api-keys)
RESEND_API_KEY=re_123456789abcdef

# Verified sender address or domain (optional for test mode, recommended for production)
RESEND_FROM_EMAIL=notifications@yourdomain.com
```

> **Note:** If Supabase environment variables are omitted, DropBrief automatically operates in **offline demo mode** using local state and `localStorage`.

### 4. Run the development server
```bash
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🗄️ Database & Storage Setup (Supabase)

If setting up your own Supabase project:

1. Create a free project at [supabase.com](https://supabase.com) (select EU Frankfurt or Ireland region).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open [`supabase_schema.sql`](file:///c:/Users/Marko/Desktop/SplitAI/supabase_schema.sql) from this repository, copy its contents, and execute the script.
4. The script automatically creates:
   - `public.freelancers` (User accounts with SHA-256 PIN validation)
   - `public.projects` (Project definitions, client information, deadlines)
   - `public.project_items` (Checklist items, types, completion states, values)
   - `storage.buckets`: `client-uploads` public bucket for client files
   - Row Level Security (RLS) policies for anonymous uploads and client access

---

## 📧 Transactional Email Setup (Resend)

DropBrief uses [Resend](https://resend.com) to trigger reminder emails to clients.

1. Sign up for a free account at [resend.com](https://resend.com).
2. Generate an API Key under **API Keys** and set it as `RESEND_API_KEY`.
3. *(Recommended)* Add and verify your custom domain in Resend (**Domains** tab) by adding DNS TXT & MX records in your registrar (e.g., Namecheap, Cloudflare, GoDaddy).
4. Set `RESEND_FROM_EMAIL=reminders@yourdomain.com` in your environment. Emails will arrive directly in the client's inbox from:
   ```
   [Freelancer Name] via DropBrief <reminders@yourdomain.com>
   ```

---

## 🌐 Production Deployment (Vercel)

Deploying to Vercel takes under 2 minutes:

1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and import the GitHub repository.
3. In **Settings -> Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (or `RESEND_FROM`)
4. Click **Deploy**. Vercel will build the Vite bundle and deploy the serverless reminder API.
5. All future pushes to the `main` branch will automatically trigger production builds and deployments.

---

## 📂 Project Structure

```
DropBrief/
├── api/
│   └── send-reminder.js       # Vercel Serverless Function for Resend transactional email
├── src/
│   ├── components/
│   │   ├── AuthModal.jsx          # Freelancer PIN registration & sign-in modal
│   │   ├── ClientPortal.jsx       # Zero-friction client checklist & upload zone
│   │   ├── CreateProjectModal.jsx # New brief wizard with template selection
│   │   ├── Dashboard.jsx          # Freelancer mission control & project metrics
│   │   ├── EmailPreviewModal.jsx  # Interactive email reminder preview & sender
│   │   ├── LegalModal.jsx         # GDPR compliance & Terms of Service dialog
│   │   ├── Navbar.jsx             # Global navigation bar & quick actions
│   │   ├── ToastContainer.jsx     # Modern floating notifications
│   │   └── WelcomeView.jsx        # Landing presentation for unauthenticated visitors
│   ├── context/
│   │   └── AppContext.jsx         # Central state, Supabase sync, WebSockets & fallback
│   ├── data/
│   │   └── templates.js           # Industry-specific brief checklist templates
│   ├── lib/
│   │   └── supabase.js            # Supabase client initialization & file uploader
│   ├── App.jsx                    # Root layout & client URL routing (?p=slug)
│   ├── index.css                  # Custom design system (Dark mode & glassmorphism)
│   └── main.jsx                   # React 18 DOM mount point
├── .env.example                   # Environment variable blueprint
├── supabase_schema.sql            # Complete database schema, RLS, and storage rules
├── vite.config.js                 # Vite 6 config with local reminder API middleware
└── package.json                   # Project scripts and dependencies
```

---

## 🔒 Security & Privacy

- **Client Zero-Friction:** Clients never need passwords or accounts, eliminating leaked client credentials.
- **PIN Hashing:** Freelancer PINs are hashed using client-side SHA-256 before interacting with Supabase; plain-text PINs are never saved.
- **Sanitized Email Headers:** All email templates and reminder endpoints sanitize headers against header injection attacks.
- **Secure File Storage:** Uploads are stored in an isolated Supabase Storage bucket with unique path naming to prevent collisions.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
