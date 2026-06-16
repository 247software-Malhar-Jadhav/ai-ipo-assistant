import { NextRequest, NextResponse } from "next/server";
import { rankAndPersist } from "@/lib/ai/ranking";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Re-rank IPOs with AI and cache the results.
 * Protected with CRON_SECRET (Bearer token) so it can't be abused publicly.
 * POST body (optional): { "onlyStale": true }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let onlyStale = false;
  try {
    const body = await req.json();
    onlyStale = !!body?.onlyStale;
  } catch {
    // no body — rank all
  }

  const result = await rankAndPersist({ onlyStale });
  return NextResponse.json({ ok: true, ...result });
}
