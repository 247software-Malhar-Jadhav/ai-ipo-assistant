# 🌩️ Serverless, Explained (for this project)

A plain-English guide to how AI IPO Assistant runs on **Vercel** — what "serverless" means, why it changed some of our design decisions, and how a request actually flows. No prior cloud knowledge assumed.

---

## 1. The one-sentence idea

> **Serverless** = you don't run or manage a server. You upload your code, and the platform (Vercel) runs little pieces of it **on demand**, only when a request comes in, and shuts them down right after.

You still use servers — you just never see, rent, or babysit them. You pay (or stay on the free tier) **per request**, not per hour of an always-on machine.

---

## 2. Traditional server vs serverless

**Traditional (what you might picture):**
You rent a machine. A Node process runs 24/7 (`node server.js`). It holds things in memory, keeps the database connection open, and waits for requests. You patch it, scale it, restart it when it crashes.

```
[Always-on server] ⟵ requests ⟵ users
   (your process runs forever, holds state in RAM)
```

**Serverless (what we use):**
There's no always-on process. Each request **wakes up** a fresh, short-lived function, which runs your code, returns a response, and is then **frozen or thrown away**.

```
request → [function boots] → runs → responds → [frozen/destroyed]
request → [a NEW function boots] → runs → responds → [gone]
```

Vercel creates as many of these as needed (1 user or 10,000), and you don't manage any of it.

---

## 3. How our Next.js app maps to serverless

When we deploy, Vercel splits the app into pieces:

| Part of our app | Becomes… |
| --- | --- |
| Static stuff (CSS, the landing page shell, icons) | Files on a global **CDN** (super fast, cached worldwide) |
| Each API route (`/api/auth/login`, `/api/ingest`, …) | A **serverless function** |
| Each dynamic page (`/dashboard`, `/ipos/[id]`) | Rendered by a serverless function on each request |
| The daily email (`/api/cron/daily-reminder`) | A function **triggered on a schedule** (Vercel Cron) |

So "the backend" isn't one running program — it's a **collection of functions** that only exist for the moment they're handling a request.

---

## 4. The big consequence: functions are *stateless & ephemeral*

Because each function is short-lived and thrown away, **it cannot remember anything between requests**, and its filesystem is **read-only** (except a temporary `/tmp`).

This drove three design decisions in this project:

1. **Why we need a cloud database (Neon), not Docker.**
   Your local Docker Postgres lives on *your laptop* — Vercel's functions run in a data centre and can't reach it. And we can't keep IPOs "in memory" because the next request runs on a different, fresh function that has no memory of the last one. So **all state lives in an external database** (Neon) that every function connects to. The database is the shared, permanent memory.

2. **Why AI scores are cached in the database.**
   We don't ask the LLM to rank IPOs on every page load — a function can't hold that result for the next request. Instead we compute scores once and **store them on the IPO row** in Neon. Any function rendering the dashboard just reads the cached value. Fast and cheap.

3. **Why data refresh is a scheduled job, not a background worker.**
   There's no always-on process to "keep fetching IPOs in the background." Instead, **Vercel Cron** wakes a function once a day to ingest fresh data. (More on cron below.)

> 📌 This is the exact reason a naive "store it in a variable / in-memory cache" approach breaks on serverless — that variable disappears the moment the function freezes.

---

## 5. Cold starts (why the first hit can be slow)

When a function hasn't run recently, there's no warm instance ready, so Vercel has to **boot one up** — load your code, start the runtime, connect to the DB. That first request is a **cold start** (a few hundred ms to a second or two). Follow-up requests reuse the warm instance and are fast, until it goes idle again and is frozen.

For our app this is fine: a tiny delay on the first dashboard load, instant after.

---

## 6. Database connections & "pooling" (why we used the *pooled* Neon URL)

