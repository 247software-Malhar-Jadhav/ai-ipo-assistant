import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const bodySchema = z.object({
  ipoId: z.string().min(1),
  applied: z.boolean(),
});

/** List the current user's applied IPO ids. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apps = await prisma.application.findMany({
    where: { userId: user.id, applied: true },
    select: { ipoId: true },
  });
  return NextResponse.json({ ipoIds: apps.map((a) => a.ipoId) });
}

/** Mark an IPO as applied / not applied for the current user. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { ipoId, applied } = parsed.data;

  const ipo = await prisma.ipo.findUnique({ where: { id: ipoId }, select: { id: true } });
  if (!ipo) {
    return NextResponse.json({ error: "IPO not found." }, { status: 404 });
  }

  await prisma.application.upsert({
    where: { userId_ipoId: { userId: user.id, ipoId } },
    create: { userId: user.id, ipoId, applied },
    update: { applied, appliedAt: new Date() },
  });

  return NextResponse.json({ ok: true, ipoId, applied });
}
