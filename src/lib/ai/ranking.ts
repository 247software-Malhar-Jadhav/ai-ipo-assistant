import { z } from "zod";
import { prisma } from "@/lib/db";
import { heuristicScore, expectedPremiumPct } from "@/lib/ranking-utils";
import { RANKING_SYSTEM_PROMPT, buildRankingUserPrompt } from "@/lib/ai/prompts";
import {
  getMarketSnapshot,
  marketScoreNudge,
  type MarketSnapshot,
} from "@/lib/market";
import type { Ipo, AiLabel } from "@/types/ipo";

export const RankSchema = z.object({
  score: z.number().min(0).max(10),
  label: z.enum(["high_conviction", "good", "neutral", "avoid"]),
  reason: z.string().min(3).max(400),
  analysis: z
    .string()
    .min(10)
    .max(1200)
    .describe(
      "A 3-4 sentence analyst note grounded in the financials, valuation and the key risk."
    ),
});

export type RankResult = z.infer<typeof RankSchema>;

/** Map a 0–10 score to a conviction label. */
function scoreToLabel(score: number): AiLabel {
  if (score >= 8) return "high_conviction";
  if (score >= 6) return "good";
  if (score >= 4) return "neutral";
  return "avoid";
}

/**
 * Deterministic fallback used when no GROQ_API_KEY is configured or the LLM
 * call fails. Produces the same shape as the AI so the rest of the app is
 * identical regardless of whether AI is available.
 */
export function heuristicRank(ipo: Ipo, market?: MarketSnapshot): RankResult {
  const nudge = market ? marketScoreNudge(market.sentiment) : 0;
  const score = Math.max(0, Math.min(10, heuristicScore(ipo) + nudge));
  const label = scoreToLabel(score);
  const premium = expectedPremiumPct(ipo);
  const subs = ipo.subscriptionTimes;

  let reason: string;
  if (label === "high_conviction") {
    reason = `Strong GMP (${premium >= 0 ? "+" : ""}${premium.toFixed(0)}%)${
      subs > 0 ? ` and ${subs.toFixed(0)}x subscription` : ""
    } point to healthy listing demand.`;
  } else if (label === "good") {
    reason = `Positive premium (${premium >= 0 ? "+" : ""}${premium.toFixed(
      0
    )}%)${subs > 0 ? ` with ${subs.toFixed(1)}x demand` : ""} — worth a look.`;
  } else if (label === "neutral") {
    reason = `Mixed signals: ${premium >= 0 ? "+" : ""}${premium.toFixed(
      0
    )}% GMP${subs > 0 ? ` and ${subs.toFixed(1)}x subscription` : ""}. Optional.`;
  } else {
    reason = `Weak signals: ${premium >= 0 ? "+" : ""}${premium.toFixed(
      0
    )}% GMP${
      subs > 0 ? ` and only ${subs.toFixed(1)}x demand` : " and thin demand"
    }. Consider skipping.`;
  }

  return {
    score: Math.round(score * 10) / 10,
    label,
    reason,
    analysis: heuristicAnalysis(ipo, premium, market),
  };
}

