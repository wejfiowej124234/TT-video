"use client";

import { AdminOnboardingListPage } from "@/components/admin/AdminOnboardingListPage";
import { routes } from "@/lib/api";

export default function AdminOnboardingPaymentEventsPage() {
  return (
    <AdminOnboardingListPage
      titleKey="admin_onb_payment_events_title"
      subtitleKey="admin_onb_payment_events_subtitle_l5"
      listUrl={routes.admin.paymentEvents({ limit: 100 })}
      fetchContext="AdminOnboardingPaymentEvents"
      stripeEchoColumn
      columns={[
        { key: "id", labelKey: "admin_onb_col_id" },
        { key: "entitlement_id", labelKey: "admin_onb_col_entitlement_id" },
        { key: "event_type", labelKey: "admin_onb_col_event_type" },
        { key: "created_at", labelKey: "admin_onb_col_created_at" },
      ]}
    />
  );
}
