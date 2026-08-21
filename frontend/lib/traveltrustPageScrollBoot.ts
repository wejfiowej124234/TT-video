import { normalizeTraveltrustHash } from "@/lib/traveltrustSectionHash";

/** 文档当前滚动距（兼容不同滚动根） */
export function traveltrustPageScrollY(): number {
  if (typeof window === "undefined") return 0;
  return Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
}

/** 用户已主动下滚则不再抢滚轮置顶（防 brief 就绪 / 首次 wheel 开 snap 时跳回顶） */
export function userHasScrolledPastTraveltrustHero(thresholdPx = 48): boolean {
  return traveltrustPageScrollY() > thresholdPx;
}

/** 无深链 hash 时应落在 Hero 顶（非 #start） */
export function shouldPinTraveltrustHeroOnLoad(): boolean {
  if (typeof window === "undefined") return false;
  const id = normalizeTraveltrustHash(window.location.hash);
  return !id || id === "hero";
}

/** 允许执行 Hero 置顶：有深链目标或用户尚未下滚 */
export function shouldPinTraveltrustHeroNow(): boolean {
  if (!shouldPinTraveltrustHeroOnLoad()) return false;
  return !userHasScrolledPastTraveltrustHero();
}

export function armTraveltrustScrollRestorationManual(): void {
  if (typeof history === "undefined") return;
  history.scrollRestoration = "manual";
}

/** 强制文档顶（兼容不同浏览器滚动根） */
export function pinTraveltrustPageTop(): void {
  if (typeof window === "undefined") return;
  if (!shouldPinTraveltrustHeroNow()) return;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** 首访 / brief 就绪 / 折叠区 hydration 后多帧置顶 */
export function scheduleTraveltrustHeroPin(extraDelaysMs: number[] = [100, 320, 720, 1400]): () => void {
  if (!shouldPinTraveltrustHeroOnLoad()) return () => {};

  const run = () => {
    if (!shouldPinTraveltrustHeroNow()) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };
  run();
  const raf = window.requestAnimationFrame(run);
  const timers = extraDelaysMs.map((ms) => window.setTimeout(run, ms));

  return () => {
    window.cancelAnimationFrame(raf);
    for (const id of timers) window.clearTimeout(id);
  };
}
