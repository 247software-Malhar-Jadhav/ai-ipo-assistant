/**
 * CLI: rank all IPOs and cache results in the database.
 * Usage: npm run ai:rank
 * Uses Groq if GROQ_API_KEY is set, otherwise the heuristic fallback.
 */
import { rankAndPersist } from "../src/lib/ai/ranking";

async function main() {
  const usingAi = !!process.env.GROQ_API_KEY;
  console.log(
    usingAi
      ? "Ranking IPOs with Groq…"
      : "Ranking IPOs with heuristic fallback (no GROQ_API_KEY)…"
  );
  const result = await rankAndPersist();
  console.log(`✓ Ranked ${result.ranked} IPOs (skipped ${result.skipped}).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
