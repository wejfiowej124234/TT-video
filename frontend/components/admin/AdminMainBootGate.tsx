"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import AdminSubpageRouteLoading from "@/components/admin/AdminSubpageRouteLoading";
import { adminSubpageBootBlocked } from "@/lib/admin/adminCapabilitiesBootState";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";

/** ① batch56 · 全 Admin 子树 capabilities boot：硬刷新时不闪占位页身/假数据。 */
export function AdminMainBootGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const caps = useAdminCapabilities();
  const onWorkspace = pathname === "/admin";

  if (onWorkspace) {
    return <>{children}</>;
  }

  if (
    adminSubpageBootBlocked({
      loading: caps.loading,
      permissionsLoaded: caps.permissionsLoaded,
      capabilitiesUnavailable: caps.capabilitiesUnavailable,
    })
  ) {
    return (
      <AdminSubpageRouteLoading
        variant="table-wide"
        mainAriaLabelKey="admin_workspace_title"
      />
    );
  }

  return <>{children}</>;
}
