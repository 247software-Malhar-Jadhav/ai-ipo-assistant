import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getMarketSnapshot } from "@/lib/market";

export const runtime = "nodejs";

const updateSchema = z.object({
  sentiment: z.enum(["BULLISH", "NEUTRAL", "CAUTIOUS", "BEARISH"]).optional(),
  niftyChangePct: z.number().optional(),
  sensexChangePct: z.number().optional(),
  indiaVix: z.number().optional(),
  recentListingAvgPct: z.number().optional(),
  note: z.string().max(400).optional(),
});

/** Public read of the current market snapshot. */
export async function GET() {
  return NextResponse.json(await getMarketSnapshot());
}

/**
 * Update the market snapshot (CRON_SECRET-protected). Send any subset of the
 * fields. Re-run ranking afterwards (POST /api/rank) to reflect the change.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const snapshot = await prisma.marketSnapshot.upsert({
    where: { id: "current" },
    create: { id: "current", ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ ok: true, snapshot });
}
