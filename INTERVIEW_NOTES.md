# 🎤 AI IPO Assistant — Interview Notes

Talking points and Q&A to confidently present this project. Pair it with `HOW_IT_WORKS.md` for the deep detail.

---

## The 30-second pitch

> "It's a full-stack AI app that helps retail investors decide which IPO to apply to. It lists live and upcoming IPOs, and an LLM scores each one 0–10 with a short analyst note based on grey-market premium, subscription demand, company fundamentals and the overall market mood. Users can sign up, mark IPOs they've applied to, and get a reminder email every morning at 10. It's built on Next.js with LangChain + Groq for the AI, Postgres for data, and it's deployed on Vercel — entirely on free tools."

## The 2-minute version (architecture)

> "It's a single Next.js 15 app — frontend and API routes in the same codebase. Data lives in Postgres, accessed through Prisma. The AI runs server-side: for each IPO I build a prompt with its facts and fundamentals, send it to Groq's Llama 3.3 70B through LangChain, and force a structured JSON response — a score, a label, and a reason. I cache that result on the IPO row so the dashboard is instant and I'm not calling the model on every request. Auth is JWT in an httpOnly cookie with bcrypt-hashed passwords. The daily email is a Vercel cron job that refreshes the scores and sends each user a personalised brief through Gmail. If the AI is ever down, a deterministic heuristic produces the same shape of output so nothing breaks."

---

## Technical deep-dive Q&A

**Q: Why Next.js instead of separate frontend + backend?**
One codebase, one deploy. App Router gives me server components (so I can query the DB directly in a page without a separate API layer) plus API routes for the things that need them. It deploys to Vercel with zero config and streams well. With 4 years of React, the learning curve was mostly the server/client component model.

**Q: Why Groq and Llama 3.3 instead of OpenAI?**
Cost and speed. Groq's free tier needs no credit card and runs on custom inference hardware so it's very fast. Llama 3.3 70B is more than capable for a constrained scoring/summarisation task. And because I went through LangChain, swapping providers later is a config change, not a rewrite.

**Q: How do you get reliable structured output from an LLM?**
LangChain's `withStructuredOutput` with a Zod schema. The model is constrained to return JSON matching `{score, label, reason, analysis}`, and I validate it with Zod before persisting. That removes brittle string parsing and gives me a typed object. If parsing/validation fails, I fall back to the heuristic.

**Q: Why cache the AI output instead of calling it live?**
Three reasons: latency (the dashboard renders instantly), cost/rate-limits (I rank ~13 IPOs once, not on every page view), and resilience (a momentary AI outage doesn't affect browsing). Scores are recomputed on demand and by the daily job, which re-ranks anything older than 12 hours.

**Q: What's the fallback strategy if the AI fails?**
A deterministic heuristic that produces the exact same output shape from the raw numbers — premium %, subscription, fundamentals, market nudge. So the app is fully functional even with no API key. This also made development fast: I built and tested the whole app before wiring the real key.

**Q: How does the scoring actually work?**
It anchors on the implied listing gain from the grey-market premium (≈25%+ → high conviction, down to negative → avoid), then nudges for subscription demand, valuation vs industry P/E, growth/debt, and market sentiment. One subtlety I had to fix: upcoming IPOs have zero subscription because bidding hasn't opened, so I explicitly tell the model (and the heuristic) to judge those on premium and fundamentals only — otherwise every upcoming IPO looked artificially weak.

**Q: How is authentication handled? Is it secure?**
Email/password. Passwords are bcrypt-hashed. On login I sign a JWT (using `jose`) and store it in an httpOnly, SameSite cookie so client JS can't read it. Login responses are intentionally generic to avoid user enumeration. I enforce auth in server components and route handlers rather than edge middleware — simpler and it avoids edge-runtime crypto pitfalls.

**Q: How does the daily email / cron work?**
`vercel.json` defines a cron that hits `/api/cron/daily-reminder` at 04:30 UTC (10 AM IST). Vercel signs the request with a secret bearer token that I verify, so the endpoint can't be triggered by anyone. The job refreshes stale scores, builds a per-user brief (live + upcoming IPOs, best unapplied picks, applied count) and sends HTML email via Gmail SMTP with an app password.

**Q: Why Prisma + Postgres?**
Type-safe queries that match my TypeScript types, easy migrations (`db push`), and a clean model layer. Postgres because it's the standard, runs in Docker locally and on free tiers (Neon/Supabase) in prod — identical engine in both, so no surprises.

**Q: Where does the data come from?**
Right now it's curated sample data, seeded into Postgres, so the product is fully demonstrable end to end. Importantly, all reads go through one service, so a live IPO feed (an API or a fetch job) plugs into a single place without touching the AI, scoring or UI. I treated that as a deliberate boundary.

**Q: Is this a RAG app?**
No, and that's a deliberate point. RAG is for answering questions over unstructured documents. This is structured-data reasoning — the model receives clean numeric facts and returns a judgement, so embeddings/vector search would be over-engineering. I did keep the door open (the local DB uses a pgvector-capable image) in case I add semantic IPO search later.

---

## Trade-offs & decisions I can defend

| Decision | Why | Trade-off |
| --- | --- | --- |
| Cache AI scores in the DB | Speed, cost, resilience | Scores can be slightly stale → mitigated by the 12h refresh |
| Heuristic fallback | App works with no key; testable | Two code paths to keep in sync (same output schema) |
| Sample data, one service seam | Fully demoable; clean integration point | Not live yet — but isolated to one file |
| Server-side auth, no edge middleware | Simpler, avoids edge crypto issues | Dashboard isn't globally cached (fine for this app) |
| Free stack end-to-end | Zero cost, real production services | Free-tier limits (acceptable at this scale) |

## Challenges I solved

- **LLM penalising upcoming IPOs** for zero subscription → fixed by encoding domain knowledge (upcoming = no bidding yet) into the prompt and heuristic.
- **Inconsistent LLM scoring** → added explicit score anchors per premium band and forced structured output, which made results stable and explainable.
- **Serverless + local model don't mix** (an earlier idea) → moved AI to a hosted API so it works on Vercel's read-only filesystem, and made the DB the source of truth instead of in-memory state.

## If I had more time / how I'd scale it

- Plug in a **live IPO + GMP feed** behind the existing service.
- A **live market data** source (Nifty/VIX) to auto-update the market mood.
- **Caching/queue** for ranking at higher volume; batch the LLM calls.
- **Allotment tracking** and broker integrations.
- Rate-limiting on auth endpoints, and observability (structured logs, error tracking).

## What I learned

Coming from React, I learned the Next.js server/client component model, server-side data fetching, and how to integrate an LLM responsibly — structured output, validation, caching, and always having a deterministic fallback so AI is an enhancement, not a single point of failure.

---

## One-liners to keep handy

- **AI:** Groq + Llama 3.3 70B via LangChain, structured JSON output, cached, with a heuristic fallback.
- **Why it won't break:** scores are cached and there's a non-AI fallback path.
- **Data:** sample data today, one clean seam to go live.
- **Security:** bcrypt + JWT in httpOnly cookie, secret-protected internal endpoints.
- **Cost:** ₹0 — Groq, Vercel, Neon/Supabase, Gmail all on free tiers.
- **Not investment advice** — research/education tool with disclaimers.
