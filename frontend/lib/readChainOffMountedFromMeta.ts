/**
 * Reads whether the API has chain_off mounted (real guides/orders/discover data paths).
 * SSOT: GET /meta `order_messages.chain_off_mounted` (see crates/api health_meta tests).
 */
export function readChainOffMountedFromMeta(meta: Record<string, unknown> | null | undefined): boolean | null {
  if (!meta || typeof meta !== "object") return null;
  const om = meta.order_messages;
  if (om && typeof om === "object") {
    const v = (om as Record<string, unknown>).chain_off_mounted;
    if (typeof v === "boolean") return v;
  }
  return null;
}
