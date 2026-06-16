import type { AiLabel } from "@prisma/client";

/** A single IPO as presented inside the daily reminder email. */
export type ReminderIpo = {
  id: string;
  name: string;
  symbol: string;
  exchange: string;
  priceBand: string; // pre-formatted, e.g. "₹540–₹570"
  closeDate: string; // pre-formatted, e.g. "18 Jun 2026"
  gmp: number;
  premiumPct: number; // implied listing gain %, e.g. 24.9
  score: number; // 0–10
  label: AiLabel | null;
  applied: boolean;
  url: string; // absolute link to the IPO detail page
};

/** The full payload used to render a user's daily IPO reminder email. */
export type ReminderData = {
  userName: string;
  appUrl: string; // absolute dashboard URL
  dateLabel: string; // e.g. "Tuesday, 16 Jun 2026"
  live: ReminderIpo[]; // currently open IPOs
  upcoming: ReminderIpo[]; // opening soon
  bestToApply: ReminderIpo[]; // top picks the user has NOT yet applied to
  appliedCount: number; // how many open IPOs the user has already applied to
};
