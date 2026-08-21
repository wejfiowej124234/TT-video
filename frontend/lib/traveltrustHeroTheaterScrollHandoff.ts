import { TT_PAGE_SCROLL_SNAP_L5 } from "@/lib/traveltrust/l5";
import { bindTraveltrustPageChapterWheelStep } from "@/lib/traveltrustPageScrollChapterStep";

/** Hero↔剧场滚轮助推（仅 snap 启用后 · 不劫持 FAQ/启程） */
export const TT_HERO_THEATER_SCROLL_HANDOFF_L5 = {
  scrollPaddingPx: 112,
  minWheelDelta: 10,
  cooldownMs: 720,
  /** Hero 底缘落在视口此带内且向下滚 → 吸到剧场章顶 */
  heroExitBandMinVh: 0.18,
  heroExitBandMaxVh: 1.04,
  /** #roles 顶未对齐到 scroll-padding 下沿 */
  rolesUnalignedMinPx: 28,
  /** 向上滚：剧场顶接近 sticky 偏移且 Hero 仍在屏内 → 回 Hero */
  theaterReturnBandPx: 140,
} as const;

let handoffCooldownUntil = 0;

function scrollPaddingPx(): number {
  if (typeof document === "undefined") return TT_HERO_THEATER_SCROLL_HANDOFF_L5.scrollPaddingPx;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--tt-scroll-padding-top").trim();
  if (!raw) return TT_HERO_THEATER_SCROLL_HANDOFF_L5.scrollPaddingPx;
  if (raw.endsWith("rem")) {
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n * 16 : TT_HERO_THEATER_SCROLL_HANDOFF_L5.scrollPaddingPx;
  }
  if (raw.endsWith("px")) {
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : TT_HERO_THEATER_SCROLL_HANDOFF_L5.scrollPaddingPx;
  }
  return TT_HERO_THEATER_SCROLL_HANDOFF_L5.scrollPaddingPx;
}

/** 向下：Hero 出口带内一次滚轮 → 剧场节顶 */
export function maybeTraveltrustHeroToTheaterWheelHandoff(e: WheelEvent): boolean {
  if (e.deltaY < TT_HERO_THEATER_SCROLL_HANDOFF_L5.minWheelDelta) return false;
  const now = Date.now();
  if (now < handoffCooldownUntil) return false;

  const hero = document.getElementById("hero");
  const roles =
    document.querySelector<HTMLElement>('[data-tt-traveltrust-snap-chapter="theater"]') ??
    document.getElementById("roles");
  if (!hero || !roles) return false;

  const vh = window.innerHeight;
  const heroBottom = hero.getBoundingClientRect().bottom;
  const rolesTop = roles.getBoundingClientRect().top;
  const pad = scrollPaddingPx();
  const { heroExitBandMinVh, heroExitBandMaxVh, rolesUnalignedMinPx } = TT_HERO_THEATER_SCROLL_HANDOFF_L5;

  if (heroBottom < vh * heroExitBandMinVh || heroBottom > vh * heroExitBandMaxVh) return false;
  if (rolesTop <= pad + rolesUnalignedMinPx) return false;

  e.preventDefault();
  handoffCooldownUntil = now + TT_HERO_THEATER_SCROLL_HANDOFF_L5.cooldownMs;
  roles.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

/** 向上：剧场刚离顶 → 回 Hero 顶 */
export function maybeTraveltrustTheaterToHeroWheelHandoff(e: WheelEvent): boolean {
  if (e.deltaY > -TT_HERO_THEATER_SCROLL_HANDOFF_L5.minWheelDelta) return false;
  const now = Date.now();
  if (now < handoffCooldownUntil) return false;

  const hero = document.getElementById("hero");
  const roles =
    document.querySelector<HTMLElement>('[data-tt-traveltrust-snap-chapter="theater"]') ??
    document.getElementById("roles");
  if (!hero || !roles) return false;

  const pad = scrollPaddingPx();
  const rolesTop = roles.getBoundingClientRect().top;
  const heroTop = hero.getBoundingClientRect().top;
  const { theaterReturnBandPx } = TT_HERO_THEATER_SCROLL_HANDOFF_L5;

  if (rolesTop < pad - 12 || rolesTop > pad + theaterReturnBandPx) return false;
  if (heroTop >= pad - 8) return false;

  e.preventDefault();
  handoffCooldownUntil = now + TT_HERO_THEATER_SCROLL_HANDOFF_L5.cooldownMs;
  hero.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function resetTraveltrustHeroTheaterHandoffCooldown(): void {
  handoffCooldownUntil = 0;
}

/** @deprecated 全页步进见 `bindTraveltrustPageChapterWheelStep` */
export function bindTraveltrustHeroTheaterWheelHandoff(): () => void {
  return bindTraveltrustPageChapterWheelStep();
}
