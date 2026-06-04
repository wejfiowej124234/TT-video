"use client";

import { AdminOnboardingStripePhase2Notice } from "@/components/admin/AdminOnboardingStripePhase2Notice";
import { useAdminOnboardingWebhookJobsCount } from "@/lib/admin/useAdminOnboardingWebhookJobsCount";

/** ONB-04 · Webhook 台账横幅（仅 webhook-jobs 列表页挂载）。 */
export function AdminOnboardingWebhookStripeEchoStrip() {
  const ledger = useAdminOnboardingWebhookJobsCount();
  return (
    <AdminOnboardingStripePhase2Notice
      webhookJobsCount={ledger.count}
      webhookJobsLoading={ledger.loading}
      webhookJobsError={ledger.error}
      webhookLatestId={ledger.latest?.id ?? null}
      webhookLatestStatus={ledger.latest?.status ?? null}
      webhookStripeEventType={ledger.latest?.stripeEventType ?? null}
      webhookProviderEventId={ledger.latest?.providerEventId ?? null}
      onWebhookReload={ledger.reload}
    />
  );
}
