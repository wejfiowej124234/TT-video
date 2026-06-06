import { apiUrl } from "../../api";
import { routes } from "../../api/routes";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "../core/index";

const fetch = apiFetch;

/** **`POST /api/v1/onboarding/local-dev/mark-paid`**：① 本地模拟 PSP webhook（须 env 双开 + PG）。 */
export async function postOnboardingLocalDevMarkPaid(idempotencyKey: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.onboardingLocalDevMarkPaid), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ idempotency_key: idempotencyKey }),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOnboardingLocalDevMarkPaid", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}
