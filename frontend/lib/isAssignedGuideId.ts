/** 非空且非 nil UUID 的 guide_id（与 Escrow `hasGuideAssigned` / 市场绑定向导同源） */
export function isAssignedGuideId(raw: unknown): boolean {
  const g = String(raw ?? "").trim();
  if (!g) return false;
  if (/^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(g)) return false;
  return /[1-9a-fA-F]/.test(g);
}

/** 订单已保存并发布到 discover（Draft→Created） */
export function isOrderPublishedToDiscover(raw: unknown): boolean {
  const s = String(raw ?? "").trim().toLowerCase();
  return s === "created" || s === "open";
}

/** 与 chain_off `order_eligible_for_discover_market` 同源：Draft + Created/open，且由调用方再判 guide_id */
export function isOrderEligibleForDiscoverMarketState(raw: unknown): boolean {
  const s = String(raw ?? "").trim().toLowerCase();
  return s === "draft" || s === "created" || s === "open";
}
