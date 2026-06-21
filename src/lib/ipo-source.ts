import { z } from "zod";
import type { IpoStatus } from "@prisma/client";

/**
 * Live IPO data source.
 *
 * Primary: the official IPO Guru developer API (set IPOGURU_API_KEY).
 * Fallback (no key): fetch the public ipoguru.in homepage and use the LLM to
 * extract the current IPOs. Either way the data is real — no dummy entries.
 */

const HOMEPAGE = "https://www.ipoguru.in/";
const API_BASE = "https://www.ipoguru.in/api/v1";

export type SourceIpo = {
  name: string;
  symbol: string; // stable slug used as the unique key
  sector: string | null;
  exchange: string;
  status: IpoStatus;
  openDate: string | null; // ISO yyyy-mm-dd
  closeDate: string | null;
  listingDate: string | null;
  priceBandLow: number | null;
  priceBandHigh: number | null;
  lotSize: number | null;
  issueSizeCr: number | null;
  gmp: number;
  gmpPct: number | null;
  subscriptionTimes: number;
  qibX: number;
  niiX: number;
  retailX: number;
  registrar: string | null;
  freshIssueCr: number | null;
  ofsCr: number | null;
  source: string;
};

export function slugify(name: string): string {
  return name
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 24);
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** "₹74 Cr" / "74.5 Cr" -> 74.5 */
function parseCrore(v: unknown): number | null {
  return num(v);
}

/** "163-172" -> {low,high} */
function parseBand(v: unknown): { low: number | null; high: number | null } {
  if (!v) return { low: null, high: null };
  const m = String(v).match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return { low: parseInt(m[1], 10), high: parseInt(m[2], 10) };
  const single = num(v);
  return { low: single, high: single };
}

function mapStatus(raw: string | null, listingPrice?: unknown): IpoStatus {
  const s = (raw || "").toLowerCase();
  if (s.includes("list") || listingPrice) return "LISTED";
  if (s.includes("open") || s.includes("live")) return "LIVE";
  if (s.includes("upcoming") || s.includes("soon")) return "UPCOMING";
  if (s.includes("close")) return "CLOSED";
  return "UPCOMING";
}

// ─────────────────────────────────────────────────────────────
// Official API path
// ─────────────────────────────────────────────────────────────
async function fetchFromApi(key: string): Promise<SourceIpo[]> {
  const statuses = ["open", "upcoming", "closed"];
  const out: SourceIpo[] = [];
  const seen = new Set<string>();

  for (const status of statuses) {
    const res = await fetch(`${API_BASE}/ipos?status=${status}`, {
      headers: { "X-API-KEY": key },
      cache: "no-store",
    });
    if (!res.ok) continue;
    const json = await res.json();
    for (const it of json?.data ?? []) {
      const name: string = it.name;
      if (!name) continue;
      const symbol = slugify(name);
      if (seen.has(symbol)) continue;
      seen.add(symbol);

      const band = parseBand(it.price_band);
      const issuePrice = num(it.issue_price);
      const saleType = String(it.sale_type || "").toLowerCase();
      const issueCr = parseCrore(it.issue_size);

      out.push({
        name,
        symbol,
        sector: it.type || null,
        exchange: it.listing_on || it.sub_type || "NSE",
        status: mapStatus(it.status, it.listing_price),
        openDate: it.open_date ?? null,
        closeDate: it.close_date ?? null,
        listingDate: it.listing_date ?? null,
        priceBandLow: band.low,
        priceBandHigh: band.high ?? issuePrice,
        lotSize: num(it.lot_size),
        issueSizeCr: issueCr,
        gmp: Math.round(num(it.gmp?.price) ?? 0),
        gmpPct: num(it.gmp?.percentage),
        subscriptionTimes: num(it.subscription?.total) ?? 0,
        qibX: num(it.subscription?.qib) ?? 0,
        niiX: num(it.subscription?.nii) ?? 0,
        retailX: num(it.subscription?.retail) ?? 0,
        registrar: it.registrar ?? null,
        freshIssueCr: saleType.includes("fresh") ? issueCr : null,
        ofsCr: saleType.includes("ofs") ? issueCr : null,
        source: "ipoguru-api",
      });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// AI-scrape path (no key)
// ─────────────────────────────────────────────────────────────
const ScrapeSchema = z.object({
  ipos: z.array(
    z.object({
      name: z.string(),
      segment: z.enum(["Mainboard", "SME"]).nullable(),
      status: z.enum(["LIVE", "UPCOMING", "CLOSED", "LISTED"]),
      openDate: z.string().nullable().describe("ISO yyyy-mm-dd or null"),
      closeDate: z.string().nullable().describe("ISO yyyy-mm-dd or null"),
      gmpRupees: z.number().nullable(),
      gmpPct: z.number().nullable(),
      subscriptionTimes: z.number().nullable(),
    })
  ),
});

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function scrapeWithAI(): Promise<SourceIpo[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[ipo-source] No IPOGURU_API_KEY and no GROQ_API_KEY — cannot fetch live data.");
    return [];
  }

  const res = await fetch(HOMEPAGE, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AIIPOAssistant/1.0)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ipoguru.in returned ${res.status}`);
  const text = htmlToText(await res.text()).slice(0, 24000);

  const { ChatGroq } = await import("@langchain/groq");
  const model = new ChatGroq({
    apiKey,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0,
    maxRetries: 2,
  }).withStructuredOutput(ScrapeSchema, { name: "extract_ipos" });

  const year = new Date().getFullYear();
  const result = await model.invoke([
    [
      "system",
      `You extract Indian IPO data from scraped website text. Return every distinct IPO you can identify (open, upcoming, closed and recently listed). Convert dates like "19 Jun" or "23 Jun - 25 Jun" to ISO yyyy-mm-dd using the year ${year} (if a date already passed this month it's still ${year}). GMP percentage is the number in parentheses next to the rupee GMP. Use null for anything not present. Do not invent IPOs that are not in the text.`,
    ],
    ["human", text],
  ]);

  const seen = new Set<string>();
  const out: SourceIpo[] = [];
  for (const it of result.ipos) {
    const symbol = slugify(it.name);
    if (seen.has(symbol) || !it.name) continue;
    seen.add(symbol);
    out.push({
      name: it.name.trim(),
      symbol,
      sector: it.segment,
      exchange: it.segment === "SME" ? "NSE SME" : "NSE",
      status: it.status,
      openDate: it.openDate,
      closeDate: it.closeDate,
      listingDate: null,
      priceBandLow: null,
      priceBandHigh: null,
      lotSize: null,
      issueSizeCr: null,
      gmp: Math.round(it.gmpRupees ?? 0),
      gmpPct: it.gmpPct,
      subscriptionTimes: it.subscriptionTimes ?? 0,
      qibX: 0,
      niiX: 0,
      retailX: 0,
      registrar: null,
      freshIssueCr: null,
      ofsCr: null,
      source: "ipoguru-scrape",
    });
  }
  return out;
}

/** Fetch the current IPOs from the best available source. */
export async function getSourceIpos(): Promise<SourceIpo[]> {
  const key = process.env.IPOGURU_API_KEY;
  if (key) {
    try {
      const api = await fetchFromApi(key);
      if (api.length) return api;
      console.warn("[ipo-source] API returned no IPOs — falling back to scrape.");
    } catch (e) {
      console.error("[ipo-source] API failed, falling back to scrape:", e);
    }
  }
  return scrapeWithAI();
}
