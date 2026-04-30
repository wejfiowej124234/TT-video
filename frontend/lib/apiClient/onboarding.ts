/**
 * 96-18 准入费 API（Partial；与 `routes.onboarding`、04 §3.4 / 04-附录 对读）。
 * 读：quote / entitlements；写：payment-intents（须幂等头）、role-confirm。
 */

import { apiUrl, routes } from "../api";
import {
  apiFetch,
  requestId,
  parseResponse,
  getAuthHeaders,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "./core";

const fetch = apiFetch;

export type OnboardingQuoteRole = "provider" | "region_steward";

export type OnboardingPaymentIntentBody = {
  role: OnboardingQuoteRole;
  sku?: string;
  return_url?: string;
};

export async function getOnboardingQuote(role: OnboardingQuoteRole = "provider"): Promise<unknown> {
  const q = new URLSearchParams();
  q.set("role", role);
  const url = `${apiUrl(routes.onboardingQuote)}?${q}`;
  const res = await fetch(url, { headers: { "x-request-id": requestId(), ...getAuthHeaders() } });
  const data = (await parseResponse(res)) as { status?: string };
  logApiJsonStatusNotOk("getOnboardingQuote", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

export async function getOnboardingEntitlementsMe(): Promise<unknown> {
  const res = await fetch(apiUrl(routes.onboardingEntitlementsMe), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string };
  logApiJsonStatusNotOk("getOnboardingEntitlementsMe", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

/** `POST /api/v1/onboarding/payment-intents` — 有 PG 时须 **`Idempotency-Key`**（经 **`writeRequestHeaders`**）。 */
export async function postOnboardingPaymentIntent(
  body: OnboardingPaymentIntentBody,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.onboardingPaymentIntents), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
      ...writeRequestHeaders(idempotencyKey),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOnboardingPaymentIntent", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

/** `POST /api/v1/onboarding/role-confirm` — body **`{ role }`**；有 PG 时校验 **paid** 资格。 */
export async function postOnboardingRoleConfirm(
  role: OnboardingQuoteRole,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.onboardingRoleConfirm), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
      ...writeRequestHeaders(idempotencyKey),
    },
    body: JSON.stringify({ role }),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOnboardingRoleConfirm", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}
