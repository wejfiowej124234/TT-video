"use client";

import { AdminConfigPlatformPageShell } from "@/components/admin/AdminConfigPlatformPageShell";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminMediaSignedUrlTokensPageMain } from "./AdminMediaSignedUrlTokensPageMain";

export default function AdminMediaSignedUrlTokensPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_media_signed_url_tokens_title">
      <AdminConfigPlatformPageShell currentLabelKey="admin_media_signed_url_tokens_title">
        <AdminMediaSignedUrlTokensPageMain />
      </AdminConfigPlatformPageShell>
    </AdminSearchParamsSuspense>
  );
}
