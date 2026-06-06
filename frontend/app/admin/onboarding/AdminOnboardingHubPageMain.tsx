"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOnboardingStripePhase2Notice } from "@/components/admin/AdminOnboardingStripePhase2Notice";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import {
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import {
  ADMIN_HUB_LINK_CARD_INNER_CLASS,
  adminHubEntryLinkClass,
} from "@/lib/adminUi";
import { ONBOARDING_HUB_LINKS, ONBOARDING_HUB_RELATED_FOLD_LINKS } from "./adminOnboardingHubPageModel";
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
      subtitle={t("admin_onboarding_hub_subtitle_l5")}
      mainDataAttrs={{ "data-tt-admin-onboarding-hub": "1" }}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={ONBOARDING_HUB_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_onboarding_hub_related_aria"
        foldSummaryKey="admin_onboarding_hub_related_fold"
        dataTtFold="onboarding-hub"
      />
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
            className={`${adminHubEntryLinkClass()} ${travelFocusRingCoreOffset2WhiteClasses}`}
            data-tt-admin-hub-link-card="1"
          >
            <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
              <h2 className="text-body-l font-medium text-ink-900">{t(titleKey)}</h2>
              <p className="mt-1 text-small text-ink-600">{t(descKey)}</p>
            </span>
          </Link>
        ))}
      </div>

    </AdminDetailPageChrome>
  );
}
