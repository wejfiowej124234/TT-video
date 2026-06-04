"use client";

import { adminPageNavLinkClass } from "@/lib/adminUi";
import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOnboardingStripePhase2Notice } from "@/components/admin/AdminOnboardingStripePhase2Notice";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { ONBOARDING_HUB_LINKS } from "./adminOnboardingHubPageModel";
import { useAdminOnboardingPaymentEventsStripeEcho } from "@/lib/admin/useAdminOnboardingPaymentEventsStripeEcho";
import { useAdminOnboardingWebhookJobsCount } from "@/lib/admin/useAdminOnboardingWebhookJobsCount";

/** 96-18 / 70：准入费运营枢纽（① 列表页已接线 PG API）。 */
export function AdminOnboardingHubPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const webhookLedger = useAdminOnboardingWebhookJobsCount();
  const paymentLedger = useAdminOnboardingPaymentEventsStripeEcho();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_onboarding_hub_title")}
      subtitle={t("admin_onboarding_hub_subtitle")}
      mainDataAttrs={{ "data-tt-admin-onboarding-hub": "1" }}
    >
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.ONBOARDING_READ}
        messageKey="admin_perm_denied_onboarding_read"
      />

      <AdminOnboardingStripePhase2Notice
        webhookJobsCount={webhookLedger.count}
        webhookJobsLoading={webhookLedger.loading}
        webhookJobsError={webhookLedger.error}
        webhookLatestId={webhookLedger.latest?.id ?? null}
        webhookLatestStatus={webhookLedger.latest?.status ?? null}
        webhookStripeEventType={webhookLedger.latest?.stripeEventType ?? null}
        webhookProviderEventId={webhookLedger.latest?.providerEventId ?? null}
        paymentEventsTotal={paymentLedger.summary?.total ?? null}
        paymentEventsWithEcho={paymentLedger.summary?.withEcho ?? null}
        paymentEventsLoading={paymentLedger.loading}
        paymentEventsError={paymentLedger.error}
        onWebhookReload={webhookLedger.reload}
        onPaymentReload={paymentLedger.reload}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {ONBOARDING_HUB_LINKS.map(({ href, titleKey, descKey }) => (
          <Link
            key={href}
            href={href}
            className={`${touchTargetLink44Classes} !flex-col !items-stretch rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft hover:border-ink-400 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            <h2 className="text-body-l font-medium text-ink-900">{t(titleKey)}</h2>
            <p className="mt-1 text-small text-ink-600">{t(descKey)}</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-small text-ink-600">
        <Link href="/admin" className={adminPageNavLinkClass()}>
          {t("admin_schema_back")}
        </Link>
      </p>
    </AdminDetailPageChrome>
  );
}