Here's a subtle serverless gotcha. A traditional server opens **one** database connection and reuses it forever. But serverless can spin up **hundreds of function instances at once**, each wanting its own connection — and Postgres has a hard limit (often ~100). You'd exhaust it instantly.

The fix is a **connection pooler** (Neon provides one, "PgBouncer"). It sits between the functions and the database and multiplexes many short-lived function connections over a small, shared set of real database connections.

That's why in deployment we use the **pooled** Neon string (the one with `-pooler` in the host) for the app, and the **direct** string only for one-off schema changes (`prisma db push`), which a pooler doesn't handle well.

```
many functions ─┐
many functions ─┼─► [Neon pooler] ─► a few real Postgres connections
many functions ─┘
```

---

## 7. Cron in a world with no always-on process

We want an email every morning at 10 AM IST. But there's no server sitting there watching the clock. Solution: **Vercel Cron**. We declare a schedule in `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/daily-reminder", "schedule": "30 4 * * *" }] }
```

Vercel's platform watches the clock for us and, at `04:30 UTC` (= `10:00 IST`), it **calls our function** like a normal HTTP request (with a secret header so only it can). The function ingests fresh IPOs, re-ranks, and emails users — then disappears again.

---

## 8. Environment variables = configuration injected at runtime

Our code never hard-codes secrets (DB URL, Groq key, JWT secret). Those live as **environment variables** set in Vercel. At deploy/run time, Vercel injects them into the functions via `process.env`. This keeps secrets out of the (public) GitHub repo and lets the *same* code run locally (reading `.env`) and in production (reading Vercel's settings) with different values.

---

## 9. Limits to respect (and how we did)

| Serverless limit | What it means | How this app handles it |
| --- | --- | --- |
| **Execution timeout** (we set `maxDuration = 60s`) | A function can't run forever | Ranking/ingest are quick; heavy growth would move to batching |
| **Read-only filesystem** | Can't write files (except `/tmp`) | All state goes to Neon, nothing written to disk |
| **Stateless** | No memory between requests | DB is the single source of truth; AI results cached |
| **Cold starts** | First request slower | Acceptable; static assets are CDN-cached and instant |
| **LLM rate limits** (Groq free: ~12k tokens/min) | The model can 429 under burst | Automatic fallback to the deterministic heuristic ranker |

---

## 10. A real request, start to finish

**You open `/dashboard`:**
1. Vercel routes it to a serverless function (boots one if none is warm — *cold start*).
2. The function reads your session cookie, opens a **pooled** connection to **Neon**, and queries the IPOs (with their **cached** AI scores) + your applied list.
3. It renders the HTML and returns it.
4. The function is **frozen**. It remembers nothing. The next visitor gets a fresh one — which reads the same data from Neon.

**Every night at 10 AM IST:**
1. Vercel Cron calls `/api/cron/daily-reminder`.
2. That function ingests new IPOs from ipoguru.in, re-ranks, emails opted-in users, and exits.

Nothing runs in between. That's serverless: **code that exists only while it's working.**

---

## 11. Why this is great for a project like ours

- **Free at our scale** — no idle server to pay for; the free tier covers it.
- **Auto-scaling** — 1 user or 10,000, Vercel spins up what's needed.
- **No ops** — no servers to patch, restart, or monitor.
- **One deploy** — `git push` → Vercel rebuilds and ships.

The trade-off is the discipline it forces: **keep state in the database, cache expensive work, and never assume a function remembers the last request.** This app is built exactly that way.

---

## Glossary

- **Serverless function** — a small piece of backend code that runs per-request and is then frozen/destroyed.
- **Cold start** — the startup delay when no warm function instance exists.
- **Stateless** — keeps no memory between requests.
- **CDN** — a global cache for static files, served from a location near the user.
- **Connection pooler** — multiplexes many app connections onto a few real DB connections.
- **Cron** — a scheduled trigger that runs a function at set times.
- **Environment variable** — configuration/secret injected at runtime, not stored in code.
