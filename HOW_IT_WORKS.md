# 📈 AI IPO Assistant — How It Works

A plain-English guide to the whole system: data, AI, scoring, auth, email and hosting.

**Stack:** Next.js 15 · LangChain + Groq (Llama 3.3 70B) · PostgreSQL + Prisma · JWT auth · Gmail daily reminder · 100% free.

AI IPO Assistant helps a retail investor decide **which IPO to apply to**. It lists every live and upcoming IPO, gives each one an **AI conviction score (0–10)** based on grey-market premium, subscription demand, company fundamentals and the current market mood, lets you track what you've applied to, and emails you a reminder every morning at 10 AM.

---

## 1. The big picture

Everything is one Next.js app (frontend + backend in the same project), talking to a Postgres database. The AI runs on the server, never in the browser, so the API key stays secret.

```
Browser (you)
   │  request a page
   ▼
Next.js server  ──reads/writes──►  PostgreSQL  (users, IPOs, applications, market mood)
   │                                    ▲
   │  needs AI scores                   │ caches scores back
   ▼                                    │
LangChain ──► Groq (Llama 3.3 70B) ─────┘   ← writes score + analyst note per IPO

Every morning 10 AM IST:
Vercel Cron ──► /api/cron/daily-reminder ──► refresh scores ──► email each user via Gmail
```

> **Key idea:** the AI doesn't run every time you open the page. Scores are **computed once and cached** in the database on each IPO row, so the dashboard is instant. They're refreshed on demand or by the daily job.

---

## 2. Where the data comes from

This is the most important thing to be clear about when someone asks.

### Today: curated sample data

The app ships with **13 realistic but fictional IPOs** (names, sectors, price bands, GMP, subscription, full financials) defined in `prisma/seed.ts` and loaded into the database with `npm run db:seed`. The market snapshot (Nifty/Sensex/VIX/sentiment) is seeded the same way. This makes the app **fully functional out of the box** with no external dependencies — perfect for a demo and for development.

Dates are relative to the seed date, so there are always some **Live**, **Upcoming** and **Closed** IPOs to see.

### How it becomes "real" data

The app reads IPOs through one service (`src/lib/ipo-service.ts`) — that's the single seam where a real source plugs in. To go live you'd either:

- Feed IPO data from a provider/API or a manual admin form into the same database table, or
- Add a scheduled job that fetches the day's IPOs (and GMP/subscription) and upserts them — exactly like the seed does.

Nothing else in the app changes: the AI, scoring, dashboard, and email all work the same whether the row was seeded or fetched.

> **Honest framing for anyone who asks:** "The data is currently sample data so the product is fully demonstrable end-to-end. The architecture is built so a live IPO feed drops into one place without touching the AI or UI." That's accurate and it's a strength, not a weakness.

---

## 3. How the AI works

The AI is **Groq** hosting **Meta's Llama 3.3 70B** model, called through **LangChain**. For each IPO the server does this:

1. **Build a prompt** with the IPO's facts — price band, GMP & implied listing gain %, subscription (incl. QIB/NII/Retail), financials, valuation, returns, strengths/risks, and the current market mood. (`src/lib/ai/prompts.ts`)
2. **Ask for structured output.** LangChain forces the model to return clean JSON matching a fixed schema: `score` (0–10), `label`, a one-line `reason`, and a 3–4 sentence `analysis`. No fragile text parsing. (`src/lib/ai/ranking.ts`)
3. **Validate & cache.** The result is checked against the schema (with Zod) and saved on the IPO row: `aiScore`, `aiLabel`, `aiReason`, `aiAnalysis`, `aiRankedAt`.

### When does ranking run?

- `npm run ai:rank` — manual, ranks all IPOs.
- `POST /api/rank` — protected endpoint (re-rank on demand).
- The **daily cron** refreshes any IPO whose score is more than 12 hours old before sending emails.

> **It never breaks if the AI is unavailable.** If the Groq key is missing or a call fails, the app falls back to a **deterministic heuristic** that computes the same score/label/note from the numbers (premium + subscription + fundamentals + market). The rest of the app behaves identically — it just uses math instead of the LLM.

