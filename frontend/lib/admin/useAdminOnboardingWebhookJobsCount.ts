"use client";

import { useCallback, useEffect, useState } from "react";

import { extractWebhookStripeEcho } from "@/lib/admin/adminOnboardingWebhookStripeEcho";
import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";
import { routes } from "@/lib/api";

export type OnboardingWebhookLedgerLatest = {
  id: string;
  status: string;
  stripeEventType: string | null;
  providerEventId: string | null;
} | null;

/** ① 本地 webhook 台账摘要（best-effort · 非 ② Stripe 真回显）。 */
export function useAdminOnboardingWebhookJobsCount() {
  const [count, setCount] = useState<number | null>(null);
  const [latest, setLatest] = useState<OnboardingWebhookLedgerLatest>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    setError(false);
    void fetchAdminQueueList<{ items?: Record<string, unknown>[] }>(
      "AdminOnboardingWebhookLedger",
      routes.admin.webhookJobs({ limit: 25 }),
    )
      .then(({ items, errorKind }) => {
        if (errorKind) {
          setError(true);
          setCount(null);
          setLatest(null);
          return;
        }
        const rows = items ?? [];
        setCount(rows.length);
        const first = rows[0];
        if (first && typeof first.id === "string") {
          const stripe = extractWebhookStripeEcho(first);
          setLatest({
            id: first.id,
            status: typeof first.status === "string" ? first.status : "—",
            stripeEventType: stripe.eventType,
            providerEventId: stripe.providerEventId,
          });
        } else {
          setLatest(null);
        }
      })
      .catch(() => {
        setError(true);
        setCount(null);
        setLatest(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { count, latest, loading, error, reload };
}
