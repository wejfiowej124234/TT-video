/**
 * Production UI guards for chain-off-only developer surfaces (`POST …/orders/:id/mock-pay` on `/pay`,
 * and the escrow REST `confirm-completion` shortcut wired beside EIP-712 intents).
 *
 * - **`NODE_ENV=production`**：`NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI` 必须为 **`"1"`** 才展示；与 **95 F-010**、根 `.env.example` 叙述一致。
 * - **非 production**：默认可见；仍须 **GET /meta** `orders.order_mock_pay_enabled === true` 且后端未拒绝（见 `readOrderMockPayEnabledFromMeta`）。
 */
export function allowChainOffMockPayUi(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI === "1";
  }
  return true;
}
