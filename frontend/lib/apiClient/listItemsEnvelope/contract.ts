/**
 * 多域列表读路径共用：`throwUnlessApiOk` 之后 **`items` 须为数组**（可为 `[]`），避免缺字段被当成「空列表」。
 */

export const TRAVELTRUST_API_LIST_ITEMS_CONTRACT_INVALID = "TRAVELTRUST_API_LIST_ITEMS_CONTRACT_INVALID";

export function requireApiItemsArrayAfterOk(data: unknown): unknown[] {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(TRAVELTRUST_API_LIST_ITEMS_CONTRACT_INVALID);
  }
  const o = data as Record<string, unknown>;
  if (!("items" in o) || !Array.isArray(o.items)) {
    throw new Error(TRAVELTRUST_API_LIST_ITEMS_CONTRACT_INVALID);
  }
  return o.items;
}

/**
 * 社区等：`status: "degraded"` 不校验列表字段；**仅** `status === "ok"` 时要求 `field` 存在且为数组（可为 `[]`）。
 */
export function assertApiListArrayWhenEnvelopeOk(data: unknown, field: string): void {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(TRAVELTRUST_API_LIST_ITEMS_CONTRACT_INVALID);
  }
  const o = data as Record<string, unknown>;
  if (o.status !== "ok") return;
  if (!(field in o) || !Array.isArray(o[field])) {
    throw new Error(TRAVELTRUST_API_LIST_ITEMS_CONTRACT_INVALID);
  }
}
