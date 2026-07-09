/**
 * L5 · 卡片媒体占位（与 Guides `marketCoverGradientClass` 同源）
 * fail / tiny / invalid → 稳定渐变，禁止 1×1 object-cover 铺满白板。
 */

import { marketCoverGradientClass } from "@/lib/marketMediaFallback";

export const L5_CARD_MEDIA_TINY_MAX_PX = 16;

export function l5CardMediaIsTiny(naturalWidth: number, naturalHeight: number): boolean {
  if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight)) return false;
  if (naturalWidth <= 0 || naturalHeight <= 0) return false;
  return (
    naturalWidth <= L5_CARD_MEDIA_TINY_MAX_PX || naturalHeight <= L5_CARD_MEDIA_TINY_MAX_PX
  );
}

export function l5CardMediaResolvedAcceptable(resolvedSrc: string | null | undefined): boolean {
  return Boolean((resolvedSrc ?? "").trim());
}

export type L5CardMediaLoadOutcome = "revealed" | "tiny" | "pending";

/** Decode-ready natural size → reveal / tiny / still loading. */
export function l5CardMediaOutcomeFromNaturalSize(
  naturalWidth: number,
  naturalHeight: number,
): L5CardMediaLoadOutcome {
  if (l5CardMediaIsTiny(naturalWidth, naturalHeight)) return "tiny";
  if (naturalWidth > 0 && naturalHeight > 0) return "revealed";
  return "pending";
}

/** Cached images may finish before React `onLoad` attaches — sync from `complete` + naturalWidth. */
export function l5CardMediaSyncFromImgElement(img: HTMLImageElement | null): L5CardMediaLoadOutcome {
  if (!img?.complete) return "pending";
  return l5CardMediaOutcomeFromNaturalSize(img.naturalWidth, img.naturalHeight);
}

const L5_CARD_MEDIA_CACHE_BUST_QUERY = "tt_l5_cb=1";

/** One-shot browser cache bust when stale 1×1 responses block reveal (API unchanged). */
export function l5CardMediaCacheBustSrc(src: string, attempt: 0 | 1): string {
  const s = (src ?? "").trim();
  if (!s || attempt === 0) return s;
  if (s.includes(L5_CARD_MEDIA_CACHE_BUST_QUERY)) return s;
  const sep = s.includes("?") ? "&" : "?";
  return `${s}${sep}${L5_CARD_MEDIA_CACHE_BUST_QUERY}`;
}

/** Guides parity · `bg-gradient-to-br` + seed-stable token */
export function l5CardMediaGradientShellClass(seed: string, extra = ""): string {
  const s = seed.trim() || "media";
  const grad = marketCoverGradientClass(s);
  return ["bg-gradient-to-br", grad, extra].filter(Boolean).join(" ");
}
