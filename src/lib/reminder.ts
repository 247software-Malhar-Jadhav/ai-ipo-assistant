import { prisma } from "@/lib/db";
import { expectedPremiumPct, rankingScore } from "@/lib/ranking-utils";
import { formatDate } from "@/lib/utils";
import type { Ipo } from "@/types/ipo";
import type { ReminderData, ReminderIpo } from "@/types/email";

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function toReminderIpo(ipo: Ipo, applied: boolean): ReminderIpo {
  return {
    id: ipo.id,
    name: ipo.name,
    symbol: ipo.symbol,
    exchange: ipo.exchange,
    priceBand: `₹${ipo.priceBandLow}–₹${ipo.priceBandHigh}`,
    closeDate: formatDate(ipo.closeDate),
    gmp: ipo.gmp,
    premiumPct: Math.round(expectedPremiumPct(ipo) * 10) / 10,
    score: Math.round(rankingScore(ipo) * 10) / 10,
    label: ipo.aiLabel,
    applied,
    url: `${appUrl()}/ipos/${ipo.id}`,
  };
}

function isStrong(ipo: Ipo): boolean {
  return ipo.aiLabel
    ? ipo.aiLabel === "good" || ipo.aiLabel === "high_conviction"
    : rankingScore(ipo) >= 6;
}

/**
 * Assemble the daily reminder payload for a single user: which IPOs are live,
 * which are opening soon, the best picks they haven't applied to yet, and how
 * many open IPOs they've already applied to.
 */
export async function buildReminderData(user: {
  name: string | null;
  email: string;
  id: string;
}): Promise<ReminderData> {
  const [openIpos, appliedRows] = await Promise.all([
    prisma.ipo.findMany({
      where: { status: { in: ["LIVE", "UPCOMING"] } },
    }),
    prisma.application.findMany({
      where: { userId: user.id, applied: true },
      select: { ipoId: true },
    }),
  ]);

  const appliedIds = new Set(appliedRows.map((a) => a.ipoId));

  const sortByScore = (a: Ipo, b: Ipo) => rankingScore(b) - rankingScore(a);

  const live = openIpos
    .filter((i) => i.status === "LIVE")
    .sort(sortByScore)
    .map((i) => toReminderIpo(i, appliedIds.has(i.id)));

  const upcoming = openIpos
    .filter((i) => i.status === "UPCOMING")
    .sort(sortByScore)
    .map((i) => toReminderIpo(i, appliedIds.has(i.id)));

  const bestToApply = openIpos
    .filter((i) => isStrong(i) && !appliedIds.has(i.id))
    .sort(sortByScore)
    .slice(0, 5)
    .map((i) => toReminderIpo(i, false));

  const appliedCount = openIpos.filter((i) => appliedIds.has(i.id)).length;

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return {
    userName: user.name || user.email.split("@")[0],
    appUrl: `${appUrl()}/dashboard`,
    dateLabel,
    live,
    upcoming,
    bestToApply,
    appliedCount,
  };
}

/** True if there's anything worth emailing about today. */
export function hasContent(data: ReminderData): boolean {
  return data.live.length > 0 || data.upcoming.length > 0;
}
