# 🚀 Deployment Guide

How to deploy AI IPO Assistant to **Vercel** with a **Neon** Postgres database. Everything is free.

---

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (and locally in `.env`).

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string. Use the **pooled** Neon string in production. | `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | ✅ | Secret for signing auth cookies. Generate: `openssl rand -base64 48` | `<random 48-byte base64>` |
| `GROQ_API_KEY` | ✅ | AI model key (Groq / Llama 3.3). Free at console.groq.com/keys | `gsk_...` |
| `GROQ_MODEL` | ➖ | Ranking model. | `llama-3.3-70b-versatile` |
| `CRON_SECRET` | ✅ | Bearer token protecting `/api/cron/*`, `/api/ingest`, `/api/rank`, `/api/market`. Generate: `openssl rand -base64 32` | `<random 32-byte base64>` |
| `IPOGURU_API_KEY` | ➖ | Real-time IPO data API key (free, email `ipoguru.in [at] gmail.com`). If blank, the app AI-scrapes ipoguru.in. | `` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL (used in emails). | `https://ai-ipo-assistant.vercel.app` |
| `GMAIL_USER` | ➖ | Gmail address that sends the daily email. | `you@gmail.com` |
| `GMAIL_APP_PASSWORD` | ➖ | Gmail **App Password** (needs 2FA). Blank = email disabled. | `` |
| `MAIL_FROM_NAME` | ➖ | Sender display name. | `AI IPO Assistant` |

> `NEXT_PUBLIC_*` is exposed to the browser — keep everything else server-only (they are, by default).

---

## One-time setup

### 1. Database (Neon)
1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **connection string**. You get two flavours:
   - **Pooled** (`...-pooler...`) → use for `DATABASE_URL` (serverless runtime).
   - **Direct** (no `-pooler`) → use for schema push / migrations.
3. Create the tables (run once, from your machine, against the **direct** URL):
   ```bash
   DATABASE_URL="<direct-neon-url>" npx prisma db push
   ```
4. Load live IPO data (uses the IPO Guru API if `IPOGURU_API_KEY` is set, else AI-scrapes):
   ```bash
   DATABASE_URL="<direct-neon-url>" npm run ingest
   ```

> Tip: drop `&channel_binding=require` from the Neon URL — Prisma's engine doesn't parse it.

### 2. Deploy (Vercel)
**CLI:**
```bash
npm i -g vercel
vercel link           # link to your account/project
vercel env add ...    # add each variable above (or paste in the dashboard)
vercel --prod
```
**or Dashboard:** import the GitHub repo at [vercel.com/new](https://vercel.com/new), add the env vars, deploy.

3. After the first deploy, set `NEXT_PUBLIC_APP_URL` to the real domain and redeploy.

---

## Cron (daily reminder + data refresh)

`vercel.json` registers a cron at **04:30 UTC = 10:00 AM IST**:

```json
{ "crons": [{ "path": "/api/cron/daily-reminder", "schedule": "30 4 * * *" }] }
```

Vercel automatically calls it with `Authorization: Bearer $CRON_SECRET`. The job **ingests fresh IPOs → re-ranks → emails** opted-in users. (Vercel Hobby cron runs once daily — perfect here.)

To refresh data manually any time:
```bash
curl -X POST https://<your-domain>/api/ingest -H "Authorization: Bearer <CRON_SECRET>"
```

---

## Health check

```bash
curl https://<your-domain>/api/health
# { "status":"ok", "db":"up", "aiRanking":"groq", "email":"configured|not-configured" }
```

---

## Notes

- **Build command** is `prisma generate && next build` (in `package.json`). Vercel runs it automatically.
- Schema changes: re-run `prisma db push` against the direct URL.
- Groq free tier is ~12k tokens/min; if ranking hits the limit, the app falls back to the deterministic heuristic automatically.
