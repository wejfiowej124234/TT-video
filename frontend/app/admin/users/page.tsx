"use client";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminUsersPageMain } from "./AdminUsersPageMain";
import { useAdminUsersPage } from "./useAdminUsersPage";

function AdminUsersPageInner() {
  const vm = useAdminUsersPage();
  return (
    <>
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.USERS_READ} />
      <AdminUsersPageMain vm={vm} />
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_users_title">
      <AdminUsersPageInner />
    </AdminSearchParamsSuspense>
  );
}
