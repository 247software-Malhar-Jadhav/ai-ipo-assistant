import { prisma } from "@/lib/db";
import { getSourceIpos } from "@/lib/ipo-source";

function toDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Fetch live IPOs from the source and upsert them into the database.
 * Market fields (GMP, subscription, status, dates) are always refreshed;
 * priced/structural fields are only written when the source actually has them,
 * so a lean scrape never wipes richer API data.
 */
export async function ingestIpos(): Promise<{
  fetched: number;
  upserted: number;
  source: string;
}> {
  const items = await getSourceIpos();
  const source = items[0]?.source ?? "none";
  let upserted = 0;

  for (const it of items) {
    const base = {
      name: it.name,
      sector: it.sector,
      exchange: it.exchange,
      status: it.status,
      openDate: toDate(it.openDate),
      closeDate: toDate(it.closeDate),
      listingDate: toDate(it.listingDate),
      gmp: it.gmp,
      gmpPct: it.gmpPct,
      subscriptionTimes: it.subscriptionTimes,
      qibX: it.qibX,
      niiX: it.niiX,
      retailX: it.retailX,
      source: it.source,
      lastSyncedAt: new Date(),
    };

    // Only include these when present so a null from the scrape path doesn't
    // overwrite values an earlier API sync may have stored.
    const optional: Record<string, unknown> = {};
    if (it.priceBandLow != null) optional.priceBandLow = it.priceBandLow;
    if (it.priceBandHigh != null) optional.priceBandHigh = it.priceBandHigh;
    if (it.lotSize != null) optional.lotSize = it.lotSize;
    if (it.issueSizeCr != null) optional.issueSizeCr = it.issueSizeCr;
    if (it.registrar != null) optional.registrar = it.registrar;
    if (it.freshIssueCr != null) optional.freshIssueCr = it.freshIssueCr;
    if (it.ofsCr != null) optional.ofsCr = it.ofsCr;

    await prisma.ipo.upsert({
      where: { symbol: it.symbol },
      create: { symbol: it.symbol, ...base, ...optional },
      update: { ...base, ...optional },
    });
    upserted++;
  }

  return { fetched: items.length, upserted, source };
}

/** Remove leftover sample/seed rows so only real data is shown. */
export async function pruneSeedData(): Promise<number> {
  const res = await prisma.ipo.deleteMany({ where: { source: "seed" } });
  return res.count;
}
