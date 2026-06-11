import { redirect } from "next/navigation";

import { apiBase, routes } from "@/lib/api";
import { serverForwardAuthHeaders } from "@/lib/serverForwardAuthHeaders";

/** ① · ADM-P0-01：RSC 预检 capabilities；403 非 admin 拒入 Shell（API 同源）。 */
export async function assertAdminConsoleServerGate(): Promise<void> {
  const headers = await serverForwardAuthHeaders();
  if (!headers["X-User-Id"]) return;

  let res: Response;
  try {
    res = await fetch(`${apiBase}${routes.admin.capabilities}`, {
      headers: { ...headers, Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return;
  }

  if (res.status === 401) {
    // PG/严格会话下 X-User-Id 预检常为 401；浏览器 Bearer 会话由客户端 gate 裁定，勿 SSR 抢跳登录。
    return;
  }
  if (res.status === 403) {
    redirect("/market?admin_access=denied");
  }
}
