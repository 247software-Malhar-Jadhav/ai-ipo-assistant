import { PrismaClient, IpoStatus } from "@prisma/client";

const prisma = new PrismaClient();

/** Date N days from today (negative = in the past), at midnight. */
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Sample IPO data.
 *
 * These are illustrative entries (plausible but fictional companies) so the
 * app is fully functional out of the box. Replace this seed — or wire a real
 * data source into the IPO service — for live market data. Dates are relative
 * to the seed run so there are always live, upcoming and closed IPOs to see.
 */
type SeedIpo = {
  name: string;
  symbol: string;
  sector: string;
  exchange: string;
  priceBandLow: number;
  priceBandHigh: number;
  lotSize: number;
  issueSizeCr: number;
  openOffset: number; // days from today
  closeOffset: number;
  listingOffset?: number;
  status: IpoStatus;
  gmp: number;
  subscriptionTimes: number;
};

const ipos: SeedIpo[] = [
  // ---- LIVE (window open now) ----
  {
    name: "Nimbus Cloud Technologies",
    symbol: "NIMBUS",
    sector: "Technology / SaaS",
    exchange: "NSE",
    priceBandLow: 540,
    priceBandHigh: 570,
    lotSize: 26,
    issueSizeCr: 1850,
    openOffset: -1,
    closeOffset: 2,
    status: "LIVE",
    gmp: 142,
    subscriptionTimes: 18.4,
  },
  {
    name: "Sahyadri Agro Foods",
    symbol: "SAHYAGRO",
    sector: "FMCG / Agriculture",
    exchange: "BSE",
    priceBandLow: 295,
    priceBandHigh: 310,
    lotSize: 48,
    issueSizeCr: 640,
    openOffset: 0,
    closeOffset: 3,
    status: "LIVE",
    gmp: 38,
    subscriptionTimes: 4.2,
  },
  {
    name: "Meridian Speciality Chemicals",
    symbol: "MERIDCHEM",
    sector: "Chemicals",
    exchange: "NSE",
    priceBandLow: 410,
    priceBandHigh: 432,
    lotSize: 34,
    issueSizeCr: 980,
    openOffset: -1,
    closeOffset: 1,
    status: "LIVE",
    gmp: 12,
    subscriptionTimes: 1.6,
  },
  {
    name: "QuickServe Logistics",
    symbol: "QSLOGI",
    sector: "Logistics",
    exchange: "NSE SME",
    priceBandLow: 96,
    priceBandHigh: 102,
    lotSize: 1200,
    issueSizeCr: 78,
    openOffset: 0,
    closeOffset: 2,
    status: "LIVE",
    gmp: -4,
    subscriptionTimes: 0.7,
  },

  // ---- UPCOMING ----
  {
    name: "Helios Renewable Power",
    symbol: "HELIOSPWR",
    sector: "Renewable Energy",
    exchange: "NSE",
    priceBandLow: 720,
    priceBandHigh: 760,
    lotSize: 19,
    issueSizeCr: 3200,
    openOffset: 5,
    closeOffset: 8,
    status: "UPCOMING",
    gmp: 210,
    subscriptionTimes: 0,
  },
  {
    name: "Ananta Diagnostics",
    symbol: "ANANTADIAG",
    sector: "Healthcare",
    exchange: "NSE",
    priceBandLow: 385,
    priceBandHigh: 405,
    lotSize: 36,
    issueSizeCr: 1120,
    openOffset: 7,
    closeOffset: 10,
    status: "UPCOMING",
    gmp: 64,
    subscriptionTimes: 0,
  },
  {
    name: "Trinetra Defence Systems",
    symbol: "TRINETRA",
    sector: "Defence",
    exchange: "NSE",
    priceBandLow: 1180,
    priceBandHigh: 1240,
    lotSize: 12,
    issueSizeCr: 2750,
    openOffset: 9,
    closeOffset: 12,
    status: "UPCOMING",
    gmp: 305,
    subscriptionTimes: 0,
  },
  {
    name: "Coastal Realty Estates",
    symbol: "COASTALRE",
    sector: "Real Estate",
    exchange: "BSE",
    priceBandLow: 218,
    priceBandHigh: 230,
    lotSize: 65,
    issueSizeCr: 540,
    openOffset: 12,
    closeOffset: 15,
    status: "UPCOMING",
    gmp: 6,
    subscriptionTimes: 0,
  },
  {
    name: "ByteForge Semiconductors",
    symbol: "BYTEFORGE",
    sector: "Semiconductors",
    exchange: "NSE",
    priceBandLow: 890,
    priceBandHigh: 940,
    lotSize: 15,
    issueSizeCr: 4100,
    openOffset: 14,
    closeOffset: 17,
    status: "UPCOMING",
    gmp: 188,
    subscriptionTimes: 0,
  },

  // ---- CLOSED (window over, not yet listed) ----
  {
    name: "Pioneer Microfinance",
    symbol: "PIONMFIN",
    sector: "NBFC / Finance",
    exchange: "NSE",
    priceBandLow: 330,
    priceBandHigh: 348,
    lotSize: 43,
    issueSizeCr: 1450,
    openOffset: -6,
    closeOffset: -3,
    listingOffset: 2,
    status: "CLOSED",
    gmp: 52,
    subscriptionTimes: 26.1,
  },
  {
    name: "Greenfield Packaging",
    symbol: "GREENPACK",
    sector: "Packaging",
    exchange: "BSE",
    priceBandLow: 154,
    priceBandHigh: 162,
    lotSize: 92,
    issueSizeCr: 420,
    openOffset: -7,
    closeOffset: -4,
    listingOffset: 1,
    status: "CLOSED",
    gmp: 9,
    subscriptionTimes: 3.8,
  },

  // ---- LISTED (already trading) ----
  {
    name: "Vistara Travel Tech",
    symbol: "VISTARATT",
    sector: "Travel / Internet",
    exchange: "NSE",
    priceBandLow: 460,
    priceBandHigh: 486,
    lotSize: 30,
    issueSizeCr: 2200,
    openOffset: -18,
    closeOffset: -15,
    listingOffset: -10,
    status: "LISTED",
    gmp: 0,
    subscriptionTimes: 41.7,
  },
  {
    name: "Orchid Lifesciences",
    symbol: "ORCHIDLIFE",
    sector: "Pharmaceuticals",
    exchange: "NSE",
    priceBandLow: 615,
    priceBandHigh: 648,
    lotSize: 23,
    issueSizeCr: 1680,
    openOffset: -20,
    closeOffset: -17,
    listingOffset: -12,
    status: "LISTED",
    gmp: 0,
    subscriptionTimes: 12.9,
  },
];

async function main() {
  console.log(`Seeding ${ipos.length} IPOs…`);

  for (const i of ipos) {
    const data = {
      name: i.name,
      sector: i.sector,
      exchange: i.exchange,
      priceBandLow: i.priceBandLow,
      priceBandHigh: i.priceBandHigh,
      lotSize: i.lotSize,
      issueSizeCr: i.issueSizeCr,
      openDate: daysFromNow(i.openOffset),
      closeDate: daysFromNow(i.closeOffset),
      listingDate:
        i.listingOffset !== undefined ? daysFromNow(i.listingOffset) : null,
      status: i.status,
      gmp: i.gmp,
      subscriptionTimes: i.subscriptionTimes,
      // Reset AI fields so the ranking service recomputes against fresh data.
      aiScore: null,
      aiLabel: null,
      aiReason: null,
      aiRankedAt: null,
    };

    await prisma.ipo.upsert({
      where: { symbol: i.symbol },
      create: { symbol: i.symbol, ...data },
      update: data,
    });
  }

  const count = await prisma.ipo.count();
  console.log(`✓ Done. ${count} IPOs in the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
