import type { Ipo, IpoStatus, AiLabel, Application } from "@prisma/client";

export type { Ipo, IpoStatus, AiLabel, Application };

/** An IPO row plus whether the current user has applied to it. */
export type IpoWithApplied = Ipo & { applied: boolean };

/** Tab filters available on the dashboard. */
export type IpoTab = "live" | "upcoming" | "closed" | "all" | "best" | "avoid";

/** Display metadata for AI conviction labels. */
export const AI_LABEL_META: Record<
  AiLabel,
  { text: string; badge: "success" | "default" | "secondary" | "destructive"; tone: string }
> = {
  high_conviction: {
    text: "High conviction",
    badge: "success",
    tone: "text-[var(--success)]",
  },
  good: { text: "Good", badge: "default", tone: "text-[var(--brand)]" },
  neutral: { text: "Neutral", badge: "secondary", tone: "text-muted-foreground" },
  avoid: { text: "Avoid", badge: "destructive", tone: "text-destructive" },
};

/** Display metadata for IPO status. */
export const IPO_STATUS_META: Record<
  IpoStatus,
  { text: string; dot: string }
> = {
  LIVE: { text: "Live", dot: "bg-[var(--success)]" },
  UPCOMING: { text: "Upcoming", dot: "bg-[var(--warning)]" },
  CLOSED: { text: "Closed", dot: "bg-muted-foreground" },
  LISTED: { text: "Listed", dot: "bg-[var(--brand)]" },
};
