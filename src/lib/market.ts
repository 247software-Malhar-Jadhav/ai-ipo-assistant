import { prisma } from "@/lib/db";
import type { MarketSentiment, MarketSnapshot } from "@prisma/client";

export type { MarketSnapshot, MarketSentiment };

/** Sensible default if no snapshot row exists yet. */
const DEFAULT_SNAPSHOT: Omit<MarketSnapshot, "updatedAt"> = {
  id: "current",
  sentiment: "NEUTRAL",
  niftyChangePct: 0,
  sensexChangePct: 0,
  indiaVix: 14,
  recentListingAvgPct: 0,
  note: "Market conditions are broadly neutral.",
};

/** Read the current market snapshot (falls back to a neutral default). */
export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const row = await prisma.marketSnapshot.findUnique({
    where: { id: "current" },
  });
  return row ?? { ...DEFAULT_SNAPSHOT, updatedAt: new Date(0) };
}

/**
 * Score nudge applied on top of an IPO's standalone score to reflect the
 * market backdrop. Listing gains track sentiment, so a strong market lifts
 * scores and a weak/volatile one drags them down.
 */
export function marketScoreNudge(s: MarketSentiment): number {
  switch (s) {
    case "BULLISH":
      return 0.8;
    case "NEUTRAL":
      return 0;
    case "CAUTIOUS":
      return -0.7;
    case "BEARISH":
      return -1.6;
  }
}

/** Display metadata for the market mood badge. */
export const MARKET_SENTIMENT_META: Record<
  MarketSentiment,
  { text: string; badge: "success" | "secondary" | "warning" | "destructive"; emoji: string }
> = {
  BULLISH: { text: "Bullish", badge: "success", emoji: "📈" },
  NEUTRAL: { text: "Neutral", badge: "secondary", emoji: "➖" },
  CAUTIOUS: { text: "Cautious", badge: "warning", emoji: "⚠️" },
  BEARISH: { text: "Bearish", badge: "destructive", emoji: "📉" },
};

/** One-line summary of how the market is likely to affect IPO listings. */
export function marketImpactLine(s: MarketSentiment): string {
  switch (s) {
    case "BULLISH":
      return "Strong sentiment is lifting IPO demand and listing gains.";
    case "NEUTRAL":
      return "Listings are tracking each IPO's own fundamentals and GMP.";
    case "CAUTIOUS":
      return "Choppy sentiment may temper listing gains — be selective.";
    case "BEARISH":
      return "Weak sentiment can pull even strong IPOs to flat or negative listings.";
  }
}
