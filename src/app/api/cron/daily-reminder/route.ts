import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rankAndPersist } from "@/lib/ai/ranking";
import { buildReminderData, hasContent } from "@/lib/reminder";
import { isEmailConfigured, sendReminderEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Daily reminder job.
 *
 * Triggered by Vercel Cron every morning (see vercel.json). Vercel automatically
 * sends `Authorization: Bearer $CRON_SECRET`, which we verify here. It can also
 * be triggered manually with the same header.
 *
 * Steps: refresh stale AI rankings, then email every user a brief of live /
 * upcoming IPOs, best picks they haven't applied to, and their applied count.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Keep rankings fresh so the email reflects current data.
  const ranking = await rankAndPersist({ onlyStale: true });

  if (!isEmailConfigured()) {
    return NextResponse.json({
      ok: true,
      emailConfigured: false,
      message:
        "GMAIL_USER / GMAIL_APP_PASSWORD not set — skipped sending. Rankings refreshed.",
      ranking,
    });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });

  let sent = 0;
  let skipped = 0;
  const failures: { email: string; error: string }[] = [];

  for (const user of users) {
    try {
      const data = await buildReminderData(user);
      if (!hasContent(data)) {
        skipped++;
        continue;
      }
      await sendReminderEmail(user.email, data);
      sent++;
    } catch (err) {
      failures.push({
        email: user.email,
        error: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    emailConfigured: true,
    totalUsers: users.length,
    sent,
    skipped,
    failed: failures.length,
    failures,
    ranking,
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

// Allow manual triggering via POST too.
export async function POST(req: NextRequest) {
  return handle(req);
}
