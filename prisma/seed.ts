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

  // ---- Subscription breakdown (x times) ----
  qibX: number; // Qualified Institutional Buyers
  niiX: number; // Non-Institutional Investors
  retailX: number; // Retail Individual Investors

  // ---- Fundamentals ----
  about: string; // one-sentence business description
  revenueCr: number; // latest FY revenue (₹ crore)
  revenuePrevCr: number; // previous FY revenue (₹ crore)
  patCr: number; // profit after tax, latest FY (₹ crore; negative = loss)
  patPrevCr: number; // profit after tax, previous FY (₹ crore)
  ebitdaMarginPct: number;
  peRatio: number;
  industryPe: number;
  roePct: number;
  rocePct: number;
  debtToEquity: number;
  marketCapCr: number; // post-issue market cap (₹ crore)
  freshIssueCr: number; // fresh issue portion (₹ crore)
  ofsCr: number; // offer-for-sale portion (₹ crore)
  promoterPrePct: number; // promoter holding pre-issue
  promoterPostPct: number; // promoter holding post-issue (< pre)
  registrar: string;
  strengths: string[];
  risks: string[];
  objects: string[]; // objects of the issue / use of proceeds
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
    qibX: 32.5,
    niiX: 21.8,
    retailX: 9.6,
    about:
      "A cloud-native SaaS provider offering enterprise data and workflow automation platforms on a subscription model.",
    revenueCr: 1420,
    revenuePrevCr: 980,
    patCr: 268,
    patPrevCr: 162,
    ebitdaMarginPct: 31.5,
    peRatio: 48,
    industryPe: 42,
    roePct: 27.4,
    rocePct: 29.8,
    debtToEquity: 0.1,
    marketCapCr: 12800,
    freshIssueCr: 1100,
    ofsCr: 750,
    promoterPrePct: 71.5,
    promoterPostPct: 58.2,
    registrar: "KFin Technologies",
    strengths: [
      "High-margin recurring subscription revenue with strong net retention",
      "Rapid topline growth and expanding enterprise customer base",
      "Asset-light, near debt-free balance sheet",
    ],
    risks: [
      "Premium valuation leaves little room for execution slippage",
      "Intense competition from global SaaS incumbents",
    ],
    objects: [
      "Investment in product development and R&D",
      "Expansion of cloud infrastructure",
      "General corporate purposes",
    ],
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
    qibX: 5.1,
    niiX: 4.6,
    retailX: 3.2,
    about:
      "A branded agro-foods company processing and marketing packaged staples, snacks and edible oils across western India.",
    revenueCr: 1980,
    revenuePrevCr: 1720,
    patCr: 124,
    patPrevCr: 98,
    ebitdaMarginPct: 12.8,
    peRatio: 28,
    industryPe: 32,
    roePct: 18.6,
    rocePct: 20.1,
    debtToEquity: 0.55,
    marketCapCr: 4350,
    freshIssueCr: 400,
    ofsCr: 240,
    promoterPrePct: 68.0,
    promoterPostPct: 60.5,
    registrar: "Link Intime India",
    strengths: [
      "Established consumer brand with wide distribution reach",
      "Steady demand and pricing power in packaged staples",
      "Backward integration into sourcing improves margins",
    ],
    risks: [
      "Raw material cost volatility tied to agricultural cycles",
      "Working-capital intensive operations",
    ],
    objects: [
      "Capital expenditure for a new processing plant",
      "Funding incremental working capital requirements",
      "General corporate purposes",
    ],
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
    qibX: 1.9,
    niiX: 1.5,
    retailX: 1.3,
    about:
      "A speciality chemicals manufacturer supplying intermediates and performance additives to industrial customers.",
    revenueCr: 1240,
    revenuePrevCr: 1280,
    patCr: 46,
    patPrevCr: 58,
    ebitdaMarginPct: 9.5,
    peRatio: 38,
    industryPe: 28,
    roePct: 9.2,
    rocePct: 10.4,
    debtToEquity: 1.35,
    marketCapCr: 3100,
    freshIssueCr: 600,
    ofsCr: 380,
    promoterPrePct: 64.0,
    promoterPostPct: 52.8,
    registrar: "Bigshare Services",
    strengths: [
      "Diversified product mix across end-use industries",
      "Long-standing relationships with anchor customers",
    ],
    risks: [
      "Declining profitability and margins under cost pressure",
      "High leverage relative to peers",
      "Valuation richer than the industry average",
    ],
    objects: [
      "Repayment of borrowings",
      "Funding working capital requirements",
      "General corporate purposes",
    ],
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
    qibX: 0.3,
    niiX: 0.6,
    retailX: 0.9,
    about:
      "An SME last-mile logistics and parcel delivery operator serving regional e-commerce and retail clients.",
    revenueCr: 168,
    revenuePrevCr: 175,
    patCr: -6,
    patPrevCr: 3,
    ebitdaMarginPct: 7.2,
    peRatio: 62,
    industryPe: 24,
    roePct: 6.1,
    rocePct: 8.0,
    debtToEquity: 1.7,
    marketCapCr: 290,
    freshIssueCr: 58,
    ofsCr: 20,
    promoterPrePct: 72.5,
    promoterPostPct: 61.0,
    registrar: "Bigshare Services",
    strengths: [
      "Asset-light fleet model with regional density",
      "Existing client relationships in regional e-commerce",
    ],
    risks: [
      "Slipped into a loss with flat revenue",
      "High debt and thin margins in a price-competitive segment",
      "Undersubscribed issue with a negative grey-market premium",
    ],
    objects: [
      "Repayment of borrowings",
      "Funding working capital requirements",
      "General corporate purposes",
    ],
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
    qibX: 0,
    niiX: 0,
    retailX: 0,
    about:
      "A renewable power developer building and operating utility-scale solar and wind generation assets.",
    revenueCr: 2650,
    revenuePrevCr: 1840,
    patCr: 410,
    patPrevCr: 252,
    ebitdaMarginPct: 38.5,
    peRatio: 34,
    industryPe: 30,
    roePct: 21.0,
    rocePct: 18.5,
    debtToEquity: 1.2,
    marketCapCr: 21500,
    freshIssueCr: 2400,
    ofsCr: 800,
    promoterPrePct: 70.0,
    promoterPostPct: 57.5,
    registrar: "KFin Technologies",
    strengths: [
      "Strong operating-asset portfolio with long-term power purchase agreements",
      "High EBITDA margins typical of renewable generation",
      "Robust capacity-addition pipeline riding the energy-transition tailwind",
    ],
    risks: [
      "Capital-intensive model carries elevated leverage",
      "Counterparty payment delays from state utilities",
    ],
    objects: [
      "Capital expenditure for new generation capacity",
      "Repayment of project borrowings",
      "General corporate purposes",
    ],
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
    qibX: 0,
    niiX: 0,
    retailX: 0,
    about:
      "A diagnostics chain operating pathology labs and collection centres with a growing radiology footprint.",
    revenueCr: 920,
    revenuePrevCr: 760,
    patCr: 138,
    patPrevCr: 104,
    ebitdaMarginPct: 27.0,
    peRatio: 40,
    industryPe: 38,
    roePct: 22.5,
    rocePct: 24.0,
    debtToEquity: 0.25,
    marketCapCr: 6200,
    freshIssueCr: 700,
    ofsCr: 420,
    promoterPrePct: 66.5,
    promoterPostPct: 56.0,
    registrar: "Link Intime India",
    strengths: [
      "Trusted brand with strong repeat patient volumes",
      "High-margin, cash-generative testing business",
      "Scalable hub-and-spoke network expansion",
    ],
    risks: [
      "Rising competition from online and hospital-linked labs",
      "Pricing pressure on routine test panels",
    ],
    objects: [
      "Capital expenditure for new labs and collection centres",
      "Investment in diagnostic equipment",
      "General corporate purposes",
    ],
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
    qibX: 0,
    niiX: 0,
    retailX: 0,
    about:
      "A defence-systems manufacturer supplying electro-optics, avionics and precision components to the armed forces.",
    revenueCr: 3120,
    revenuePrevCr: 2080,
    patCr: 520,
    patPrevCr: 312,
    ebitdaMarginPct: 24.5,
    peRatio: 45,
    industryPe: 40,
    roePct: 28.0,
    rocePct: 26.5,
    debtToEquity: 0.3,
    marketCapCr: 28000,
    freshIssueCr: 2000,
    ofsCr: 750,
    promoterPrePct: 73.0,
    promoterPostPct: 62.0,
    registrar: "KFin Technologies",
    strengths: [
      "Strong order book backed by indigenisation and defence-capex tailwinds",
      "High entry barriers and a sticky government customer base",
      "Healthy margins with a comfortable balance sheet",
    ],
    risks: [
      "Revenue concentration in government contracts",
      "Lumpy order inflows can make earnings uneven",
    ],
    objects: [
      "Capital expenditure for new manufacturing facilities",
      "Funding working capital requirements",
      "General corporate purposes",
    ],
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
    qibX: 0,
    niiX: 0,
    retailX: 0,
    about:
      "A regional real-estate developer building residential and mixed-use projects along the western coastline.",
    revenueCr: 680,
    revenuePrevCr: 690,
    patCr: 42,
    patPrevCr: 48,
    ebitdaMarginPct: 16.0,
    peRatio: 33,
    industryPe: 26,
    roePct: 8.5,
    rocePct: 9.5,
    debtToEquity: 1.45,
    marketCapCr: 1850,
    freshIssueCr: 340,
    ofsCr: 200,
    promoterPrePct: 69.0,
    promoterPostPct: 58.0,
    registrar: "Bigshare Services",
    strengths: [
      "Land bank in high-demand coastal micro-markets",
      "Recognisable regional brand among homebuyers",
    ],
    risks: [
      "High leverage and cyclical, project-dependent cash flows",
      "Regulatory and approval delays typical of real estate",
      "Flat earnings with valuation above the sector average",
    ],
    objects: [
      "Repayment of borrowings",
      "Funding ongoing project construction",
      "General corporate purposes",
    ],
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
    qibX: 0,
    niiX: 0,
    retailX: 0,
    about:
      "A fabless semiconductor company designing power-management and connectivity chips for industrial and automotive use.",
    revenueCr: 1880,
    revenuePrevCr: 1240,
    patCr: 296,
    patPrevCr: 168,
    ebitdaMarginPct: 29.5,
    peRatio: 52,
    industryPe: 44,
    roePct: 24.0,
    rocePct: 25.5,
    debtToEquity: 0.15,
    marketCapCr: 18500,
    freshIssueCr: 2900,
    ofsCr: 1200,
    promoterPrePct: 67.0,
    promoterPostPct: 54.5,
    registrar: "KFin Technologies",
    strengths: [
      "Differentiated chip IP with strong design-win momentum",
      "Exposure to fast-growing automotive and industrial demand",
      "Asset-light fabless model with a clean balance sheet",
    ],
    risks: [
      "Cyclical semiconductor demand and inventory swings",
      "Rich valuation prices in sustained high growth",
    ],
    objects: [
      "Investment in chip design and R&D",
      "Funding working capital requirements",
      "General corporate purposes",
    ],
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
    qibX: 48.2,
    niiX: 31.5,
    retailX: 12.4,
    about:
      "A microfinance-focused NBFC providing small-ticket unsecured loans to women borrowers in rural and semi-urban India.",
    revenueCr: 1560,
    revenuePrevCr: 1140,
    patCr: 235,
    patPrevCr: 158,
    ebitdaMarginPct: 34.0,
    peRatio: 22,
    industryPe: 25,
    roePct: 19.5,
    rocePct: 16.0,
    debtToEquity: 1.6,
    marketCapCr: 7400,
    freshIssueCr: 950,
    ofsCr: 500,
    promoterPrePct: 65.0,
    promoterPostPct: 53.5,
    registrar: "Link Intime India",
    strengths: [
      "Strong loan-book growth with healthy collection efficiency",
      "Deep rural distribution and customer relationships",
      "Attractive valuation relative to NBFC peers",
    ],
    risks: [
      "Asset-quality sensitivity to rural income shocks",
      "Leverage and funding-cost risk inherent to lending",
    ],
    objects: [
      "Augmenting the capital base for future lending",
      "Meeting regulatory capital requirements",
      "General corporate purposes",
    ],
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
    qibX: 4.5,
    niiX: 3.9,
    retailX: 2.8,
    about:
      "A manufacturer of flexible and rigid packaging solutions serving FMCG and food-processing customers.",
    revenueCr: 1120,
    revenuePrevCr: 1020,
    patCr: 64,
    patPrevCr: 54,
    ebitdaMarginPct: 13.5,
    peRatio: 24,
    industryPe: 22,
    roePct: 14.0,
    rocePct: 15.5,
    debtToEquity: 0.85,
    marketCapCr: 1480,
    freshIssueCr: 260,
    ofsCr: 160,
    promoterPrePct: 67.0,
    promoterPostPct: 57.0,
    registrar: "MUFG Intime",
    strengths: [
      "Diversified FMCG client base providing revenue stability",
      "Steady volume growth with incremental margin gains",
    ],
    risks: [
      "Polymer and resin input-cost volatility",
      "Modest margins in a competitive packaging market",
    ],
    objects: [
      "Capital expenditure for capacity expansion",
      "Repayment of borrowings",
      "General corporate purposes",
    ],
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
    qibX: 76.0,
    niiX: 52.3,
    retailX: 18.9,
    about:
      "An online travel platform offering flight, hotel and holiday bookings through web and mobile channels.",
    revenueCr: 2480,
    revenuePrevCr: 1620,
    patCr: 318,
    patPrevCr: 142,
    ebitdaMarginPct: 22.0,
    peRatio: 55,
    industryPe: 45,
    roePct: 25.0,
    rocePct: 23.0,
    debtToEquity: 0.05,
    marketCapCr: 16800,
    freshIssueCr: 1400,
    ofsCr: 800,
    promoterPrePct: 64.0,
    promoterPostPct: 51.0,
    registrar: "KFin Technologies",
    strengths: [
      "Market-leading brand with strong repeat-booking volumes",
      "Rapid profitable growth as travel demand recovers",
      "Near debt-free, technology-driven asset-light model",
    ],
    risks: [
      "High dependence on supplier commissions and discounting",
      "Premium valuation sensitive to growth moderation",
    ],
    objects: [
      "Investment in technology and platform development",
      "Marketing and customer-acquisition spend",
      "General corporate purposes",
    ],
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
    qibX: 24.0,
    niiX: 15.6,
    retailX: 6.8,
    about:
      "A pharmaceuticals company manufacturing generic formulations and active pharmaceutical ingredients for domestic and export markets.",
    revenueCr: 2150,
    revenuePrevCr: 1880,
    patCr: 246,
    patPrevCr: 198,
    ebitdaMarginPct: 21.5,
    peRatio: 30,
    industryPe: 33,
    roePct: 18.0,
    rocePct: 19.5,
    debtToEquity: 0.45,
    marketCapCr: 9200,
    freshIssueCr: 1000,
    ofsCr: 680,
    promoterPrePct: 68.0,
    promoterPostPct: 56.5,
    registrar: "Link Intime India",
    strengths: [
      "Diversified formulation portfolio with regulated-market approvals",
      "Steady earnings growth and healthy return ratios",
      "Backward integration into APIs improves cost control",
    ],
    risks: [
      "Pricing and regulatory risk in export markets",
      "Plant-inspection and compliance dependencies",
    ],
    objects: [
      "Capital expenditure for new manufacturing capacity",
      "Repayment of borrowings",
      "General corporate purposes",
    ],
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
      // Subscription breakdown (x times).
      qibX: i.qibX,
      niiX: i.niiX,
      retailX: i.retailX,
      // Fundamentals.
      about: i.about,
      revenueCr: i.revenueCr,
      revenuePrevCr: i.revenuePrevCr,
      patCr: i.patCr,
      patPrevCr: i.patPrevCr,
      ebitdaMarginPct: i.ebitdaMarginPct,
      peRatio: i.peRatio,
      industryPe: i.industryPe,
      roePct: i.roePct,
      rocePct: i.rocePct,
      debtToEquity: i.debtToEquity,
      marketCapCr: i.marketCapCr,
      freshIssueCr: i.freshIssueCr,
      ofsCr: i.ofsCr,
      promoterPrePct: i.promoterPrePct,
      promoterPostPct: i.promoterPostPct,
      registrar: i.registrar,
      strengths: i.strengths,
      risks: i.risks,
      objects: i.objects,
      // Reset AI fields so the ranking service recomputes against fresh data.
      aiScore: null,
      aiLabel: null,
      aiReason: null,
      aiAnalysis: null,
      aiRankedAt: null,
    };

    await prisma.ipo.upsert({
      where: { symbol: i.symbol },
      create: { symbol: i.symbol, ...data },
      update: data,
    });
  }

  // Seed the current market snapshot (singleton). Adjust to reflect the real
  // market, or update it via POST /api/market.
  const market = {
    sentiment: "BULLISH" as const,
    niftyChangePct: 1.1,
    sensexChangePct: 0.9,
    indiaVix: 12.4,
    recentListingAvgPct: 21.5,
    note: "Indices near record highs with low volatility; recent IPOs have listed with healthy gains, supporting strong demand.",
  };
  await prisma.marketSnapshot.upsert({
    where: { id: "current" },
    create: { id: "current", ...market },
    update: market,
  });

  const count = await prisma.ipo.count();
  console.log(`✓ Done. ${count} IPOs + market snapshot (${market.sentiment}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
