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
/**
 * Raw heuristic score from market signals only — never reads the cached
 * aiScore, so it is safe to use when (re)computing a ranking.
 */
export function heuristicScore(
  ipo: Pick<Ipo, "gmp" | "priceBandHigh" | "subscriptionTimes">
): number {
  const premium = expectedPremiumPct(ipo); // typically -10..50
  // ~30% implied listing gain maps to a top score.
  const premiumScore = Math.max(0, Math.min(10, (premium / 30) * 10));
  // ~30x subscription maps to a top score.
  const subsScore = Math.max(0, Math.min(10, (ipo.subscriptionTimes / 30) * 10));

  // Upcoming IPOs haven't opened, so subscription is 0 and shouldn't drag the
  // score down — rank them on premium alone until demand data exists.
  const score =
    ipo.subscriptionTimes > 0
      ? premiumScore * 0.6 + subsScore * 0.4
      : premiumScore;

  return Math.round(score * 10) / 10;
}

/**
 * Score used for display/sorting: the cached AI score when available,
 * otherwise the heuristic.
 */
export function rankingScore(
  ipo: Pick<Ipo, "aiScore" | "gmp" | "priceBandHigh" | "subscriptionTimes">
): number {
  return ipo.aiScore ?? heuristicScore(ipo);
}
