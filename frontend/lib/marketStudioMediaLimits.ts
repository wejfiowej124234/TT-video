/**
 * 市场子站「橱窗 / 收购」创作台共用体限（浏览器演示路径）。
 *
 * ## 三方对齐表（#6 Inventory · Local SSOT）
 *
 * | Surface | Cover max | Promo video max | SSOT |
 * |---------|-----------|-----------------|------|
 * | FE Studio | `MARKET_STUDIO_COVER_MAX_BYTES` (2MB) | `MARKET_STUDIO_PROMO_VIDEO_MAX_BYTES` (32MB) | this file |
 * | i18n | — | `market_*Studio_*_hint`「≤32MB」 | `locales/zh.ts` · `en.ts` |
 * | API community video | capability `max_video_bytes` | env/`max_asset_bytes` (multipart path) | `community/media_capabilities.rs` |
 *
 * Acquisition Studio **must** import this constant (not hardcode 20MB).
 * Change values only with same-batch i18n + Vitest + Inventory note.
 * **Forbidden:** refill Batch-9 `ADMIN_HOME_CARDS`.
 */
export const MARKET_STUDIO_COVER_MAX_BYTES = 2 * 1024 * 1024;

export const MARKET_STUDIO_PROMO_VIDEO_MAX_BYTES = 32 * 1024 * 1024;

export const MARKET_STUDIO_PROMO_VIDEO_MAX_MB = Math.floor(
  MARKET_STUDIO_PROMO_VIDEO_MAX_BYTES / (1024 * 1024),
);
