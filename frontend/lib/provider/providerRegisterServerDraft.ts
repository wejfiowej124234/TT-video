import { API_ROUTES } from "@/lib/api/routes";
import { getAuthHeaders, parseResponse, writeRequestHeaders } from "@/lib/apiClient/core";

export async function getProviderRegistrationServerDraft(): Promise<{ draft: Record<string, unknown> }> {
  const res = await fetch(API_ROUTES.meProviderRegistrationDraft, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  const data = await parseResponse(res);
  const draft = (data as { draft?: Record<string, unknown> }).draft;
  return { draft: draft && typeof draft === "object" ? draft : {} };
}

/**
 * Official `REQUIRE_IDEMPOTENCY_KEY=1`：缺幂等键 → HTTP 400 `missing_idempotency_key`。
 * PUT 必须走 `writeRequestHeaders`（Idempotency-Key + X-Idempotency-Key）。
 */
export async function putProviderRegistrationServerDraft(draft: Record<string, unknown>): Promise<void> {
  const res = await fetch(API_ROUTES.meProviderRegistrationDraft, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    credentials: "include",
    body: JSON.stringify({ draft }),
  });
  await parseResponse(res);
}
