import { TRAVELTRUST_ROLES } from "@/app/traveltrust/traveltrustIdentityModel";

/** page-brief `in_page_anchors` + 角色 id（TT-PH1-022 · ①） */
export const TRAVELTRUST_SECTION_HASH_IDS = [
  "pulse",
  "hero",
  "roles",
  "liquidity",
  "trust",
  "settlement",
  "faq",
  "start",
  "fee-router",
] as const;

export type TraveltrustSectionHashId = (typeof TRAVELTRUST_SECTION_HASH_IDS)[number];

export const TRAVELTRUST_ROLE_HASH_IDS = TRAVELTRUST_ROLES.map((r) => r.id);

export function normalizeTraveltrustHash(raw: string): string {
  return raw.replace(/^#/, "").trim();
}

export function isTraveltrustRoleHash(hash: string): boolean {
  const h = normalizeTraveltrustHash(hash);
  return TRAVELTRUST_ROLE_HASH_IDS.some((id) => id === h);
}

export function isTraveltrustSectionHash(hash: string): boolean {
  const h = normalizeTraveltrustHash(hash);
  return (TRAVELTRUST_SECTION_HASH_IDS as readonly string[]).includes(h);
}

/** 首访 / hashchange 时滚动到锚点；角色 hash 滚到 #roles（IdentityTheater 负责切 tab） */
export function scrollTraveltrustHashIntoView(
  hash: string,
  options?: { behavior?: ScrollBehavior },
): boolean {
  if (typeof document === "undefined") return false;
  const h = normalizeTraveltrustHash(hash);
  if (!h) return false;

  const behavior = options?.behavior ?? "smooth";
  const targetId = isTraveltrustRoleHash(h) ? "roles" : h;
  const el = document.getElementById(targetId);
  if (!el) return false;

  el.scrollIntoView({ behavior, block: "start", inline: "nearest" });
  return true;
}
