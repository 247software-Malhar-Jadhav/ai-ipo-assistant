import { listIpos } from "@/lib/ipo-service";
import DashboardClient from "@/components/ipo/dashboard-client";
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

  // Auth wiring (userId) is added with the session layer; null = anonymous.
  const ipos = await listIpos("all", undefined);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">IPO Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Live, upcoming and closed IPOs with AI-based ranking by premium and
          subscription.
        </p>
      </div>

      <DashboardClient
        initialIpos={ipos}
        initialTab={initialTab}
        authed={false}
      />
    </main>
  );
}
