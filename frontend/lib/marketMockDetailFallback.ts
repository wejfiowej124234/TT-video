/** `/market` 详情抽屉 mock 回退：默认关（真实 API SSOT）；仅显式 env 时启用。 */
export function isMarketMockDetailFallbackEnabled(): boolean {
  if (typeof process === "undefined") return false;
  return process.env.NEXT_PUBLIC_MARKET_MOCK_DETAIL === "1";
}
