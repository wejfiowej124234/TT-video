"use client";

import { AdminConfigPlatformPageShell } from "@/components/admin/AdminConfigPlatformPageShell";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminInternalToolAuditsPageMain } from "./AdminInternalToolAuditsPageMain";

export default function AdminInternalToolAuditsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_tool_audits_title">
      <AdminConfigPlatformPageShell currentLabelKey="admin_tool_audits_title">
        <AdminInternalToolAuditsPageMain />
      </AdminConfigPlatformPageShell>
    </AdminSearchParamsSuspense>
  );
}
