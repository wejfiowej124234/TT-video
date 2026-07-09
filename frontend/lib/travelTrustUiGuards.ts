/**
 * Production UI guards for chain-off-only developer surfaces (`POST …/orders/:id/mock-pay` on `/pay`,
 * mock TTG swap on `/traveltrust`, and the escrow REST `confirm-completion` shortcut).
 *
 * **Opt-in only (all environments):** `NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI=1`.
 * Staging/production Dockerfiles default **`0`**; local engineering may set **`1`** in `.env.local`.
 * Runtime still requires **GET /meta** `orders.order_mock_pay_enabled === true` where applicable.
 */
export function allowChainOffMockPayUi(): boolean {
  return process.env.NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI === "1";
}

/** Public governance hub: hide Admin console deep links unless explicitly enabled for local ops. */
export function allowGovernanceOpsAdminNavLinks(): boolean {
  return process.env.NEXT_PUBLIC_TRAVELTRUST_ALLOW_GOVERNANCE_OPS_ADMIN_LINKS === "1";
}

/** `/traveltrust` L5 spacing debug chrome — opt-in only; `?tt_spacing=1` always mounts when present. */
export function allowTravelTrustSpacingDebugChrome(): boolean {
  return process.env.NEXT_PUBLIC_TRAVELTRUST_ALLOW_TRAVELTRUST_SPACING_DEBUG === "1";
}
