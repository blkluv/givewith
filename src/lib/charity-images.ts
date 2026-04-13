/**
 * Map charity name → hero image in /public/charities.
 * Name-keyed (not id-keyed) because Firestore docIds are opaque and we want
 * the mapping to survive re-seeding or manual re-registration.
 */
const IMAGE_BY_NAME: Record<string, string> = {
  GiveDirectly: "/charities/givedirectly.png",
  "Founders Pledge Climate Change Fund": "/charities/founders-pledge-climate.png",
  "Helen Keller International": "/charities/helen-keller-intl.png",
  "One Acre Fund": "/charities/one-acre-fund.png",
  "Against Malaria Foundation": "/charities/against-malaria.png",
  "Rainforest Trust": "/charities/rainforest-trust.png",
};

export function getCharityImage(name: string): string | null {
  return IMAGE_BY_NAME[name] ?? null;
}
