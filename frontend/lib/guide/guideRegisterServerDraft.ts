import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import { getAuthHeaders, parseResponse, throwUnlessApiOk, writeRequestHeaders } from "@/lib/apiClient/core";

export type GuideRegistrationServerDraft = Record<string, unknown>;

export async function getGuideRegistrationServerDraft(): Promise<GuideRegistrationServerDraft | null> {
  const res = await fetch(apiUrl(routes.meGuideRegistrationDraft), {
    headers: { ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { draft?: GuideRegistrationServerDraft };
  throwUnlessApiOk(data);
  if (!data.draft || typeof data.draft !== "object") return null;
  return data.draft;
}

/** Official REQUIRE_IDEMPOTENCY_KEY=1：PUT 须带 Idempotency-Key（同 provider draft）。 */
export async function putGuideRegistrationServerDraft(draft: GuideRegistrationServerDraft): Promise<void> {
  const res = await fetch(apiUrl(routes.meGuideRegistrationDraft), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify({ draft }),
  });
  const data = await parseResponse(res);
  throwUnlessApiOk(data);
}
