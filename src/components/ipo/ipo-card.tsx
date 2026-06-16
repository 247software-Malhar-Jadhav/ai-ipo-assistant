"use client";

import Link from "next/link";
import { Check, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate, formatCrore } from "@/lib/utils";
import { expectedPremiumPct, rankingScore } from "@/lib/ranking-utils";
import { AI_LABEL_META, IPO_STATUS_META, type IpoWithApplied } from "@/types/ipo";

export default function IpoCard({
  ipo,
  onToggleApplied,
  busy,
}: {
  ipo: IpoWithApplied;
  onToggleApplied?: (ipo: IpoWithApplied) => void;
  busy?: boolean;
}) {
  const score = rankingScore(ipo);
  const premium = expectedPremiumPct(ipo);
  const label = ipo.aiLabel ? AI_LABEL_META[ipo.aiLabel] : null;
  const status = IPO_STATUS_META[ipo.status];
  const canApply = ipo.status === "LIVE" || ipo.status === "UPCOMING";

  return (
    <Card className="flex flex-col p-5 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", status.dot)} />
            <h3 className="truncate font-semibold">
              {ipo.name}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({ipo.symbol})
              </span>
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {ipo.sector} · {ipo.exchange} · {status.text}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {label ? (
            <Badge variant={label.badge}>{label.text}</Badge>
          ) : (
            <Badge variant="muted">Ranking…</Badge>
          )}
          <div className="mt-1.5 text-sm font-semibold">
            {score.toFixed(1)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              / 10
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Stat label="Price band" value={`₹${ipo.priceBandLow}–${ipo.priceBandHigh}`} />
        <Stat label="Lot size" value={`${ipo.lotSize}`} />
        <Stat
          label="GMP"
          value={
            <span
              className={cn(
                "inline-flex items-center gap-1",
                premium >= 0 ? "text-[var(--success)]" : "text-destructive"
              )}
            >
              {premium >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              ₹{ipo.gmp} ({premium >= 0 ? "+" : ""}
              {premium.toFixed(1)}%)
            </span>
          }
        />
        <Stat
          label="Subscription"
          value={
            ipo.subscriptionTimes > 0
              ? `${ipo.subscriptionTimes.toFixed(1)}x`
              : "—"
          }
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Opens {formatDate(ipo.openDate)}</span>
        <span>Closes {formatDate(ipo.closeDate)}</span>
        <span>Issue {formatCrore(ipo.issueSizeCr)}</span>
      </div>

      {/* AI reason */}
      {ipo.aiReason && (
        <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
          {ipo.aiReason}
        </p>
      )}

      {/* Actions */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {onToggleApplied && canApply ? (
          <Button
            variant={ipo.applied ? "secondary" : "default"}
            size="sm"
            disabled={busy}
            onClick={() => onToggleApplied(ipo)}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : ipo.applied ? (
              <Check className="h-4 w-4" />
            ) : null}
            {ipo.applied ? "Applied" : "Mark as applied"}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {canApply ? "" : "Window closed"}
          </span>
        )}
        <Link
          href={`/ipos/${ipo.id}`}
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          View details
        </Link>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
