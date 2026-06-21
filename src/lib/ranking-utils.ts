import type { Ipo } from "@/types/ipo";

/**
 * Expected listing gain as a %. Prefers an explicit GMP percentage from the
 * data source; otherwise derives it from GMP ÷ upper price band. Returns 0 if
 * neither is available (e.g. an unpriced upcoming IPO).
 */
export function expectedPremiumPct(
  ipo: Pick<Ipo, "gmp" | "priceBandHigh" | "gmpPct">
): number {
  if (ipo.gmpPct != null) return ipo.gmpPct;
  if (!ipo.priceBandHigh) return 0;
  return (ipo.gmp / ipo.priceBandHigh) * 100;
}

/**
 * Raw heuristic score from market signals only — never reads the cached
 * aiScore, so it is safe to use when (re)computing a ranking.
 */
export function heuristicScore(
  ipo: Pick<Ipo, "gmp" | "priceBandHigh" | "gmpPct" | "subscriptionTimes">
): number {
  const premium = expectedPremiumPct(ipo); // typically -10..50
  // ~30% implied listing gain maps to a top score.
  const premiumScore = Math.max(0, Math.min(10, (premium / 30) * 10));
  // ~30x subscription maps to a top score.
  const subsScore = Math.max(0, Math.min(10, (ipo.subscriptionTimes / 30) * 10));

  // Before bidding opens, subscription is 0 and shouldn't drag the score down —
  // rank on premium alone until demand data exists.
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
  ipo: Pick<Ipo, "aiScore" | "gmp" | "priceBandHigh" | "gmpPct" | "subscriptionTimes">
): number {
  return ipo.aiScore ?? heuristicScore(ipo);
}
