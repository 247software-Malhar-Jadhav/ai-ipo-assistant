import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** Update the current user's profile (name, email-reminder preference). */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = profileUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { name, emailOptIn } = parsed.data;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined ? { name: name || null } : {}),
      ...(emailOptIn !== undefined ? { emailOptIn } : {}),
    },
    select: { id: true, email: true, name: true, emailOptIn: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
