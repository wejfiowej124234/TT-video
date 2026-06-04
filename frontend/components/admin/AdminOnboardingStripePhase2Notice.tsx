"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_INLINE_LINK_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** ONB-04 · ① 入驻枢纽双台账卡（Webhook · Payment-events · ② 真 webhook 另闸）。 */
export function AdminOnboardingStripePhase2Notice(props: {
  webhookJobsCount?: number | null;
  webhookJobsLoading?: boolean;
  webhookJobsError?: boolean;
  webhookLatestId?: string | null;
  webhookLatestStatus?: string | null;
  webhookStripeEventType?: string | null;
  webhookProviderEventId?: string | null;
  paymentEventsTotal?: number | null;
  paymentEventsWithEcho?: number | null;
  paymentEventsLoading?: boolean;
  paymentEventsError?: boolean;
  onWebhookReload?: () => void;
  onPaymentReload?: () => void;
}) {
  const { t } = useTranslation();
  const {
    webhookJobsCount = null,
    webhookJobsLoading = false,
    webhookJobsError = false,
    webhookLatestId = null,
    webhookLatestStatus = null,
    webhookStripeEventType = null,
    webhookProviderEventId = null,
    paymentEventsTotal = null,
    paymentEventsWithEcho = null,
    paymentEventsLoading = false,
    paymentEventsError = false,
    onWebhookReload,
    onPaymentReload,
  } = props;

  const webhookStatus = webhookJobsError ? "error" : webhookJobsCount !== null ? "ok" : "unknown";
  const paymentStatus = paymentEventsError ? "error" : paymentEventsTotal !== null ? "ok" : "unknown";

  const webhookBody = webhookJobsLoading
    ? t("admin_onboarding_webhook_ledger_loading")
    : webhookJobsError
      ? t("admin_onboarding_webhook_ledger_unavailable")
      : webhookJobsCount !== null
        ? t("admin_onboarding_webhook_ledger_count", { count: webhookJobsCount })
        : t("admin_onboarding_hub_ledger_empty");

  const paymentBody = paymentEventsLoading
    ? t("admin_onboarding_payment_ledger_loading")
    : paymentEventsError
      ? t("admin_onboarding_payment_ledger_unavailable")
      : paymentEventsTotal !== null
        ? t("admin_onboarding_payment_ledger_count", {
            total: paymentEventsTotal,
            echo: paymentEventsWithEcho ?? 0,
          })
        : t("admin_onboarding_hub_ledger_empty");

  return (
    <section
      id="admin-onboarding-hub-ledger"
      className="mt-6 scroll-mt-24 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft sm:p-5"
      data-testid="admin-onboarding-stripe-phase2-notice"
      data-tt-admin-onboarding-hub-ledger-cards="1"
      aria-label={t("admin_onboarding_hub_ledger_cards_aria")}
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_onboarding_hub_ledger_cards_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_onboarding_stripe_phase2_notice")}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <article
          className="rounded-[var(--radius-lg)] border border-ink-100 bg-ink-50/50 p-4"
          data-tt-admin-onboarding-hub-webhook-ledger={webhookStatus}
          data-tt-admin-onboarding-webhook-ledger={webhookStatus}
        >
          <h3 className="text-small font-semibold text-ink-900">{t("admin_onboarding_hub_webhook_card_title")}</h3>
          <p className="mt-2 text-small text-ink-700">{webhookBody}</p>
          {!webhookJobsLoading && !webhookJobsError && webhookLatestId ? (
            <p className="mt-2 text-meta text-ink-600" data-tt-admin-onboarding-webhook-latest="1">
              {t("admin_onboarding_webhook_ledger_latest", {
                id: webhookLatestId,
                status: webhookLatestStatus ?? "—",
              })}
            </p>
          ) : null}
          {!webhookJobsLoading && !webhookJobsError && webhookStripeEventType ? (
            <p className="mt-1 text-meta text-ink-600" data-tt-admin-onboarding-webhook-stripe-echo="1">
              {t("admin_onboarding_webhook_stripe_echo", {
                type: webhookStripeEventType,
                id: webhookProviderEventId ?? "—",
              })}
            </p>
          ) : null}
          {webhookJobsError && onWebhookReload ? (
            <button
              type="button"
              className={`mt-2 text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
              onClick={onWebhookReload}
              data-tt-admin-onboarding-webhook-ledger-retry="1"
            >
              {t("admin_onboarding_webhook_ledger_retry")}
            </button>
          ) : null}
          <Link
            href="/admin/onboarding/webhook-jobs"
            className={`mt-3 inline-block text-small font-medium ${adminPageNavLinkClass()}`}
          >
            {t("admin_onboarding_hub_webhooks")}
          </Link>
        </article>

        <article
          className="rounded-[var(--radius-lg)] border border-ink-100 bg-ink-50/50 p-4"
          data-tt-admin-onboarding-hub-payment-ledger={paymentStatus}
        >
          <h3 className="text-small font-semibold text-ink-900">{t("admin_onboarding_hub_payment_card_title")}</h3>
          <p className="mt-2 text-small text-ink-700">{paymentBody}</p>
          {paymentEventsError && onPaymentReload ? (
            <button
              type="button"
              className={`mt-2 text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
              onClick={onPaymentReload}
              data-tt-admin-onboarding-payment-ledger-retry="1"
            >
              {t("admin_onboarding_payment_stripe_echo_retry")}
            </button>
          ) : null}
          <Link
            href="/admin/onboarding/payment-events"
            className={`mt-3 inline-block text-small font-medium ${adminPageNavLinkClass()}`}
          >
            {t("admin_onb_payment_events_title")}
          </Link>
        </article>
      </div>

      <p className="mt-4 text-meta text-ink-500" role="note">
        {t("admin_onboarding_hub_ledger_honesty")}
      </p>
    </section>
  );
}