---

## 4. Scoring & labels

The score is anchored on the **implied listing gain** (how much the grey-market premium suggests the stock could pop on listing), then adjusted for demand, fundamentals and the market.

| Implied listing gain (from GMP) | Score | Label |
| --- | --- | --- |
| ≥ 25% | 8 – 10 | High conviction |
| 15 – 25% | 6 – 8 | Good |
| 5 – 15% | 4 – 6 | Neutral |
| under 5% or negative | 0 – 4 | Avoid |

Adjustments on top of that anchor:

- **Demand** — strong subscription (esp. QIB) nudges up; weak/under-subscribed nudges down.
- **Fundamentals** — rich valuation vs peers, declining profit or high debt pull the score down; strong growth and returns push it up.
- **Market mood** — a bullish market lifts scores, a weak/volatile one drags them.

> **Why "Upcoming" IPOs still score well:** they haven't opened for bidding, so their subscription is 0. The system explicitly ignores subscription for upcoming IPOs and judges them on premium + fundamentals — otherwise every upcoming IPO would unfairly look weak.

*Heuristic formula (the fallback / pre-AI ranking):* premium % scaled so ~30% = 10, subscription scaled so ~30× = 10, combined 60/40; upcoming IPOs use premium only; then a market nudge of about +0.8 (bullish) to −1.6 (bearish).

---

## 5. Fundamental analysis

Each IPO detail page shows a full company read-out, and these numbers also feed the AI score and note. This is what makes the verdict defensible rather than just "GMP is high".

| Area | What's shown |
| --- | --- |
| **Financials** | Revenue & profit (latest vs previous year) with YoY growth, EBITDA margin. |
| **Valuation** | P/E vs the industry P/E (flags "premium to peers"), post-issue market cap. |
| **Returns & leverage** | Return on equity, return on capital, debt-to-equity (flags "leveraged"). |
| **Issue structure** | Fresh issue vs offer-for-sale, promoter holding before/after, registrar. |
| **Demand split** | QIB / NII / Retail subscription multiples. |
| **Qualitative** | Strengths, risks, and the "objects of the issue" (use of proceeds). |

---

## 6. Market mood — does the market affect IPOs?

Yes, strongly — IPO listing gains track the broad market. The app stores a single **market snapshot** (sentiment + Nifty/Sensex move + India VIX + recent listing-day average) and:

- Shows it as a **"Market mood" banner** on the dashboard.
- Feeds it into the AI, which **says how the current market affects each IPO** in its note (e.g. "the bullish, low-volatility backdrop supports the listing").
- Nudges every score up (bullish) or down (cautious/bearish).

It's updatable via `POST /api/market` (protected), and is the natural place to later plug a free live Nifty/VIX feed.

---

## 7. Login & security

- Email + password signup/login. Passwords are **hashed with bcrypt** — the plain password is never stored.
- On login the server issues a **JWT** (signed with a secret) stored in an **httpOnly cookie** — JavaScript can't read it, which protects against token theft. It lasts 7 days.
- Browsing IPOs is public; **writing** (marking applied) requires a valid session. Login errors are deliberately vague ("invalid email or password") so attackers can't tell which emails exist.

---

## 8. Applied tracking

When you press **"Mark as applied"**, the app saves a row in the `applications` table linking your user to that IPO. The dashboard and detail page read it back so your status persists across devices and sessions, and the daily email uses it to remind you only about IPOs you *haven't* applied to.

---

## 9. The daily 10 AM email

1. **Vercel Cron** calls `/api/cron/daily-reminder` at **04:30 UTC = 10:00 AM IST** (configured in `vercel.json`). The request carries a secret token so nobody else can trigger it.
2. **Refresh** any stale AI scores so the email is current.
3. **For each user**, build their brief: live IPOs, opening-soon IPOs, the best picks they haven't applied to, and how many they've already applied to.
4. **Send** a clean HTML email via **Gmail** (using a Gmail App Password). Users with nothing relevant open are skipped.

