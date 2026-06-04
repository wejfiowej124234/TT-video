"use client";

import { AdminOnboardingListPage } from "@/components/admin/AdminOnboardingListPage";
import { routes } from "@/lib/api";

export default function AdminOnboardingEntitlementsPage() {
  return (
    <AdminOnboardingListPage
      titleKey="admin_onb_entitlements_title"
      subtitleKey="admin_onb_entitlements_subtitle"
      listUrl={routes.admin.entitlements({ limit: 100 })}
      fetchContext="AdminOnboardingEntitlements"
      detailHref={(row) =>
        typeof row.id === "string" && row.id ? `/admin/onboarding/entitlements/${encodeURIComponent(row.id)}` : null
      }
      columns={[
        { key: "id", labelKey: "admin_onb_col_id" },
        { key: "user_id", labelKey: "admin_onb_col_user_id" },
        { key: "role_target", labelKey: "admin_onb_col_role_target" },
        { key: "status", labelKey: "admin_onb_col_status" },
        { key: "sku", labelKey: "admin_onb_col_sku" },
      ]}
    />
  );
}
