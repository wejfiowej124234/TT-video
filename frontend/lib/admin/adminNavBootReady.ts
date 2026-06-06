import { adminSubpageBootBlocked } from "@/lib/admin/adminCapabilitiesBootState";

import type { AdminCapabilitiesValue } from "@/lib/admin/useAdminCapabilities";



/** 会话 capabilities 已就绪：子页切页可走 frozen + 轻量 loading，不再整页 boot 骨架。 */

export function adminNavBootReady(caps: Pick<
  AdminCapabilitiesValue,
  "loading" | "permissionsLoaded" | "capabilitiesUnavailable"
>): boolean {
  if (caps.capabilitiesUnavailable) return false;
  return !adminSubpageBootBlocked({
    loading: caps.loading,
    permissionsLoaded: caps.permissionsLoaded,
    capabilitiesUnavailable: caps.capabilitiesUnavailable,
  });
}


