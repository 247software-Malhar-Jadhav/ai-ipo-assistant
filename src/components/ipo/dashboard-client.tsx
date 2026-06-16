"use client";

import { useMemo, useState } from "react";
import { Search, Inbox } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import IpoCard from "@/components/ipo/ipo-card";
import { rankingScore } from "@/lib/ranking-utils";
import type { IpoTab, IpoWithApplied } from "@/types/ipo";

const TABS: { value: IpoTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
  { value: "best", label: "Best picks" },
  { value: "closed", label: "Closed" },
  { value: "avoid", label: "Avoid" },
];

function inTab(ipo: IpoWithApplied, tab: IpoTab): boolean {
  switch (tab) {
    case "live":
      return ipo.status === "LIVE";
    case "upcoming":
      return ipo.status === "UPCOMING";
    case "closed":
      return ipo.status === "CLOSED" || ipo.status === "LISTED";
    case "best":
      return (
        (ipo.status === "LIVE" || ipo.status === "UPCOMING") &&
        (ipo.aiLabel
          ? ipo.aiLabel === "good" || ipo.aiLabel === "high_conviction"
          : rankingScore(ipo) >= 6)
      );
    case "avoid":
      return ipo.aiLabel === "avoid";
    case "all":
    default:
      return true;
  }
}

export default function DashboardClient({
  initialIpos,
  initialTab = "all",
  authed,
}: {
  initialIpos: IpoWithApplied[];
  initialTab?: IpoTab;
  authed: boolean;
}) {
  const [ipos, setIpos] = useState(initialIpos);
  const [tab, setTab] = useState<IpoTab>(initialTab);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of TABS) c[t.value] = ipos.filter((i) => inTab(i, t.value)).length;
    return c;
  }, [ipos]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ipos
      .filter((i) => inTab(i, tab))
      .filter(
        (i) =>
          !q ||
          i.name.toLowerCase().includes(q) ||
          i.symbol.toLowerCase().includes(q) ||
          i.sector.toLowerCase().includes(q)
      );
  }, [ipos, tab, query]);

  async function handleToggle(ipo: IpoWithApplied) {
    const optimistic = !ipo.applied;
    setBusyId(ipo.id);
    // Optimistic update.
    setIpos((prev) =>
      prev.map((i) => (i.id === ipo.id ? { ...i, applied: optimistic } : i))
    );
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipoId: ipo.id, applied: optimistic }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setIpos((prev) =>
        prev.map((i) =>
          i.id === ipo.id ? { ...i, applied: !!data.applied } : i
        )
      );
    } catch {
      // Revert on failure.
      setIpos((prev) =>
        prev.map((i) => (i.id === ipo.id ? { ...i, applied: ipo.applied } : i))
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as IpoTab)}>
          <TabsList className="flex-wrap">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {counts[t.value] > 0 && (
                  <Badge variant="muted" className="ml-2 px-1.5 py-0">
                    {counts[t.value]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, symbol, sector…"
            className="pl-9"
          />
        </div>
      </div>

      {tab === "best" && (
        <p className="text-sm text-muted-foreground">
          Open IPOs ranked highest by AI conviction — strong premium and
          subscription demand. Always do your own research.
        </p>
      )}
      {tab === "avoid" && (
        <p className="text-sm text-muted-foreground">
          IPOs the AI flagged to skip — weak premium, low demand or stretched
          pricing.
        </p>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No IPOs here right now</p>
          <p className="text-sm text-muted-foreground">
            Try another tab or clear your search.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((ipo) => (
            <IpoCard
              key={ipo.id}
              ipo={ipo}
              busy={busyId === ipo.id}
              onToggleApplied={authed ? handleToggle : undefined}
              // toggle persists via /api/applications when authed
            />
          ))}
        </div>
      )}

      {!authed && (
        <p className="text-center text-sm text-muted-foreground">
          <a href="/login" className="font-medium text-[var(--brand)] hover:underline">
            Log in
          </a>{" "}
          to track which IPOs you&apos;ve applied to and get daily reminders.
        </p>
      )}
    </div>
  );
}
