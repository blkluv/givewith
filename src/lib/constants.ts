export const LOCUS_API_BASE = "https://beta-api.paywithlocus.com/api";
export const BASESCAN_TX_URL = "https://basescan.org/tx";
export const BASESCAN_ADDRESS_URL = "https://basescan.org/address";

export const CHARITY_CAUSES = [
  "poverty",
  "health",
  "climate",
  "education",
  "environment",
  "children",
  "nutrition",
  "economic-empowerment",
  "biodiversity",
] as const;

export type CharityCause = (typeof CHARITY_CAUSES)[number];

export const CAUSE_LABELS: Record<CharityCause, string> = {
  poverty: "Poverty",
  health: "Health",
  climate: "Climate",
  education: "Education",
  environment: "Environment",
  children: "Children",
  nutrition: "Nutrition",
  "economic-empowerment": "Economic Empowerment",
  biodiversity: "Biodiversity",
};

// Muted-saturation badges tuned for dark editorial theme
export const CAUSE_COLORS: Record<CharityCause, string> = {
  poverty: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  health: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  climate: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  education: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  environment: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  children: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  nutrition: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  "economic-empowerment":
    "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  biodiversity: "bg-teal-500/15 text-teal-300 border-teal-500/30",
};

// Lucide icon names for category tiles (landing page)
export const CAUSE_ICONS: Record<CharityCause, string> = {
  poverty: "HandHeart",
  health: "Heart",
  climate: "Thermometer",
  education: "GraduationCap",
  environment: "Leaf",
  children: "Baby",
  nutrition: "Apple",
  "economic-empowerment": "TrendingUp",
  biodiversity: "Sprout",
};

export const REGIONS = [
  "Africa",
  "Asia",
  "Latin America",
  "Europe",
  "North America",
  "Global",
] as const;

export type Region = (typeof REGIONS)[number];

export const MIN_DONATION_AMOUNT = 0.5;
export const MAX_DEMO_DONATION = 5.0;
export const PRESET_AMOUNTS = [0.5, 1.0, 2.0, 5.0];
