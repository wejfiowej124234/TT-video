/**
 * 账户安全：会话列表、安全通知、按后缀/当前会话下线（路径与 `routes` 同源；后端未挂载时请求会失败，页面展示错误态）。
 */

import { apiUrl, routes } from "../api";
import { requestId, parseResponse, getAuthHeaders, writeRequestHeaders, logApiJsonStatusNotOk, throwUnlessApiOk } from "./core";

export async function getMeSessions(): Promise<unknown> {
  const res = await fetch(apiUrl(routes.meSessions), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeSessions", data);
  throwUnlessApiOk(data);
  return data;
}

export type GetMeSecurityNotificationsParams = {
  limit?: number;
  status?: string;
  event_type?: string;
};

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
