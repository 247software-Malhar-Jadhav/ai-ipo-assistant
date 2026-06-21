import { NextRequest, NextResponse } from "next/server";
import { ingestIpos } from "@/lib/ingest";
import { rankAndPersist } from "@/lib/ai/ranking";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Pull live IPOs from the source and (re)rank them.
 * Protected with CRON_SECRET so it can't be triggered publicly.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ingest = await ingestIpos();
  const ranking = await rankAndPersist({ onlyStale: false });
  return NextResponse.json({ ok: true, ingest, ranking });
}

export async function POST(req: NextRequest) {
  return handle(req);
}
export async function GET(req: NextRequest) {
  return handle(req);
}
