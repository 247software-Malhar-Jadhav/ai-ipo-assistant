# 📈 AI IPO Assistant

> Discover, rank, and track Indian IPOs with AI — plus a daily email reminder of what's live, what's worth applying to, and what you've already applied for.

**Built with free tools — no paid services.** 💸 The entire stack (Next.js, Postgres, the Groq LLM, Gmail SMTP, and Vercel hosting/cron) runs on free tiers. No subscription required to run or deploy it.

> ⚠️ **Disclaimer:** This app ships with **sample data** and is intended for **research and educational purposes only**. Nothing here is investment advice. Do your own research before applying to any IPO.

---

## ✨ Features

- **IPO dashboard** with tabs — **All / Live / Upcoming / Best picks / Closed / Avoid** — plus a live search box.
- **AI conviction score (0–10)** with a label (`avoid` / `neutral` / `good` / `high conviction`) and a one-line reason for every IPO, derived from **GMP (grey market premium)**, **subscription**, **issue size**, **sector**, and **price band**.
- **Best picks** surfaces strong open IPOs; **Avoid** lists the weak ones.
- **Accounts** — sign up / log in. Logged-in users can mark IPOs as **"applied"** (persisted per user).
- **IPO detail pages** with the full metric breakdown and the AI verdict.
- **Daily 10 AM email** — live + upcoming IPOs, best picks to apply to, and which ones you've already applied for.

---

## 🧰 Tech stack

| Layer | Choice | Why | Cost |
|---|---|---|---|
| Framework | **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict) | Full-stack React with server components, API routes, and a great Vercel deploy story | Free |
| Styling | **Tailwind CSS v4** + shadcn-style tokens + hand-written UI primitives + **lucide-react** | Fast, consistent UI without a heavy component dependency | Free |
| Database | **PostgreSQL** via **Prisma ORM** | Type-safe queries; Docker (`pgvector/pgvector:pg16`) locally, Supabase/Neon free tier in prod | Free |
| AI ranking | **LangChain** + **Groq** (`llama-3.3-70b-versatile`) with structured output | Free, fast LLM; deterministic heuristic fallback when no key is set | Free |
| Auth | **JWT** (`jose`) in an httpOnly cookie + **bcryptjs** | Stateless, simple, no auth provider needed | Free |
| Email | **Nodemailer** over **Gmail SMTP** (App Password) | Send transactional email with no email-service signup | Free |
| Cron | **Vercel Cron** | Hits a protected route every morning to send reminder emails | Free |

---

## 🏗️ Architecture

### How AI ranking works

Each IPO carries market signals — **GMP** (grey market premium), **subscription** (× times), **issue size**, **sector**, and **price band**. The ranker turns those into a **conviction score (0–10)**, a **label** (`high_conviction` / `good` / `neutral` / `avoid`), and a **one-line reason**:

1. If `GROQ_API_KEY` is set, the app uses **LangChain + Groq** with **structured output** (`src/lib/ai/`) so the LLM returns a validated score, label, and reason.
2. If there's **no Groq key**, it falls back to a **deterministic heuristic** (`src/lib/ranking-utils.ts`) — so the app always works, even fully offline.

Results are **cached on each IPO row** (`aiScore`, `aiLabel`, `aiReason`, `aiRankedAt`) so pages render instantly. Re-rank any time with `npm run ai:rank` (CLI) or by calling `POST /api/rank` with the `CRON_SECRET` bearer token.

### How the daily email + cron works

- A protected route at **`/api/cron/daily-reminder`** builds the digest (live + upcoming IPOs, best picks, and the IPOs each user has applied to) and sends it via **Nodemailer / Gmail SMTP**.
- **`vercel.json`** defines a daily **Vercel Cron** that calls that route every morning. The route is protected by **`CRON_SECRET`** (sent as a `Bearer` token), so only the scheduler can trigger it.
- Vercel Cron runs in **UTC**, so **10:00 AM IST = 04:30 UTC**.

---

## 🚀 Quick start

> New to Next.js or LangChain? No problem — follow these steps in order.

### Prerequisites

