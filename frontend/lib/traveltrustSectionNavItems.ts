export const TRAVELTRUST_SECTION_IDS = [
  "pulse",
  "hero",
  "trust",
  "settlement",
  "unlock",
  "liquidity",
  "roles",
  "faq",
  "start",
] as const;

export type TraveltrustSectionId = (typeof TRAVELTRUST_SECTION_IDS)[number];

/** 页内锚点导航 SSOT（LandingNav · ScrollProgress 同源） */
export const TRAVELTRUST_SECTION_NAV_ITEMS = [
  { href: "#pulse", sectionId: "pulse" as const, labelKey: "traveltrust_nav_pulse" },
  { href: "#trust", sectionId: "trust" as const, labelKey: "traveltrust_nav_trust" },
  { href: "#settlement", sectionId: "settlement" as const, labelKey: "traveltrust_nav_settlement" },
  { href: "#unlock", sectionId: "unlock" as const, labelKey: "traveltrust_nav_unlock" },
  { href: "#liquidity", sectionId: "liquidity" as const, labelKey: "traveltrust_nav_liquidity" },
  {
    href: "#roles",
    sectionId: "roles" as const,
    labelKey: "traveltrust_nav_roles",
    scrollEvent: "traveltrust_scroll_to_roles" as const,
  },
  { href: "#start", sectionId: "start" as const, labelKey: "traveltrust_nav_start" },
] as const;

/** 首屏露出（对齐官网）：角色 / TTG / 信任 / 启程（公告由 PULSE 承担） */
export const TRAVELTRUST_HERO_COMPACT_NAV_ORDER = [
  "roles",
  "liquidity",
  "trust",
  "start",
] as const satisfies readonly TraveltrustSectionId[];

export const TRAVELTRUST_HERO_COMPACT_SECTIONS = new Set<TraveltrustSectionId>(
  TRAVELTRUST_HERO_COMPACT_NAV_ORDER,
);

export function traveltrustSectionLabelKey(sectionId: TraveltrustSectionId): string {
  if (sectionId === "hero") return "traveltrust_nav_pulse";
  const item = TRAVELTRUST_SECTION_NAV_ITEMS.find((i) => i.sectionId === sectionId);
  return item?.labelKey ?? "traveltrust_nav_pulse";
}
