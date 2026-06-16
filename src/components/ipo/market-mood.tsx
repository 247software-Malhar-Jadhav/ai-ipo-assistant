import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MARKET_SENTIMENT_META,
  marketImpactLine,
  type MarketSnapshot,
} from "@/lib/market";

/** Banner summarising the broad market backdrop for IPO listings. */
export default function MarketMood({ market }: { market: MarketSnapshot }) {
  const meta = MARKET_SENTIMENT_META[market.sentiment];

  const signals: { label: string; value: string; up?: boolean }[] = [
    {
      label: "Nifty 50",
      value: `${market.niftyChangePct >= 0 ? "+" : ""}${market.niftyChangePct}%`,
      up: market.niftyChangePct >= 0,
    },
    {
      label: "Sensex",
      value: `${market.sensexChangePct >= 0 ? "+" : ""}${market.sensexChangePct}%`,
      up: market.sensexChangePct >= 0,
    },
    { label: "India VIX", value: `${market.indiaVix}` },
    {
      label: "Recent listings",
      value: `${market.recentListingAvgPct >= 0 ? "+" : ""}${market.recentListingAvgPct}%`,
      up: market.recentListingAvgPct >= 0,
    },
  ];

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Activity className="h-4 w-4 text-[var(--brand)]" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Market mood</span>
              <Badge variant={meta.badge}>
                {meta.emoji} {meta.text}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {marketImpactLine(market.sentiment)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          {signals.map((s) => (
            <div key={s.label}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p
                className={
                  s.up === undefined
                    ? "text-sm font-semibold"
                    : `text-sm font-semibold ${
                        s.up ? "text-[var(--success)]" : "text-destructive"
                      }`
                }
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
