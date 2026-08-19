import { TT_PAGE_SCROLL_SNAP_L5 } from "@/lib/traveltrust/l5";

/** 营销长页叙事章顺序（与 `TravelTrustSnapChapter` / `#hero` 一致） */
export const TT_PAGE_SCROLL_CHAPTER_STEP_L5 = {
  /** 与 `TRAVELTRUST_SECTION_NAV_ITEMS` 叙事顺序一致（一滚轮一屏 · 不跳过 trust 等） */
  chapterSelectors: [
    "#hero",
    '[data-tt-traveltrust-snap-chapter="liquidity"]',
    '[data-tt-traveltrust-snap-chapter="trust"]',
    '[data-tt-traveltrust-snap-chapter="settlement"]',
    '[data-tt-traveltrust-snap-chapter="theater"]',
    '[data-tt-traveltrust-snap-chapter="close"]',
  ],
  /** 单次滚轮事件最小 delta，过滤触控板碎抖 */
  minWheelDelta: 6,
  /** 同一方向累计到此值才切章（触控板需刻意多滑一点） */
  wheelAccumThreshold: 96,
  wheelAccumResetMs: 680,
  /** 章间切换动画时长（慢速 ease-in-out · 与 cooldown 对齐） */
  scrollDurationMs: 2100,
  cooldownMs: 2400,
  alignThresholdPx: 52,
  scrollBehavior: "smooth" as const,
} as const;

export type TraveltrustScrollChapterSnapAlign = "center" | "start";

let stepCooldownUntil = 0;
let chapterScrollAnimUntil = 0;
let chapterScrollRaf = 0;
let wheelAccum = 0;
let wheelAccumDir = 0;
let wheelAccumLastAt = 0;

/** 起止都缓，避免「嗖一下」到位 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

const TT_CHAPTER_SCROLL_ANIM_CLASS = "tt-traveltrust-chapter-scroll-anim";

/** 解析后的 scroll-padding-top（px），与 CSS 变量 / calc 一致 */
export function scrollPaddingPx(): number {
  if (typeof document === "undefined") return 88;
  const raw = getComputedStyle(document.documentElement).scrollPaddingTop;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 88;
}

export function traveltrustScrollChapterSnapAlign(el: HTMLElement): TraveltrustScrollChapterSnapAlign {
  const raw = el.getAttribute("data-tt-traveltrust-snap-align");
  if (raw === "start" || raw === "center") return raw;
  if (el.id === "hero") return "center";
  return "start";
}

function chapterAnchorY(el: HTMLElement, align: TraveltrustScrollChapterSnapAlign): number {
  const r = el.getBoundingClientRect();
  return align === "center" ? r.top + r.height / 2 : r.top;
}

function chapterSnapTargetY(align: TraveltrustScrollChapterSnapAlign, pad: number): number {
  if (align === "center") {
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    return pad + (h - pad) / 2;
  }
  return pad;
}

/** 将章吸附锚点对齐到 scroll-padding / 视口中线的目标 scrollY */
export function resolveTraveltrustScrollChapterTop(el: HTMLElement): number {
  const pad = scrollPaddingPx();
  const align = traveltrustScrollChapterSnapAlign(el);
  const rect = el.getBoundingClientRect();
  const elementTop = rect.top + window.scrollY;
  if (align === "center") {
    const elementCenter = elementTop + rect.height / 2;
    const viewportCenter = chapterSnapTargetY("center", pad);
    return Math.max(0, elementCenter - viewportCenter);
  }
  return Math.max(0, elementTop - pad);
}

export function isTraveltrustChapterScrollAnimating(): boolean {
  return typeof performance !== "undefined" && performance.now() < chapterScrollAnimUntil;
}

export function collectTraveltrustScrollChapterTargets(): HTMLElement[] {
  if (typeof document === "undefined") return [];
  const out: HTMLElement[] = [];
  for (const sel of TT_PAGE_SCROLL_CHAPTER_STEP_L5.chapterSelectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) out.push(el);
  }
  return out;
}

