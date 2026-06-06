/**
 * Playwright **`request`** 写路径 **`Idempotency-Key`**（与 **`idempotency_key_layer`**、**429** 重试对齐）。
 */
export function newIdempotencyKey(label: string): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `e2e-${label}-${Date.now()}`;
}
