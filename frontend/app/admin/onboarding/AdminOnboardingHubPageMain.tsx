"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOnboardingStripePhase2Notice } from "@/components/admin/AdminOnboardingStripePhase2Notice";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import {
  travelFocusRingCoreOffset2WhiteClasses,
} from "@/lib/travelLinkFocus";
import {
  ADMIN_HUB_LINK_CARD_INNER_CLASS,
  adminHubEntryLinkClass,
  ADMIN_TEXT_SECONDARY_CLASS,
  ADMIN_FILTER_CARD_CLASS,
} from "@/lib/adminUi";
import { ONBOARDING_HUB_LINKS, ONBOARDING_HUB_RELATED_FOLD_LINKS } from "./adminOnboardingHubPageModel";
import { useAdminOnboardingPaymentEventsStripeEcho } from "@/lib/admin/useAdminOnboardingPaymentEventsStripeEcho";
import { useAdminOnboardingWebhookJobsCount } from "@/lib/admin/useAdminOnboardingWebhookJobsCount";

const ONBOARDING_REVIEW_CARDS = [
  {
    href: ADMIN_INBOX_QUEUE_HREFS.guide,
    titleKey: "admin_onboarding_hub_review_guide",
    descKey: "admin_onboarding_hub_review_guide_desc",
    tt: "guide",
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.provider,
    titleKey: "admin_onboarding_hub_review_provider",
    descKey: "admin_onboarding_hub_review_provider_desc",
    tt: "provider",
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.steward,
    titleKey: "admin_onboarding_hub_review_steward",
    descKey: "admin_onboarding_hub_review_steward_desc",
    tt: "steward",
  },
] as const;

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

      {/* OH7～OH9 · 首屏审核发现 */}
      <section
        className={`mt-6 ${ADMIN_FILTER_CARD_CLASS}`}
        data-tt-admin-onboarding-review-strip="1"
        aria-label={t("admin_onboarding_hub_review_strip_title")}
      >
        <h2 className="text-body font-semibold text-ink-900">
          {t("admin_onboarding_hub_review_strip_title")}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {ONBOARDING_REVIEW_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`${adminHubEntryLinkClass()} ${travelFocusRingCoreOffset2WhiteClasses}`}
              data-tt-admin-onboarding-review-card={card.tt}
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <h3 className="text-body font-medium text-ink-900">{t(card.titleKey)}</h3>
                <p className={`mt-1 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t(card.descKey)}</p>
              </span>
            </Link>
          ))}
        </div>
      </section>

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
              <p className={`mt-1 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t(descKey)}</p>
            </span>
          </Link>
        ))}
      </div>
    </AdminDetailPageChrome>
  );
}
