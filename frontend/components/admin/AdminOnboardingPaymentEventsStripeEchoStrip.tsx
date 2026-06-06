"use client";



import Link from "next/link";



import { useTranslation } from "@/components/LocaleProvider";

import { useAdminOnboardingPaymentEventsStripeEcho } from "@/lib/admin/useAdminOnboardingPaymentEventsStripeEcho";

import { ADMIN_CONSOLE_CALLOUT_PANEL_CLASS, ADMIN_INLINE_LINK_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";



/** ONB-04 · payment-events 列表页 Stripe 回显诚实卡（① · ② 真 webhook 另验）。 */

export function AdminOnboardingPaymentEventsStripeEchoStrip() {

  const { t } = useTranslation();

  const ledger = useAdminOnboardingPaymentEventsStripeEcho();



  const countHint = ledger.loading

    ? t("admin_onboarding_payment_ledger_loading")

    : ledger.error

      ? t("admin_onboarding_payment_ledger_unavailable")

      : ledger.summary

        ? t("admin_onboarding_payment_ledger_count", {

            total: ledger.summary.total,

            echo: ledger.summary.withEcho,

          })

        : null;



  const statusAttr = ledger.error ? "error" : ledger.summary ? "ok" : "unknown";



  return (

    <section

      className={`mt-4 ${ADMIN_CONSOLE_CALLOUT_PANEL_CLASS}`}

      data-tt-admin-onboarding-payment-stripe-echo-card="1"

      data-testid="admin-onboarding-payment-stripe-echo-strip"

      data-tt-admin-onboarding-payment-stripe-echo-strip={statusAttr}

      aria-label={t("admin_onboarding_payment_stripe_card_aria")}

    >

      <h2 className="text-body font-semibold text-ink-900">

        {t("admin_onboarding_payment_stripe_card_title")}

      </h2>

      <p className="mt-1 text-small text-ink-600">{t("admin_onboarding_payment_stripe_phase2_notice")}</p>

      {countHint ? <p className="mt-2 text-small text-ink-700">{countHint}</p> : null}

      {!ledger.loading && !ledger.error && ledger.summary?.latestEventType ? (

        <p

          className="mt-2 text-small text-ink-700"

          data-tt-admin-onboarding-payment-stripe-echo-latest="1"

        >

          {t("admin_onboarding_payment_stripe_echo", {

            type: ledger.summary.latestEventType,

            id: ledger.summary.latestProviderEventId ?? "—",

          })}

        </p>

      ) : null}

      {ledger.error ? (
        <button
          type="button"
          className={`mt-2 text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          onClick={ledger.reload}
          data-tt-admin-onboarding-payment-stripe-echo-retry="1"
        >
          {t("admin_onboarding_payment_stripe_echo_retry")}
        </button>
      ) : null}

      <p className="mt-3 text-small">

        <Link href="/admin/onboarding/webhook-jobs" className={adminPageNavLinkClass()}>

          {t("admin_onboarding_hub_webhooks")}

        </Link>

      </p>

    </section>

  );

}

