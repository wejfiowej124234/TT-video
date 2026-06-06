/**
 * **96-18 准入费**（与 **`crates/api/src/routes/onboarding/`**（瘦 **`mod.rs`** + **`quote`/`payment_intents`/…**）、**04** §3.4 / **04-附录** 对读；各环境同一进程配置，**测试网/公网** 仅差 env/PSP，**不**差 HTTP 分岔语义）。
 *
 * **chain_off**：**无 `chain_off`** 时 **`GET …/quote`**、**`GET …/entitlements/me`**、**`POST …/payment-intents`**、**`POST …/role-confirm`** 均 **503** 根级 **`chain_off_unavailable`**（**`parseResponse`** → 抛 **`chain_off_unavailable`**，与 **`onboarding.http.test`** 一致）。
 * **有 `chain_off` 无 PG 池**：**payment-intents** 常 **503** **`onboarding_payment_not_configured`**；**entitlements/me** / **role-confirm** 走各自 stub 或读库路径（见实现）。
 * **须登录**（**`writeRequestHeaders`** 内含 **`getAuthHeaders`**）：**payment-intents** / **role-confirm** 未会话 → **401** **`login_required`**；会话存储不可用 → **503** **`service_unavailable`**。
 * **quote**：**`role`** 仅 **`provider`** / **`region_steward`**，否则 **400** **`invalid_onboarding_role`**；**不**强制登录（与路由一致）。
 */

import { apiUrl } from "../../api";
import { routes } from "../../api/routes";
import {
  apiFetch,
  getAuthHeaders,
  logApiJsonStatusNotOk,
  parseResponse,
  requestId,
  throwUnlessApiOk,
  writeRequestHeaders,
} from "../core/index";
import type {
  OnboardingPaymentIntentBody,
  OnboardingQuoteQuery,
  OnboardingQuoteRole,
} from "./types";

const fetch = apiFetch;

/** **`GET /api/v1/onboarding/quote?role=…`**：无 **chain_off** → **503** **`chain_off_unavailable`**；非法 **role** → **400** **`invalid_onboarding_role`**；**`region_steward`** 须 **`jurisdictions`**（**`fee_schedule_v1`**）。 */
export async function getOnboardingQuote(
  role: OnboardingQuoteRole = "provider",
  query?: OnboardingQuoteQuery
): Promise<unknown> {
  const q = new URLSearchParams();
  q.set("role", role);
  if (query?.jurisdictions?.trim()) q.set("jurisdictions", query.jurisdictions.trim());
  if (query?.fee_schedule_version?.trim()) {
    q.set("fee_schedule_version", query.fee_schedule_version.trim());
  }
  if (query?.sku?.trim()) q.set("sku", query.sku.trim());
  const url = `${apiUrl(routes.onboardingQuote)}?${q}`;
  const res = await fetch(url, { headers: { "x-request-id": requestId(), ...getAuthHeaders() } });
  const data = (await parseResponse(res)) as { status?: string };
  logApiJsonStatusNotOk("getOnboardingQuote", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

/** **`GET /api/v1/onboarding/entitlements/me`**：无 **chain_off** → **503** **`chain_off_unavailable`**；有池时读 **`onboarding_entitlements`**（**04** / 模块头 doc）。 */
export async function getOnboardingEntitlementsMe(): Promise<unknown> {
  const res = await fetch(apiUrl(routes.onboardingEntitlementsMe), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string };
  logApiJsonStatusNotOk("getOnboardingEntitlementsMe", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}

/**
 * **`POST /api/v1/onboarding/payment-intents`**：须 **`Idempotency-Key`**（**`writeRequestHeaders`**）；须登录 **401**；无 **chain_off** → **503** **`chain_off_unavailable`**；无 PG → **503** **`onboarding_payment_not_configured`**；**`ONBOARDING_PAYMENT_INTENTS_DISABLED=1`** → **503** **`onboarding_payment_intents_disabled`**（详见 **`onboarding/mod.rs`**）。
 */
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

/**
 * **`POST /api/v1/onboarding/role-confirm`**：**body** **`{ role }`**；**`Idempotency-Key`**；须登录；无 **chain_off** → **503** **`chain_off_unavailable`**；资格/幂等/写库错误码见实现与 **04**。
 */
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
