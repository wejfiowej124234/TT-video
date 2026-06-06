/**
 * 市场子站「橱窗 / 收购」创作台共用体限（浏览器演示路径）。
 * 与 `market_merchantStudio_video_file_hint` 等 i18n 中的 32MB 叙述对齐；改数值须同批改文案与 Vitest。
 */
export const MARKET_STUDIO_COVER_MAX_BYTES = 2 * 1024 * 1024;

export const MARKET_STUDIO_PROMO_VIDEO_MAX_BYTES = 32 * 1024 * 1024;

export const MARKET_STUDIO_PROMO_VIDEO_MAX_MB = Math.floor(
  MARKET_STUDIO_PROMO_VIDEO_MAX_BYTES / (1024 * 1024),
);
