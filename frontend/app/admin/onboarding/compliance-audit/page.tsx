"use client";

import { AdminOnboardingListPage } from "@/components/admin/AdminOnboardingListPage";
import { routes } from "@/lib/api";

export default function AdminOnboardingComplianceAuditPage() {
  return (
    <AdminOnboardingListPage
      titleKey="admin_onb_compliance_title"
      subtitleKey="admin_onb_compliance_subtitle"
      listUrl={routes.admin.complianceAuditEvents({ limit: 100 })}
      fetchContext="AdminOnboardingComplianceAudit"
      columns={[
        { key: "id", labelKey: "admin_onb_col_id" },
        { key: "user_id", labelKey: "admin_onb_col_user_id" },
        { key: "event_type", labelKey: "admin_onb_col_event_type" },
        { key: "created_at", labelKey: "admin_onb_col_created_at" },
      ]}
    />
  );
}
