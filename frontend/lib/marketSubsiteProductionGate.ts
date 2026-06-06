/**
 * 自由市场子站（94）：**默认**禁止「目录 API 未命中 → 内置演示 slug」回退，
 * 避免空库/404 时仍展示硬编码演示 masonry（与 API 公众 catalog 分离同源）。
 * 预览/storybook 显式设 **`NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK=1`** 恢复。
 */

export function marketSubsiteDemoStudioFallbackEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK ?? "").trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return v === "1" || v === "true" || v === "yes" || v === "on";
}
