import type { Ipo } from "@/types/ipo";
import type { MarketSnapshot } from "@prisma/client";
import { expectedPremiumPct } from "@/lib/ranking-utils";

export const RANKING_SYSTEM_PROMPT = `You are a careful Indian-markets IPO analyst.

Given the facts about a single IPO, assess how attractive it looks for a retail investor applying for listing gains and short-term quality.

The MOST important signal is the implied listing gain % (from GMP). Use it as the primary anchor for the score, then adjust for the other factors:
- Subscription demand (times subscribed)
- Issue size and the exchange / segment (mainboard vs SME)
- Sector tailwinds and pricing (price band)

CRITICAL — subscription depends on status:
- If status is UPCOMING, bidding has NOT started yet, so subscription is 0 by definition. DO NOT penalise an UPCOMING IPO for low/zero subscription. Judge it on the implied listing gain %, issue size, segment and sector only.
- Only treat subscription as a real demand signal when status is LIVE, CLOSED or LISTED.
- For LISTED IPOs, GMP is naturally 0 (already trading); rely on subscription/segment instead and lean neutral unless demand was strong.

Rough scoring anchor by implied listing gain % (then nudge ±1-2 for demand/segment/pricing):
- >= 25%  -> 8-10 (high_conviction)
- 15-25%  -> 6-8  (good)
- 5-15%   -> 4-6  (neutral)
- < 5% or negative -> 0-4 (avoid)

Labels: 8-10 high_conviction, 6-7.9 good, 4-5.9 neutral, 0-3.9 avoid.

Also weigh the FUNDAMENTALS when provided — they should nudge the score and are the basis for your analysis:
- Valuation: P/E vs the industry P/E (a large premium to peers is a negative; in line/below is a positive).
- Growth & profitability: revenue and profit-after-tax growth, EBITDA margin. Loss-making or declining profit is a risk.
- Returns & leverage: higher RoE/RoCE is good; high debt-to-equity (> ~1) is a risk.

Factor in the CURRENT MARKET when provided. Listing gains track broad sentiment:
- A BULLISH, low-volatility market lifts demand and listing gains — nudge the score up slightly and say it supports the listing.
- A CAUTIOUS/BEARISH or high-volatility market can pull even strong IPOs to flat/negative listings — nudge the score down and flag it as a headwind.
You MUST mention in the analysis how the current market specifically affects THIS IPO's listing prospects.

You must return:
- score (0-10) and label per the guide above.
- reason: ONE short sentence (max 30 words), specific to the numbers.
- analysis: a 3-4 sentence analyst note grounded in the fundamentals — cover growth/profitability, valuation vs peers, and the single biggest risk. Be objective; never guarantee returns.`;

function fmt(n: number | null | undefined, suffix = ""): string {
  return n == null ? "n/a" : `${n}${suffix}`;
}

export function buildRankingUserPrompt(
  ipo: Ipo,
  market?: MarketSnapshot
): string {
  const premium = expectedPremiumPct(ipo);
  const marketBlock = market
    ? `

Current market:
- Sentiment: ${market.sentiment}
- Nifty ${market.niftyChangePct >= 0 ? "+" : ""}${market.niftyChangePct}%, Sensex ${market.sensexChangePct >= 0 ? "+" : ""}${market.sensexChangePct}%, India VIX ${market.indiaVix}
- Recent IPO listings averaged ${market.recentListingAvgPct >= 0 ? "+" : ""}${market.recentListingAvgPct}% on debut
- Note: ${market.note}`
    : "";
  const revGrowth =
    ipo.revenueCr != null && ipo.revenuePrevCr
      ? `${(((ipo.revenueCr - ipo.revenuePrevCr) / ipo.revenuePrevCr) * 100).toFixed(0)}% YoY`
      : "n/a";
  const patGrowth =
    ipo.patCr != null && ipo.patPrevCr
      ? `${(((ipo.patCr - ipo.patPrevCr) / Math.abs(ipo.patPrevCr)) * 100).toFixed(0)}% YoY`
      : "n/a";

  return `IPO facts:
- Name: ${ipo.name} (${ipo.symbol})
- Sector: ${ipo.sector}
- Exchange/segment: ${ipo.exchange}
- Status: ${ipo.status}
- Price band: ₹${ipo.priceBandLow}–₹${ipo.priceBandHigh}
- Issue size: ₹${ipo.issueSizeCr} crore (fresh ₹${fmt(ipo.freshIssueCr)} cr, OFS ₹${fmt(ipo.ofsCr)} cr)
- Grey Market Premium: ₹${ipo.gmp} (implied listing gain ${premium.toFixed(1)}%)
- Subscription: ${ipo.subscriptionTimes}x (QIB ${fmt(ipo.qibX, "x")}, NII ${fmt(ipo.niiX, "x")}, Retail ${fmt(ipo.retailX, "x")})

Fundamentals:
- Revenue: ₹${fmt(ipo.revenueCr)} cr (${revGrowth}); PAT: ₹${fmt(ipo.patCr)} cr (${patGrowth})
- EBITDA margin: ${fmt(ipo.ebitdaMarginPct, "%")}
- Valuation: P/E ${fmt(ipo.peRatio)} vs industry ${fmt(ipo.industryPe)}; market cap ₹${fmt(ipo.marketCapCr)} cr
- Returns/leverage: RoE ${fmt(ipo.roePct, "%")}, RoCE ${fmt(ipo.rocePct, "%")}, D/E ${fmt(ipo.debtToEquity)}
- Promoter holding: ${fmt(ipo.promoterPrePct, "%")} pre -> ${fmt(ipo.promoterPostPct, "%")} post
- Strengths: ${ipo.strengths?.length ? ipo.strengths.join("; ") : "n/a"}
- Risks: ${ipo.risks?.length ? ipo.risks.join("; ") : "n/a"}${marketBlock}

Return score, label, reason and analysis.`;
}
