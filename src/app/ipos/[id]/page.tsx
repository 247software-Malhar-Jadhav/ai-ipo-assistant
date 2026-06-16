import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getIpoById } from "@/lib/ipo-service";
import { getCurrentUser } from "@/lib/auth";
import { expectedPremiumPct, rankingScore } from "@/lib/ranking-utils";
import { formatDate, formatCrore, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ApplyButton from "@/components/ipo/apply-button";
import { AI_LABEL_META, IPO_STATUS_META } from "@/types/ipo";

export const dynamic = "force-dynamic";

export default async function IpoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const ipo = await getIpoById(id, user?.id);
  if (!ipo) notFound();

  const score = rankingScore(ipo);
  const premium = expectedPremiumPct(ipo);
  const label = ipo.aiLabel ? AI_LABEL_META[ipo.aiLabel] : null;
  const status = IPO_STATUS_META[ipo.status];
  const canApply = ipo.status === "LIVE" || ipo.status === "UPCOMING";

  const stats: { label: string; value: string }[] = [
    { label: "Price band", value: `₹${ipo.priceBandLow} – ₹${ipo.priceBandHigh}` },
    { label: "Lot size", value: `${ipo.lotSize} shares` },
    {
      label: "Min. investment",
      value: `₹${(ipo.priceBandHigh * ipo.lotSize).toLocaleString("en-IN")}`,
    },
    { label: "Issue size", value: formatCrore(ipo.issueSizeCr) },
    { label: "GMP", value: `₹${ipo.gmp} (${premium >= 0 ? "+" : ""}${premium.toFixed(1)}%)` },
    {
      label: "Subscription",
      value: ipo.subscriptionTimes > 0 ? `${ipo.subscriptionTimes.toFixed(2)}x` : "—",
    },
    { label: "Open date", value: formatDate(ipo.openDate) },
    { label: "Close date", value: formatDate(ipo.closeDate) },
    { label: "Listing date", value: formatDate(ipo.listingDate) },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", status.dot)} />
            <span className="text-sm text-muted-foreground">{status.text}</span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{ipo.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {ipo.symbol} · {ipo.sector} · {ipo.exchange}
          </p>
        </div>
        <ApplyButton
          ipoId={ipo.id}
          initialApplied={ipo.applied}
          authed={!!user}
          canApply={canApply}
        />
      </div>

      {/* AI verdict */}
      <Card className="mt-6 border-[var(--brand)]/20 bg-[var(--brand)]/[0.04]">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium">AI conviction</p>
              {label ? (
                <Badge variant={label.badge} className="mt-1">
                  {label.text}
                </Badge>
              ) : (
                <Badge variant="muted" className="mt-1">
                  Not yet ranked
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              {score.toFixed(1)}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / 10
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {ipo.aiReason && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {ipo.aiReason}
        </p>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Sample data for research and demonstration only. Not investment advice.
        Always verify with the official RHP and SEBI filings before applying.
      </p>
    </main>
  );
}
