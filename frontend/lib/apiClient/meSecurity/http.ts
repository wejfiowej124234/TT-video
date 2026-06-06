/**
 * **账户安全**（**`GET|DELETE …/me/sessions*`**、**`GET …/security-notifications`**；**`routes/me.rs`**）。
 *
 * **无 `chain_off`** → **503** **`chain_off_unavailable`**（路径见响应 **`path`**，如 **`GET …/security-notifications`**、**`DELETE …/sessions/…`**）。**须登录** → **401** **`login_required`**。
 * **会话**：**有 `chain_off` 无 PG 池** → **200** **`items:[]`** + **`meta.implementation_status: sessions_db_unavailable`**。
 * **安全通知**：**无池**（有 **`chain_off`**）→ **200** 空 **`items`** + **`user_security_notifications_db_unavailable`**；DB 读失败 → **503** **`me_security_notifications_db_read_failed`**（**`parseResponse`** 抛稳定码）。
 * 写操作经 **`writeRequestHeaders`**（**`getAuthHeaders` + 幂等**）。
 */

import { apiUrl, routes } from "../../api";
import { requestId, parseResponse, getAuthHeaders, writeRequestHeaders, logApiJsonStatusNotOk, throwUnlessApiOk } from "../core";
import type { GetMeSecurityNotificationsParams } from "./types";

export async function getMeSessions(): Promise<unknown> {
  const res = await fetch(apiUrl(routes.meSessions), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeSessions", data);
  throwUnlessApiOk(data);
  return data;
}

export async function getMeSecurityNotifications(params?: GetMeSecurityNotificationsParams): Promise<unknown> {
  const res = await fetch(apiUrl(routes.meSecurityNotifications(params)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeSecurityNotifications", data);
  throwUnlessApiOk(data);
  return data;
}

export async function deleteMeSessionCurrent(): Promise<unknown> {
  const res = await fetch(apiUrl(routes.meSessionCurrent), {
    method: "DELETE",
    headers: { "x-request-id": requestId(), ...writeRequestHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("deleteMeSessionCurrent", data);
  throwUnlessApiOk(data);
  return data;
}

export async function deleteMeSessionBySuffix(suffix: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.meSessionBySuffix(suffix)), {
    method: "DELETE",
    headers: { "x-request-id": requestId(), ...writeRequestHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("deleteMeSessionBySuffix", data);
  throwUnlessApiOk(data);
  return data;
}