*Email is optional — if the Gmail credentials aren't set, the job still refreshes scores and simply skips sending.*

---

## 10. The database

PostgreSQL, accessed with Prisma (a type-safe ORM). Four tables:

| Table | What it holds |
| --- | --- |
| `users` | Account: email, name, bcrypt password hash. |
| `ipos` | Each IPO: market data, full fundamentals, and the cached AI score/label/reason/analysis. |
| `applications` | Which user applied to which IPO (one row per user+IPO). |
| `market_snapshot` | A single row holding the current market mood + index figures. |

Locally it runs in **Docker** (one command: `npm run docker:up`). In production it's a free cloud Postgres (Neon or Supabase). Same database engine, so behaviour is identical.

---

## 11. API reference

| Endpoint | Purpose | Protected? |
| --- | --- | --- |
| `POST /api/auth/signup` | Create account + start session | No |
| `POST /api/auth/login` | Log in | No |
| `POST /api/auth/logout` | Log out | No |
| `GET /api/auth/me` | Who am I? | Cookie |
| `GET·POST /api/applications` | List / toggle applied IPOs | Login |
| `POST /api/rank` | Re-rank IPOs with the AI | Secret |
| `GET·POST /api/market` | Read / update market mood | Read public, write secret |
| `GET·POST /api/cron/daily-reminder` | Send the daily emails | Secret |
| `GET /api/health` | Is the app + DB up? | No |

*"Secret" = requires the `CRON_SECRET` as a Bearer token, so only the scheduler (or you) can call it.*

---

## 12. What it costs: ₹0

| Piece | Service | Cost |
| --- | --- | --- |
| AI model | Groq · Llama 3.3 70B | Free tier (no card) |
| Hosting | Vercel | Free hobby tier |
| Database | Neon / Supabase | Free tier |
| Email | Gmail SMTP | Free (App Password) |
| Cron | Vercel Cron | Free (daily) |

---

## 13. Questions you might get asked

**Which AI does it use, and is it free?**
Groq running Meta's open Llama 3.3 70B model, called via LangChain. Groq's free tier needs no credit card and is fast (custom inference hardware). The daily limits are plenty for ranking a handful of IPOs once a day.

**Is the IPO data real / live?**
Right now it's curated **sample data** so the product is fully demonstrable end to end. The app reads IPOs through a single service, so a live feed or admin entry drops into one place without changing the AI, scoring or UI.

**How does it decide a score?**
It anchors on the implied listing gain (from grey-market premium), then adjusts for subscription demand, company fundamentals (valuation vs peers, growth, debt, returns) and the overall market mood. The AI writes a short note explaining the verdict; if the AI is unavailable, the same logic runs as a deterministic formula.

**Does the overall stock market affect the rankings?**
Yes. A "market mood" snapshot (sentiment + Nifty/Sensex/VIX) lifts scores in a bullish market and lowers them in a weak/volatile one, and the AI explicitly states how the current market affects each IPO's listing prospects.

**Is my password safe?**
Passwords are hashed with bcrypt and never stored in plain text. Sessions use a signed JWT in an httpOnly cookie that JavaScript can't read.

**What happens if Groq is down or rate-limited?**
Nothing breaks — the app automatically falls back to the heuristic ranker and keeps working. Scores are also cached, so a momentary outage doesn't affect browsing.

**How often do scores update?**
On demand (a button / endpoint or `npm run ai:rank`) and automatically each morning before the reminder email — the daily job re-ranks anything older than 12 hours.

**Is this investment advice?**
No. It's a research and education tool on sample data. Every page carries a disclaimer to verify with the official RHP and SEBI filings before applying.

**Why Next.js + Postgres + this stack?**
Next.js keeps frontend and backend in one codebase and deploys to Vercel in one click. Postgres + Prisma give reliable, type-safe storage. Everything chosen is free and production-grade.

---

*AI IPO Assistant — for research and education only, not investment advice.*
