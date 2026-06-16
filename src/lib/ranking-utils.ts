import type { Ipo } from "@/types/ipo";

/** Expected listing gain as a % of the upper price band (GMP-based proxy). */
export function expectedPremiumPct(
  ipo: Pick<Ipo, "gmp" | "priceBandHigh">
): number {
  if (!ipo.priceBandHigh) return 0;
  return (ipo.gmp / ipo.priceBandHigh) * 100;
}

/**
 * A 0–10 ranking key. Uses the cached AI score when available, otherwise a
 * transparent heuristic over premium and subscription so the dashboard is
 * still meaningfully ranked before AI ranking has run. This module is pure
 * (no DB import) so it is safe to use in client components too.
 */
export function rankingScore(
  ipo: Pick<Ipo, "aiScore" | "gmp" | "priceBandHigh" | "subscriptionTimes">
): number {
  if (ipo.aiScore != null) return ipo.aiScore;
  const premium = expectedPremiumPct(ipo); // typically -10..50
  const premiumScore = Math.max(0, Math.min(10, (premium / 40) * 10));
  const subsScore = Math.max(0, Math.min(10, (ipo.subscriptionTimes / 30) * 10));
  // Weight premium a bit higher than subscription.
  return Math.round((premiumScore * 0.6 + subsScore * 0.4) * 10) / 10;
}
