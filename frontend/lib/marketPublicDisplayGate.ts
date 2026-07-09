/**
 * Phase 0 · 公众市场展示 mock/showcase 闸门。
 * Staging/Production Next 构建为 `NODE_ENV=production`，默认禁止空列表注入硬编码 showcase。
 */

export function marketPublicShowcaseFallbackEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const v = (process.env.NEXT_PUBLIC_MARKET_PUBLIC_SHOWCASE_FALLBACK ?? "").trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  return true;
}
