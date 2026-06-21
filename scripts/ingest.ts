/**
 * CLI: fetch live IPOs from the source, upsert them, and rank.
 * Usage: npm run ingest
 * Uses the IPO Guru API if IPOGURU_API_KEY is set, otherwise AI-scrapes
 * ipoguru.in (needs GROQ_API_KEY for extraction).
 */
import { ingestIpos } from "../src/lib/ingest";
import { rankAndPersist } from "../src/lib/ai/ranking";

async function main() {
  console.log("Fetching live IPOs…");
  const ingest = await ingestIpos();
  console.log(
    `✓ Fetched ${ingest.fetched} IPOs from "${ingest.source}", upserted ${ingest.upserted}.`
  );
  console.log("Ranking…");
  const ranking = await rankAndPersist({ onlyStale: false });
  console.log(`✓ Ranked ${ranking.ranked} IPOs.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
