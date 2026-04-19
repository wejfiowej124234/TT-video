/**
 * P06：`GET /meta` `orders.order_mock_pay_enabled` 与后端 `ChainOffConfig.order_mock_pay_enabled`（`P3_CHAIN_OFF=1`）同源。
 */
export function readOrderMockPayEnabledFromMeta(meta: Record<string, unknown> | null): boolean {
  if (!meta) return false;
  const orders = meta.orders;
  if (!orders || typeof orders !== "object") return false;
  return (orders as Record<string, unknown>).order_mock_pay_enabled === true;
}
