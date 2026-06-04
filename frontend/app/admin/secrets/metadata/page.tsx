"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminSecretsMetadataPageMain } from "./AdminSecretsMetadataPageMain";

export default function AdminSecretsMetadataPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_secrets_meta_title">
      <AdminSecretsMetadataPageMain />
    </AdminSearchParamsSuspense>
  );
}
