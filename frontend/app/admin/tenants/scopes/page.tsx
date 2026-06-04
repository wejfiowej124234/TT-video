"use client";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminTenantScopesPageMain } from "./AdminTenantScopesPageMain";

export default function AdminTenantScopesPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_tenant_scopes_title">
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.PLATFORM_PUBLISH}
        messageKey="admin_perm_denied_platform_publish"
      />
      <AdminTenantScopesPageMain />
    </AdminSearchParamsSuspense>
  );
}