- **Node.js 18+ (20+ recommended)**
- **Docker** (for the local Postgres database)
- *(Optional)* a free **Groq API key** — [console.groq.com/keys](https://console.groq.com/keys). Without it the app uses the heuristic ranker.

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Create your env file and fill in the values
cp .env.example .env
#    (the default DATABASE_URL already matches the local Docker Postgres)

# 3. Start the local Postgres database (Docker)
npm run docker:up

# 4. Create the database tables from the Prisma schema
npm run db:push

# 5. Seed sample IPO data
npm run db:seed

# 6. (Optional) populate AI scores/labels for the seeded IPOs
npm run ai:rank

# 7. Start the dev server
npm run dev
```

The app runs at **http://localhost:3000** 🎉

---

## 🔑 Environment variables

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | ✅ | Postgres connection string. Local Docker value: `postgresql://postgres:postgres@localhost:5432/ai_ipo?schema=public` |
| `JWT_SECRET` | ✅ | Long random string for signing auth tokens (min 16 chars) |
| `GROQ_API_KEY` | ⬜ | Free key from [console.groq.com/keys](https://console.groq.com/keys). Without it, a heuristic ranking fallback is used |
| `GROQ_MODEL` | ⬜ | LLM model — defaults to `llama-3.3-70b-versatile` |
| `GMAIL_USER` | ✅ (for email) | Gmail address used to send the reminder email |
| `GMAIL_APP_PASSWORD` | ✅ (for email) | Gmail **App Password** (NOT your account password; requires 2FA) — [generate here](https://myaccount.google.com/apppasswords) |
| `MAIL_FROM_NAME` | ⬜ | Display name for the sender (default `AI IPO Assistant`) |
| `CRON_SECRET` | ✅ | Random string; the scheduler sends it as a `Bearer` token to protect `/api/rank` and `/api/cron/daily-reminder` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL (e.g. `http://localhost:3000` locally, your Vercel domain in prod) |

---

## 📁 Project structure

```
ai-ipo-assistant/
├─ prisma/
│  ├─ schema.prisma           # User, Ipo, Application models
│  └─ seed.ts                 # Sample IPO data
├─ scripts/
│  └─ rank.ts                 # Re-rank CLI (npm run ai:rank)
├─ src/
│  ├─ app/                    # Next.js App Router
│  │  ├─ page.tsx             # Landing page (/)
│  │  ├─ dashboard/           # /dashboard
│  │  ├─ login/               # /login
│  │  ├─ signup/              # /signup
│  │  ├─ ipos/[id]/           # IPO detail page
│  │  └─ api/                 # API routes
│  │     ├─ auth/             # login, logout, me, signup
│  │     ├─ applications/     # mark IPO as applied
│  │     ├─ rank/             # POST to re-rank (CRON_SECRET protected)
│  │     └─ cron/
│  │        └─ daily-reminder # daily email route (CRON_SECRET protected)
│  ├─ components/
│  │  ├─ ui/                  # Button, Card, Input, Badge, Tabs, Label...
│  │  ├─ layout/              # Navbar + Footer
│  │  ├─ ipo/                 # IPO cards + dashboard client
│  │  └─ auth/                # Auth form
│  └─ lib/
│     ├─ db.ts                # Prisma client singleton
│     ├─ auth.ts              # JWT + bcrypt helpers
│     ├─ ipo-service.ts       # IPO queries / business logic
│     ├─ ranking-utils.ts     # Deterministic heuristic ranker (fallback)
│     ├─ validation.ts        # Zod schemas
│     ├─ ai/                  # LangChain + Groq ranking + prompts
│     ├─ email.ts             # Nodemailer transport
│     └─ reminder-email.ts    # Daily digest builder
├─ docker-compose.yml         # Local Postgres (pgvector/pgvector:pg16)
└─ vercel.json                # Daily cron → /api/cron/daily-reminder
```

---

## 📜 npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | `prisma generate && next build` (production build) |
| `npm run start` | Start the production server (after `build`) |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Create/update DB tables from the Prisma schema |
| `npm run db:seed` | Seed sample IPO data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:reset` | Force-reset the DB and re-seed |
| `npm run ai:rank` | Re-rank all IPOs and cache AI scores/labels |
| `npm run docker:up` | Start the local Postgres container |
| `npm run docker:down` | Stop the local Postgres container |

---

## 📧 Getting a Gmail App Password

Gmail won't let apps log in with your normal password. You need a 16-character **App Password**:

1. **Enable 2-Step Verification** on your Google account: [myaccount.google.com/security](https://myaccount.google.com/security).
2. Go to **[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)** and create a new App Password (name it e.g. "AI IPO Assistant").
3. Copy the generated 16-character password and paste it into **`GMAIL_APP_PASSWORD`** in your `.env` (remove the spaces). Set **`GMAIL_USER`** to the same Gmail address.

---

## ☁️ Deploying to Vercel

1. **Create a free Postgres database** on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy its connection string into **`DATABASE_URL`**.
   > 💡 For serverless (Vercel), use the **pooled / "Transaction"** connection string, not the direct one.
3. **Set all environment variables** (the table above) in your Vercel project settings.
4. **Push to GitHub**, then **import the repo into Vercel** ([vercel.com/new](https://vercel.com/new)).
5. **`vercel.json`** defines a **daily cron** that calls `/api/cron/daily-reminder` (protected by `CRON_SECRET`).
   > ⏰ Vercel Cron uses **UTC**, so **10:00 AM IST = 04:30 UTC**.
6. **After the first deploy**, populate the production database — run the seed/rank against the prod DB, **or** call `POST /api/rank` with the `CRON_SECRET` bearer token:
   ```bash
   curl -X POST https://your-app.vercel.app/api/rank \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

---

## 📄 License

MIT