/** Templated fundamental note for the heuristic fallback. */
function heuristicAnalysis(
  ipo: Ipo,
  premium: number,
  market?: MarketSnapshot
): string {
  const parts: string[] = [];

  if (ipo.revenueCr != null && ipo.revenuePrevCr != null && ipo.revenuePrevCr > 0) {
    const growth = ((ipo.revenueCr - ipo.revenuePrevCr) / ipo.revenuePrevCr) * 100;
    parts.push(
      `Revenue ${growth >= 0 ? "grew" : "fell"} ${Math.abs(growth).toFixed(
        0
      )}% YoY to ₹${ipo.revenueCr.toLocaleString("en-IN")} Cr` +
        (ipo.patCr != null
          ? ` with ${ipo.patCr >= 0 ? "PAT" : "a loss"} of ₹${Math.abs(
              ipo.patCr
            ).toLocaleString("en-IN")} Cr`
          : "") +
        "."
    );
  }
  if (ipo.peRatio != null && ipo.industryPe != null) {
    const rich = ipo.peRatio > ipo.industryPe;
    parts.push(
      `Priced at ${ipo.peRatio.toFixed(1)}x P/E versus an industry ${ipo.industryPe.toFixed(
        1
      )}x — ${rich ? "a premium to peers" : "in line with or below peers"}.`
    );
  }
  if (ipo.roePct != null || ipo.debtToEquity != null) {
    const bits: string[] = [];
    if (ipo.roePct != null) bits.push(`RoE ${ipo.roePct.toFixed(0)}%`);
    if (ipo.debtToEquity != null)
      bits.push(`debt-to-equity ${ipo.debtToEquity.toFixed(2)}`);
    parts.push(`${bits.join(", ")}.`);
  }
  parts.push(
    `Implied listing gain is ${premium >= 0 ? "+" : ""}${premium.toFixed(
      0
    )}% on grey-market activity.`
  );
  if (market) {
    parts.push(
      `A ${market.sentiment.toLowerCase()} market (Nifty ${
        market.niftyChangePct >= 0 ? "+" : ""
      }${market.niftyChangePct}%) ${
        market.sentiment === "BULLISH"
          ? "supports listing-day demand"
          : market.sentiment === "BEARISH"
          ? "could weigh on the listing"
          : "is a neutral-to-mixed backdrop"
      }.`
    );
  }
  return parts.join(" ");
}

let warnedNoKey = false;

/** Rank a single IPO via Groq, falling back to the heuristic on any issue. */
export async function rankIpo(
  ipo: Ipo,
  market?: MarketSnapshot
): Promise<RankResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    if (!warnedNoKey) {
      console.warn(
        "[ai] GROQ_API_KEY not set — using heuristic ranking fallback."
      );
      warnedNoKey = true;
    }
    return heuristicRank(ipo, market);
  }

  try {
    // Imported lazily so the heuristic path has no LangChain cost.
    const { ChatGroq } = await import("@langchain/groq");
    const model = new ChatGroq({
      apiKey,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.1,
      maxRetries: 2,
    });
    const structured = model.withStructuredOutput(RankSchema, {
      name: "ipo_ranking",
    });

    const result = await structured.invoke([
      ["system", RANKING_SYSTEM_PROMPT],
      ["human", buildRankingUserPrompt(ipo, market)],
    ]);

    return RankSchema.parse(result);
  } catch (err) {
    console.error(`[ai] ranking failed for ${ipo.symbol}, using fallback:`, err);
    return heuristicRank(ipo, market);
  }
}

/**
 * Rank IPOs and cache the result on each row.
 * @param onlyStale  when true, skip IPOs ranked within `maxAgeMs`.
 */
export async function rankAndPersist(opts?: {
  onlyStale?: boolean;
  maxAgeMs?: number;
}): Promise<{ ranked: number; skipped: number }> {
  const { onlyStale = false, maxAgeMs = 1000 * 60 * 60 * 12 } = opts ?? {};
  const ipos = await prisma.ipo.findMany();
  const market = await getMarketSnapshot();

  let ranked = 0;
  let skipped = 0;
  const now = Date.now();

  // Sequential to stay within free-tier rate limits.
  for (const ipo of ipos) {
    if (
      onlyStale &&
      ipo.aiRankedAt &&
      now - ipo.aiRankedAt.getTime() < maxAgeMs
    ) {
      skipped++;
      continue;
    }

    const r = await rankIpo(ipo, market);
    await prisma.ipo.update({
      where: { id: ipo.id },
      data: {
        aiScore: r.score,
        aiLabel: r.label,
        aiReason: r.reason,
        aiAnalysis: r.analysis,
        aiRankedAt: new Date(),
      },
    });
    ranked++;
  }

  return { ranked, skipped };
}
