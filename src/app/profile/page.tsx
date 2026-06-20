import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Inbox } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProfileClient from "@/components/profile/profile-client";
import { AI_LABEL_META, IPO_STATUS_META } from "@/types/ipo";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const [user, applications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: { email: true, name: true, emailOptIn: true, createdAt: true },
    }),
    prisma.application.findMany({
      where: { userId: session.id, applied: true },
      orderBy: { appliedAt: "desc" },
      include: { ipo: true },
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-2 text-muted-foreground">
          {user.name ? `${user.name} · ` : ""}Member since{" "}
          {formatDate(user.createdAt)}
        </p>
      </div>

      <ProfileClient
        initialName={user.name ?? ""}
        email={user.email}
        initialEmailOptIn={user.emailOptIn}
      />

      {/* Applied IPOs */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">
          IPOs you&apos;ve applied to{" "}
          <span className="text-muted-foreground">({applications.length})</span>
        </h2>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No applications yet</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Mark IPOs as applied from the dashboard to track them here.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] hover:underline"
              >
                Browse IPOs <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {applications.map((a) => {
              const ipo = a.ipo;
              const status = IPO_STATUS_META[ipo.status];
              const label = ipo.aiLabel ? AI_LABEL_META[ipo.aiLabel] : null;
              return (
                <Link
                  key={a.id}
                  href={`/ipos/${ipo.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", status.dot)} />
                      <span className="truncate font-medium">{ipo.name}</span>
                      <span className="text-sm text-muted-foreground">({ipo.symbol})</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {status.text} · applied {formatDate(a.appliedAt)}
                    </p>
                  </div>
                  {label && <Badge variant={label.badge}>{label.text}</Badge>}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
