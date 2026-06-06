"use client";

import {
  clearGetMeCache,
  getAuthHeaders,
  getMe,
  getMeFull,
  isMeFullRequestError,
  type GetMeFullOptions,
} from "@/lib/apiClient";
import { userFromGetMePayload } from "@/lib/meTrust";

/** 与顶栏 `useHeaderSession` / `getMe` 同源：本地是否有可探测的账户凭证。 */
export function hasAccountSessionCredentials(): boolean {
  const auth = getAuthHeaders();
  return !!(auth.Authorization || auth["X-User-Id"]);
}

/** `GET /me` 探测：无凭证或无效用户 → false。 */
export async function probeAccountLoggedInViaGetMe(): Promise<boolean> {
  if (!hasAccountSessionCredentials()) return false;
  try {
    const me = await getMe();
    return !!userFromGetMePayload(me)?.id;
  } catch {
    return false;
  }
}

/** `getMeFull` 探测：无凭证 → null；网络类错误上抛。 */
export async function probeAccountMeViaGetMeFull(
  opts?: GetMeFullOptions,
): Promise<unknown | null> {
  if (!hasAccountSessionCredentials()) return null;
  try {
    return await getMeFull(opts);
  } catch (e) {
    if (isMeFullRequestError(e)) return null;
    throw e;
  }
}

/** 登录/登出/写会话后广播；监听方须 `clearGetMeCache` 后重探。 */
export function onAccountSessionChange(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    clearGetMeCache();
    listener();
  };
  window.addEventListener("traveltrust:auth-change", handler);
  return () => window.removeEventListener("traveltrust:auth-change", handler);
}
