"use client";

import { AdminOnboardingListPage } from "@/components/admin/AdminOnboardingListPage";
import { routes } from "@/lib/api";

export default function AdminOnboardingWebhookJobsPage() {
  return (
    <AdminOnboardingListPage
      titleKey="admin_onb_webhook_jobs_title"
      subtitleKey="admin_onb_webhook_jobs_subtitle"
      listUrl={routes.admin.webhookJobs({ limit: 100 })}
      fetchContext="AdminOnboardingWebhookJobs"
      webhookStripeEcho
      columns={[
        { key: "id", labelKey: "admin_onb_col_id" },
        { key: "user_id", labelKey: "admin_onb_col_user_id" },
        { key: "status", labelKey: "admin_onb_col_status" },
        { key: "event_type", labelKey: "admin_onb_col_event_type" },
      ]}
    />
  );
}
