"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminInternalToolAuditsPageMain } from "./AdminInternalToolAuditsPageMain";

export default function AdminInternalToolAuditsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_tool_audits_title">
      <AdminInternalToolAuditsPageMain />
    </AdminSearchParamsSuspense>
  );
}
