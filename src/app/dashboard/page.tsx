import { listIpos } from "@/lib/ipo-service";
import { getMarketSnapshot } from "@/lib/market";
import DashboardClient from "@/components/ipo/dashboard-client";
import MarketMood from "@/components/ipo/market-mood";
import { getCurrentUser } from "@/lib/auth";
import type { IpoTab } from "@/types/ipo";

export const dynamic = "force-dynamic";

const VALID_TABS: IpoTab[] = [
  "all",
  "live",
  "upcoming",
  "best",
  "closed",
  "avoid",
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab: IpoTab =
    tab && VALID_TABS.includes(tab as IpoTab) ? (tab as IpoTab) : "all";

  const user = await getCurrentUser();
  const [ipos, market] = await Promise.all([
    listIpos("all", user?.id),
    getMarketSnapshot(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">IPO Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Live, upcoming and closed IPOs with AI-based ranking by premium,
          fundamentals and market conditions.
        </p>
      </div>

      <div className="mb-6">
        <MarketMood market={market} />
      </div>

      <DashboardClient
        initialIpos={ipos}
        initialTab={initialTab}
        authed={!!user}
      />
    </main>
  );
}
