import type { Ipo } from "@/types/ipo";
import { expectedPremiumPct } from "@/lib/ranking-utils";

export const RANKING_SYSTEM_PROMPT = `You are a careful Indian-markets IPO analyst.

Given the facts about a single IPO, assess how attractive it looks for a retail investor applying for listing gains and short-term quality. Consider:
- Grey Market Premium (GMP) and the implied listing gain %
- Subscription demand (times subscribed)
- Issue size and the exchange / segment (mainboard vs SME)
- Sector tailwinds and pricing (price band)

Scoring guide (0-10):
- 8-10 high_conviction: strong premium AND strong demand, reputable segment
- 6-7.9 good: positive signals, worth applying
- 4-5.9 neutral: mixed or thin signals, optional
- 0-3.9 avoid: negative/zero premium, weak demand, or stretched pricing

Be balanced and never guarantee returns. Keep the reason to ONE short sentence (max 30 words), specific to the numbers given.`;

export function buildRankingUserPrompt(ipo: Ipo): string {
  const premium = expectedPremiumPct(ipo);
  return `IPO facts:
- Name: ${ipo.name} (${ipo.symbol})
- Sector: ${ipo.sector}
- Exchange/segment: ${ipo.exchange}
- Status: ${ipo.status}
- Price band: ₹${ipo.priceBandLow}–₹${ipo.priceBandHigh}
- Lot size: ${ipo.lotSize}
- Issue size: ₹${ipo.issueSizeCr} crore
- Grey Market Premium: ₹${ipo.gmp} (implied listing gain ${premium.toFixed(1)}%)
- Subscription: ${ipo.subscriptionTimes}x

Return the score (0-10), label, and a one-sentence reason.`;
}