/** 距当前吸附锚点最近的章索引 */
export function resolveTraveltrustScrollChapterIndex(
  targets: HTMLElement[],
  pad = scrollPaddingPx(),
): number {
  if (!targets.length) return 0;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < targets.length; i++) {
    const align = traveltrustScrollChapterSnapAlign(targets[i]);
    const dist = Math.abs(
      chapterAnchorY(targets[i], align) - chapterSnapTargetY(align, pad),
    );
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export function isTraveltrustScrollChapterAligned(
  el: HTMLElement,
  pad = scrollPaddingPx(),
  threshold = TT_PAGE_SCROLL_CHAPTER_STEP_L5.alignThresholdPx,
): boolean {
  const align = traveltrustScrollChapterSnapAlign(el);
  return (
    Math.abs(chapterAnchorY(el, align) - chapterSnapTargetY(align, pad)) <= threshold
  );
}

function setChapterScrollAnimClass(active: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(TT_CHAPTER_SCROLL_ANIM_CLASS, active);
}

function cancelTraveltrustChapterScrollAnim(): void {
  if (chapterScrollRaf) {
    cancelAnimationFrame(chapterScrollRaf);
    chapterScrollRaf = 0;
  }
  chapterScrollAnimUntil = 0;
  setChapterScrollAnimClass(false);
}

function runTraveltrustChapterScrollAnim(targetY: number, durationMs: number): void {
  cancelTraveltrustChapterScrollAnim();
  const startY = window.scrollY;
  const delta = targetY - startY;
  if (Math.abs(delta) < 2) return;

  const html = document.documentElement;
  const prevBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";

  const start = performance.now();
  chapterScrollAnimUntil = start + durationMs;
  setChapterScrollAnimClass(true);

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    window.scrollTo(0, startY + delta * easeInOutCubic(t));
    if (t < 1) {
      chapterScrollRaf = requestAnimationFrame(tick);
      return;
    }
    chapterScrollRaf = 0;
    chapterScrollAnimUntil = 0;
    html.style.scrollBehavior = prevBehavior;
  };

  chapterScrollRaf = requestAnimationFrame(tick);
}

export function scrollTraveltrustScrollChapterTo(
  el: HTMLElement,
  behavior: ScrollBehavior = TT_PAGE_SCROLL_CHAPTER_STEP_L5.scrollBehavior,
): void {
  const targetY = resolveTraveltrustScrollChapterTop(el);
  if (behavior === "auto") {
    cancelTraveltrustChapterScrollAnim();
    window.scrollTo(0, targetY);
    return;
  }
  runTraveltrustChapterScrollAnim(targetY, TT_PAGE_SCROLL_CHAPTER_STEP_L5.scrollDurationMs);
}

export function resetTraveltrustPageScrollChapterStepCooldown(): void {
  stepCooldownUntil = 0;
  wheelAccum = 0;
  wheelAccumDir = 0;
  cancelTraveltrustChapterScrollAnim();
}

function consumeWheelAccum(e: WheelEvent): boolean {
  const { wheelAccumThreshold, wheelAccumResetMs } = TT_PAGE_SCROLL_CHAPTER_STEP_L5;
  const now = Date.now();
  if (now - wheelAccumLastAt > wheelAccumResetMs) {
    wheelAccum = 0;
    wheelAccumDir = 0;
  }
  wheelAccumLastAt = now;

  const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
  if (!dir) return false;
  if (wheelAccumDir !== dir) {
    wheelAccumDir = dir;
    wheelAccum = 0;
  }
  wheelAccum += e.deltaY;

  if (Math.abs(wheelAccum) < wheelAccumThreshold) return false;
  wheelAccum = 0;
  return true;
}

/**
 * 仅当**当前章已对齐吸附锚点**时，滚轮切到上一/下一章（缓动动画）。
 * 章内未对齐时交给原生滚动 + CSS snap，避免吞滚轮导致「页面不动」。
 */
export function maybeTraveltrustPageScrollChapterWheelStep(e: WheelEvent): boolean {
  const { minWheelDelta, cooldownMs, scrollDurationMs } = TT_PAGE_SCROLL_CHAPTER_STEP_L5;
  if (Math.abs(e.deltaY) < minWheelDelta) return false;

  const now = Date.now();
  if (now < stepCooldownUntil || isTraveltrustChapterScrollAnimating()) {
    if (
      document.documentElement.classList.contains(TT_PAGE_SCROLL_SNAP_L5.htmlRootClass) &&
      (now < stepCooldownUntil || isTraveltrustChapterScrollAnimating())
    ) {
      e.preventDefault();
    }
    return false;
  }

  if (!document.documentElement.classList.contains(TT_PAGE_SCROLL_SNAP_L5.htmlRootClass)) return false;

  const targets = collectTraveltrustScrollChapterTargets();
  if (targets.length < 2) return false;

  const pad = scrollPaddingPx();
  const idx = resolveTraveltrustScrollChapterIndex(targets, pad);
  const current = targets[idx];
  const aligned = isTraveltrustScrollChapterAligned(current, pad);

  const direction = e.deltaY > 0 ? 1 : -1;
  const nextIdx = idx + direction;

  /** 已吸附当前章时吞掉原生滚轮，避免 mandatory/惯性瞬间切屏 */
  if (aligned) {
    e.preventDefault();
  } else {
    return false;
  }

  if (nextIdx < 0 || nextIdx >= targets.length) return true;

  if (!consumeWheelAccum(e)) return true;

  stepCooldownUntil = now + Math.max(cooldownMs, scrollDurationMs);
  scrollTraveltrustScrollChapterTo(targets[nextIdx]);
  return true;
}

/** snap 启用后挂载：章锚点对齐时才步进 */
export function bindTraveltrustPageChapterWheelStep(): () => void {
  const onWheel = (e: WheelEvent) => {
    maybeTraveltrustPageScrollChapterWheelStep(e);
  };
  window.addEventListener("wheel", onWheel, { passive: false });
  return () => window.removeEventListener("wheel", onWheel);
}
