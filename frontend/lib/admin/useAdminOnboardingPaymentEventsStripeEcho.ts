"use client";

import { useCallback, useEffect, useState } from "react";

import { extractWebhookStripeEcho } from "@/lib/admin/adminOnboardingWebhookStripeEcho";
import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";
import { routes } from "@/lib/api";

export type PaymentEventsStripeEchoSummary = {
  total: number;
  withEcho: number;
  latestEventType: string | null;
  latestProviderEventId: string | null;
};

/** ONB-04 · ① payment-events 台账 Stripe 回显摘要（非 ② 真 webhook）。 */
export function useAdminOnboardingPaymentEventsStripeEcho() {
  const [summary, setSummary] = useState<PaymentEventsStripeEchoSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    setError(false);
    void fetchAdminQueueList<{ items?: Record<string, unknown>[] }>(
      "AdminOnboardingPaymentEventsStripeEcho",
      routes.admin.paymentEvents({ limit: 50 }),
    )
      .then(({ items, errorKind }) => {
        if (errorKind) {
          setError(true);
          setSummary(null);
          return;
        }
        const rows = items ?? [];
        let withEcho = 0;
        let latestEventType: string | null = null;
        let latestProviderEventId: string | null = null;
        for (const row of rows) {
          const echo = extractWebhookStripeEcho(row);
          if (echo.eventType || echo.providerEventId) {
            withEcho += 1;
            if (!latestEventType) {
              latestEventType = echo.eventType;
              latestProviderEventId = echo.providerEventId;
            }
          }
        }
        setSummary({
          total: rows.length,
          withEcho,
          latestEventType,
          latestProviderEventId,
        });
      })
      .catch(() => {
        setError(true);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { summary, loading, error, reload };
}
