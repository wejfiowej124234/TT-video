import { getAuthHeaders } from "./authSession";

/** 50-F2：幂等键，所有 POST/PUT 写操作须带此头；未传时每请求生成新 key */
export function getIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function requestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** 50-F2：写请求统一头（含 x-request-id、鉴权、Idempotency-Key）；所有 POST/PUT 使用 */
export function writeRequestHeaders(idempotencyKey?: string): Record<string, string> {
  const h: Record<string, string> = { "x-request-id": requestId(), ...getAuthHeaders() };
  const key = idempotencyKey ?? getIdempotencyKey();
  h["Idempotency-Key"] = key;
  h["X-Idempotency-Key"] = key;
  return h;
}
