/**
 * 自由市场子站（94）：**production** 构建默认禁止「目录 API 未命中 → 内置演示 slug」SSR 回退，
 * 避免可分享 URL 在空库/404 时仍展示演示内容（IA / 合规风险）。
 * 预览/storybook 式环境显式设 **`NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK=1`** 恢复。
 */

export function marketSubsiteDemoStudioFallbackEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const v = (process.env.NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}
