import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Check,
  TriangleAlert,
  Target,
} from "lucide-react";
import { getIpoById } from "@/lib/ipo-service";
import { getCurrentUser } from "@/lib/auth";
import { expectedPremiumPct, rankingScore } from "@/lib/ranking-utils";
import { formatDate, formatCrore, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ApplyButton from "@/components/ipo/apply-button";
import { AI_LABEL_META, IPO_STATUS_META, type Ipo } from "@/types/ipo";

export const dynamic = "force-dynamic";

// ---- small formatting helpers ----
const cr = (n: number | null) => (n == null ? "—" : formatCrore(n));
const pct = (n: number | null) => (n == null ? "—" : `${n.toFixed(1)}%`);
const x = (n: number | null) => (n == null ? "—" : `${n.toFixed(2)}x`);
const ratio = (n: number | null) => (n == null ? "—" : n.toFixed(2));

function growthPct(latest: number | null, prev: number | null): number | null {
  if (latest == null || prev == null || prev === 0) return null;
  return ((latest - prev) / Math.abs(prev)) * 100;
}

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

  const revGrowth = growthPct(ipo.revenueCr, ipo.revenuePrevCr);
  const patGrowth = growthPct(ipo.patCr, ipo.patPrevCr);
  const peRich =
    ipo.peRatio != null && ipo.industryPe != null
      ? ipo.peRatio > ipo.industryPe
      : null;
  const hasSubBreakdown = ipo.qibX > 0 || ipo.niiX > 0 || ipo.retailX > 0;

  const minInvestment =
    ipo.priceBandHigh && ipo.lotSize ? ipo.priceBandHigh * ipo.lotSize : null;
  const keyMetrics = [
    {
      label: "Price band",
      value:
        ipo.priceBandLow && ipo.priceBandHigh
          ? `₹${ipo.priceBandLow} – ₹${ipo.priceBandHigh}`
          : "TBA",
    },
    { label: "Lot size", value: ipo.lotSize ? `${ipo.lotSize} shares` : "TBA" },
    {
      label: "Min. investment",
      value: minInvestment ? `₹${minInvestment.toLocaleString("en-IN")}` : "—",
    },
    { label: "Issue size", value: cr(ipo.issueSizeCr) },
    { label: "GMP", value: `₹${ipo.gmp} (${premium >= 0 ? "+" : ""}${premium.toFixed(1)}%)` },
    { label: "Subscription", value: x(ipo.subscriptionTimes || null) },
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
            {[ipo.symbol, ipo.sector, ipo.exchange].filter(Boolean).join(" · ")}
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
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          </div>
          {ipo.aiAnalysis && (
            <p className="mt-4 border-t border-[var(--brand)]/15 pt-4 text-sm leading-relaxed text-foreground/80">
              {ipo.aiAnalysis}
            </p>
          )}
          {!ipo.aiAnalysis && ipo.aiReason && (
            <p className="mt-4 border-t border-[var(--brand)]/15 pt-4 text-sm text-muted-foreground">
              {ipo.aiReason}
            </p>
          )}
        </CardContent>
      </Card>

      {/* About */}
      {ipo.about && (
        <Section title="About the company">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {ipo.about}
          </p>
        </Section>
      )}

      {/* Key IPO metrics */}
      <Section title="IPO details">
        <MetricGrid items={keyMetrics} />
      </Section>

      {/* Financials */}
      {(ipo.revenueCr != null || ipo.patCr != null) && (
        <Section title="Financials">
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Metric</th>
                  <th className="px-4 py-2 font-medium">Latest FY</th>
                  <th className="px-4 py-2 font-medium">Previous FY</th>
                  <th className="px-4 py-2 font-medium">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <FinRow
                  label="Revenue"
                  latest={cr(ipo.revenueCr)}
                  prev={cr(ipo.revenuePrevCr)}
                  growth={revGrowth}
                />
                <FinRow
                  label="Profit after tax"
                  latest={cr(ipo.patCr)}
                  prev={cr(ipo.patPrevCr)}
                  growth={patGrowth}
                />
                {ipo.ebitdaMarginPct != null && (
                  <tr>
                    <td className="px-4 py-2.5">EBITDA margin</td>
                    <td className="px-4 py-2.5 font-medium" colSpan={3}>
                      {pct(ipo.ebitdaMarginPct)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Valuation & returns */}
      {(ipo.peRatio != null || ipo.roePct != null) && (
        <Section title="Valuation & returns">
          <MetricGrid
            items={[
              {
                label: "P/E ratio",
                value: ratio(ipo.peRatio),
                hint:
                  peRich == null
                    ? undefined
                    : peRich
                    ? "Premium to peers"
                    : "In line / below peers",
                hintTone: peRich ? "text-destructive" : "text-[var(--success)]",
              },
              { label: "Industry P/E", value: ratio(ipo.industryPe) },
              { label: "Market cap", value: cr(ipo.marketCapCr) },
              { label: "Return on equity", value: pct(ipo.roePct) },
              { label: "Return on capital", value: pct(ipo.rocePct) },
              {
                label: "Debt / equity",
                value: ratio(ipo.debtToEquity),
                hint:
                  ipo.debtToEquity == null
                    ? undefined
                    : ipo.debtToEquity > 1
                    ? "Leveraged"
                    : "Comfortable",
                hintTone:
                  ipo.debtToEquity != null && ipo.debtToEquity > 1
                    ? "text-destructive"
                    : "text-[var(--success)]",
              },
            ]}
          />
        </Section>
      )}

      {/* Issue structure */}
      {(ipo.freshIssueCr != null || ipo.promoterPostPct != null) && (
        <Section title="Issue structure">
          <MetricGrid
            items={[
              { label: "Fresh issue", value: cr(ipo.freshIssueCr) },
              { label: "Offer for sale", value: cr(ipo.ofsCr) },
              { label: "Promoter (pre)", value: pct(ipo.promoterPrePct) },
              { label: "Promoter (post)", value: pct(ipo.promoterPostPct) },
              { label: "Registrar", value: ipo.registrar ?? "—" },
            ]}
          />
        </Section>
      )}

      {/* Subscription breakdown */}
      {hasSubBreakdown && (
        <Section title="Subscription breakdown">
          <MetricGrid
            items={[
              { label: "QIB", value: x(ipo.qibX || null) },
              { label: "NII", value: x(ipo.niiX || null) },
              { label: "Retail", value: x(ipo.retailX || null) },
              { label: "Overall", value: x(ipo.subscriptionTimes || null) },
            ]}
          />
        </Section>
      )}

      {/* Strengths & risks */}
      {(ipo.strengths.length > 0 || ipo.risks.length > 0) && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {ipo.strengths.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Check className="h-4 w-4 text-[var(--success)]" /> Strengths
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {ipo.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {ipo.risks.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <TriangleAlert className="h-4 w-4 text-destructive" /> Risks
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {ipo.risks.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                      {r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Objects of the issue */}
      {ipo.objects.length > 0 && (
        <Section title="Objects of the issue">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {ipo.objects.map((o, i) => (
              <li key={i} className="flex gap-2">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" />
                {o}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        Sample data for research and demonstration only. Not investment advice.
        Always verify with the official RHP and SEBI filings before applying.
      </p>
    </main>
  );
}

// ---- presentational helpers ----

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function MetricGrid({
  items,
}: {
  items: {
    label: string;
    value: string;
    hint?: string;
    hintTone?: string;
  }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
      {items.map((s) => (
        <div key={s.label} className="bg-card p-4">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="mt-1 font-semibold">{s.value}</p>
          {s.hint && (
            <p className={cn("mt-0.5 text-xs", s.hintTone ?? "text-muted-foreground")}>
              {s.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function FinRow({
  label,
  latest,
  prev,
  growth,
}: {
  label: string;
  latest: string;
  prev: string;
  growth: number | null;
}) {
  return (
    <tr>
      <td className="px-4 py-2.5">{label}</td>
      <td className="px-4 py-2.5 font-medium">{latest}</td>
      <td className="px-4 py-2.5 text-muted-foreground">{prev}</td>
      <td className="px-4 py-2.5">
        {growth == null ? (
          "—"
        ) : (
          <span
            className={cn(
              "font-medium",
              growth >= 0 ? "text-[var(--success)]" : "text-destructive"
            )}
          >
            {growth >= 0 ? "+" : ""}
            {growth.toFixed(0)}%
          </span>
        )}
      </td>
    </tr>
  );
}
