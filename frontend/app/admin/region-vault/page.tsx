"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminRegionVaultPageMain } from "./AdminRegionVaultPageMain";

export default function AdminRegionVaultPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_region_vault_title">
      <AdminRegionVaultPageMain />
    </AdminSearchParamsSuspense>
  );
}