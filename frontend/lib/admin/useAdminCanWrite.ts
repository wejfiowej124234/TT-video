"use client";

import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";

export function useAdminCanWrite(permission: AdminPermissionId) {
  const caps = useAdminCapabilities();
  return {
    canWrite: caps.permissionsLoaded && caps.hasPermission(permission),
    loading: caps.loading,
    capabilitiesUnavailable: caps.capabilitiesUnavailable,
    permissionsLoaded: caps.permissionsLoaded,
    caps,
  };
}
