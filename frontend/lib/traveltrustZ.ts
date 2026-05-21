/**
 * `/traveltrust` 全页固定叠层 z-index（仅整数）。
 * 禁止 `z-[9.58]` 等小数 arbitrary — 浏览器会当作 `auto`，叠层会落到 Canvas 后方。
 */
export const TT_Z = {
  /** 超宽屏左右护板 · 低于正文 */
  VIEWPORT_INK: 2,
  /** Hero letterbox / 暖墨背板 · 低于 WebGL */
  GLOBE_UNDERLAY: 8,
  /** 固定全页 WebGL Canvas */
  CANVAS: 9,
  /** #hero 区块 · 折叠 bleed 正文带（透明；球区透出 WebGL） */
  HERO_SKY: 10,
  /** 右栏文案 shell（在 #hero 内） */
  HERO_COPY: 12,
  /**
   * 固定全视口暖墨天幕 · 须在 #hero（z=10）与 HERO_COPY（z=12）之上，
   * 否则后绘制的 #hero 透明区仍叠在 canvas 冷色上。
   */
  HERO_SKY_WASH: 13,
  /** layout / 剧场 sticky · 正文 isolate */
  CONTENT: 20,
  /** shell 胶片颗粒 */
  GRAIN: 24,
  /** landing nav · brief banner · reduced-motion notice */
  NAV: 25,
} as const;

export type TtZLayer = (typeof TT_Z)[keyof typeof TT_Z];

/** Tailwind `z-[n]` — `n` 须来自 `TT_Z` */
export function ttZClass(z: TtZLayer): string {
  return `z-[${z}]`;
}

export function ttZStyle(z: TtZLayer): { zIndex: number } {
  return { zIndex: z };
}
