import { z } from "zod";
import { prisma } from "@/lib/db";
import { heuristicScore, expectedPremiumPct } from "@/lib/ranking-utils";
import { RANKING_SYSTEM_PROMPT, buildRankingUserPrompt } from "@/lib/ai/prompts";
import type { Ipo, AiLabel } from "@/types/ipo";

export const RankSchema = z.object({
  score: z.number().min(0).max(10),
  label: z.enum(["high_conviction", "good", "neutral", "avoid"]),
  reason: z.string().min(3).max(400),
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
export function heuristicRank(ipo: Ipo): RankResult {
  const score = heuristicScore(ipo);
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

  return { score: Math.round(score * 10) / 10, label, reason };
}

let warnedNoKey = false;

/** Rank a single IPO via Groq, falling back to the heuristic on any issue. */
export async function rankIpo(ipo: Ipo): Promise<RankResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    if (!warnedNoKey) {
      console.warn(
        "[ai] GROQ_API_KEY not set — using heuristic ranking fallback."
      );
      warnedNoKey = true;
    }
    return heuristicRank(ipo);
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
      ["human", buildRankingUserPrompt(ipo)],
    ]);

    return RankSchema.parse(result);
  } catch (err) {
    console.error(`[ai] ranking failed for ${ipo.symbol}, using fallback:`, err);
    return heuristicRank(ipo);
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

    const r = await rankIpo(ipo);
    await prisma.ipo.update({
      where: { id: ipo.id },
      data: {
        aiScore: r.score,
        aiLabel: r.label,
        aiReason: r.reason,
        aiRankedAt: new Date(),
      },
    });
    ranked++;
  }

  return { ranked, skipped };
}
