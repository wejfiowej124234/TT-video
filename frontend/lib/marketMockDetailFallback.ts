/** `/market` 详情抽屉 mock 回退：默认关（真实 API SSOT）；Staging/Prod 禁用。 */
export function isMarketMockDetailFallbackEnabled(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_MARKET_MOCK_DETAIL === "1";
}
