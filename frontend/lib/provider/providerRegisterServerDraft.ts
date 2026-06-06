import { API_ROUTES } from "@/lib/api/routes";
import { getAuthHeaders, parseResponse } from "@/lib/apiClient/core";

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

export async function putProviderRegistrationServerDraft(draft: Record<string, unknown>): Promise<void> {
  const res = await fetch(API_ROUTES.meProviderRegistrationDraft, {
    method: "PUT",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ draft }),
  });
  await parseResponse(res);
}
