/**
 * TT-PH1-182 · Playwright 视觉回归基线文件名（①）
 * 生成：`npm run e2e:traveltrust-visual:update`
 * 稳定模式：E2E 遮罩 `data-tt-traveltrust-page-cinematic-3d` + reduced-motion（非融资级真 3D 像素对拍）。
 */
export const TRAVELTRUST_VISUAL_SNAPSHOT_DIR =
  "e2e/traveltrust-hero-visual-regression.spec.ts-snapshots";

/** Playwright 默认 project 名（chromium） */
export const TRAVELTRUST_VISUAL_DEFAULT_PROJECT = "chromium";

/** Desktop basenames (no OS suffix). Mobile on Windows gets `-win32` from Playwright. */
export const TRAVELTRUST_VISUAL_SNAPSHOT_BASENAMES = [
  "traveltrust-hero-desktop-chromium.png",
  "traveltrust-roles-desktop-chromium.png",
  "traveltrust-start-desktop-chromium.png",
  "traveltrust-hero-mobile-375-chromium-win32.png",
  "traveltrust-hero-mobile-390-chromium-win32.png",
] as const;

export const TRAVELTRUST_VISUAL_SNAPSHOT_BASENAMES_LINUX = [
  "traveltrust-hero-mobile-375-chromium.png",
  "traveltrust-hero-mobile-390-chromium.png",
] as const;
