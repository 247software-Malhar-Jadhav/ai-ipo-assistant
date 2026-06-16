import { prisma } from "@/lib/db";
import { rankingScore } from "@/lib/ranking-utils";
import type { Ipo, IpoTab, IpoWithApplied } from "@/types/ipo";

function attachApplied(
  ipos: Ipo[],
  appliedIds: Set<string>
): IpoWithApplied[] {
  return ipos.map((i) => ({ ...i, applied: appliedIds.has(i.id) }));
}

async function getAppliedIds(userId?: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const apps = await prisma.application.findMany({
    where: { userId, applied: true },
    select: { ipoId: true },
  });
  return new Set(apps.map((a) => a.ipoId));
}

const STATUS_FOR_TAB: Record<string, Ipo["status"][] | undefined> = {
  live: ["LIVE"],
  upcoming: ["UPCOMING"],
  closed: ["CLOSED", "LISTED"],
  all: undefined,
  best: ["LIVE", "UPCOMING"],
  avoid: undefined,
};

/**
 * List IPOs for a dashboard tab, sorted best-first, with the user's applied
 * status attached.
 */
export async function listIpos(
  tab: IpoTab = "all",
  userId?: string
): Promise<IpoWithApplied[]> {
  const statuses = STATUS_FOR_TAB[tab];

  const ipos = await prisma.ipo.findMany({
    where: statuses ? { status: { in: statuses } } : undefined,
  });

  const appliedIds = await getAppliedIds(userId);
  let result = attachApplied(ipos, appliedIds);

  if (tab === "avoid") {
    result = result.filter((i) => i.aiLabel === "avoid");
  }

  // Sort best-first by ranking score, then by GMP as a tie-breaker.
  result.sort((a, b) => {
    const diff = rankingScore(b) - rankingScore(a);
    if (Math.abs(diff) > 0.001) return diff;
    return b.gmp - a.gmp;
  });

  // For "closed" show most recent first instead of by score.
  if (tab === "closed") {
    result.sort((a, b) => b.closeDate.getTime() - a.closeDate.getTime());
  }

  return result;
}

/** Top open IPOs worth applying to (good / high conviction, score-sorted). */
export async function getBestIpos(
  userId?: string,
  limit = 5
): Promise<IpoWithApplied[]> {
  const open = await listIpos("best", userId);
  return open
    .filter((i) =>
      i.aiLabel
        ? i.aiLabel === "good" || i.aiLabel === "high_conviction"
        : rankingScore(i) >= 6
    )
    .slice(0, limit);
}

/** Counts per tab for dashboard badges. */
export async function getTabCounts(): Promise<Record<string, number>> {
  const grouped = await prisma.ipo.groupBy({
    by: ["status"],
    _count: true,
  });
  const byStatus: Record<string, number> = {};
  for (const g of grouped) byStatus[g.status] = g._count;

  const avoid = await prisma.ipo.count({ where: { aiLabel: "avoid" } });

  return {
    live: byStatus.LIVE ?? 0,
    upcoming: byStatus.UPCOMING ?? 0,
    closed: (byStatus.CLOSED ?? 0) + (byStatus.LISTED ?? 0),
    all: Object.values(byStatus).reduce((a, b) => a + b, 0),
    avoid,
  };
}

/** A single IPO with applied status for the detail page. */
export async function getIpoById(
  id: string,
  userId?: string
): Promise<IpoWithApplied | null> {
  const ipo = await prisma.ipo.findUnique({ where: { id } });
  if (!ipo) return null;
  const appliedIds = await getAppliedIds(userId);
  return { ...ipo, applied: appliedIds.has(ipo.id) };
}
