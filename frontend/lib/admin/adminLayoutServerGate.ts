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
    redirect("/auth/login?returnUrl=%2Fadmin");
  }
  if (res.status === 403) {
    redirect("/market?admin_access=denied");
  }
}
