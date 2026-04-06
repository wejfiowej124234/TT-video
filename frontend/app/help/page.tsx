"use client";

import Link from "next/link";
import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * 帮助中心（51-H2/51-O-40）：平台说明 + FAQ（可折叠）+ 法务入口链接；文案与 08-4 第 1～6 章用户侧口径对齐（不托管、混合治理、Pause 期间能力等）。
 * 参见：docs/spec/40-运营与内容就绪.md §3.2、08-4 第 7 章（可验证发布）、缺口官方总表 P1-D。
 */
export default function HelpPage() {
  const { t } = useTranslation();
  const faqHeadingId = useId();
  return (
    <main className="min-h-screen bg-bg-console py-12 px-4" aria-label={t("help_title")}>
      <div className="max-w-2xl mx-auto prose prose-ink">
        <h1 className="text-h3 font-semibold text-ink-900">{t("help_title")}</h1>

        <p className="text-meta text-ink-600 mt-2">
          {t("help_desc")}
        </p>

        <h2 className="text-h4 font-medium text-ink-800 mt-6">{t("help_platform")}</h2>
        <ul className="list-disc pl-5 space-y-1 text-small text-ink-700">
          <li>{t("help_platformBullet1")}</li>
          <li>{t("help_platformBullet2")}</li>
          <li>{t("help_platformBullet3")}</li>
        </ul>

        <h2 className="text-h4 font-medium text-ink-800 mt-6">{t("help_disputes")}</h2>
        <p className="text-small text-ink-700">
          {t("help_disputesParagraph")}
        </p>

        <h2 id={faqHeadingId} className="text-h4 font-medium text-ink-800 mt-8">
          {t("help_faqTitle")}
        </h2>
        <div className="mt-4 space-y-2 not-prose max-w-2xl">
          <details className="rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main px-4 py-3 open:shadow-soft">
            <summary className="cursor-pointer text-small font-medium text-ink-800">{t("help_faqPayQ")}</summary>
            <p className="mt-2 text-small text-ink-700 leading-relaxed">{t("help_faqPayA")}</p>
            <Link href="/pay" className={`mt-2 ${touchTargetLink44Classes} text-small text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
              {t("help_faqPayCta")} →
            </Link>
            <p className="mt-2 text-meta text-ink-600 leading-relaxed">{t("help_faqPayDeepLink")}</p>
          </details>
          <details className="rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main px-4 py-3 open:shadow-soft">
            <summary className="cursor-pointer text-small font-medium text-ink-800">{t("help_faqStakingQ")}</summary>
            <p className="mt-2 text-small text-ink-700 leading-relaxed">{t("help_faqStakingA")}</p>
            <Link href="/staking" className={`mt-2 ${touchTargetLink44Classes} text-small text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
              {t("help_faqStakingCta")} →
            </Link>
          </details>
          <details className="rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main px-4 py-3 open:shadow-soft">
            <summary className="cursor-pointer text-small font-medium text-ink-800">{t("help_faqEscrowQ")}</summary>
            <p className="mt-2 text-small text-ink-700 leading-relaxed">{t("help_faqEscrowA")}</p>
            <Link href="/orders" className={`mt-2 ${touchTargetLink44Classes} text-small text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
              {t("help_faqEscrowCta")} →
            </Link>
          </details>
          <details className="rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main px-4 py-3 open:shadow-soft">
            <summary className="cursor-pointer text-small font-medium text-ink-800">{t("help_faqFeeRouterQ")}</summary>
            <p className="mt-2 text-small text-ink-700 leading-relaxed">{t("help_faqFeeRouterA")}</p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small">
              <Link href="/governance/fee-routes" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
                {t("footer_link_governance_fee_routes")} →
              </Link>
              <Link href="/traveltrust#fee-router" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
                {t("traveltrust_link_feeRouter")} →
              </Link>
              <Link href="/traveltrust#token-system" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
                {t("traveltrust_link_tokenSystem")} →
              </Link>
            </p>
          </details>
          <details className="rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main px-4 py-3 open:shadow-soft">
            <summary className="cursor-pointer text-small font-medium text-ink-800">{t("help_faqDisputeQ")}</summary>
            <p className="mt-2 text-small text-ink-700 leading-relaxed">{t("help_faqDisputeA")}</p>
            <Link href="/disputes" className={`mt-2 ${touchTargetLink44Classes} text-small text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
              {t("help_faqDisputeCta")} →
            </Link>
          </details>
          <details className="rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main px-4 py-3 open:shadow-soft">
            <summary className="cursor-pointer text-small font-medium text-ink-800">{t("help_faqCommunityQ")}</summary>
            <p className="mt-2 text-small text-ink-700 leading-relaxed">{t("help_faqCommunityA")}</p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small">
              <Link href="/community/tt" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
                {t("help_faqCommunityCta")} →
              </Link>
              <Link href="/community" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
                {t("help_faqCommunityCtaFeed")} →
              </Link>
              <Link href="/community/feedback" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
                {t("footer_link_feedback")} →
              </Link>
            </p>
          </details>
        </div>

        <h2 className="text-h4 font-medium text-ink-800 mt-8">{t("help_feedbackTitle")}</h2>
        <p className="mt-2 text-small text-ink-700 leading-relaxed">
          {t("help_feedbackDesc")}{" "}
          <Link href="/community/feedback" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("footer_link_feedback")} →
          </Link>
        </p>

        <p className="text-meta text-ink-600 mt-6">
          {t("help_termsIntro")}
          <Link href="/terms" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("help_terms")}
          </Link>
          、
          <Link href="/privacy" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("help_privacy")}
          </Link>
          {t("help_docNote")}
        </p>

        <p className="mt-4">
          <Link href="/" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("help_backHome")}
          </Link>
          {" · "}
          <Link href="/terms" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("help_terms")}
          </Link>
          {" · "}
          <Link href="/privacy" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("help_privacy")}
          </Link>
        </p>

        <ProductCrossNav
          ariaLabelKey="help_relatedNav_aria"
          showGuides
          className="not-prose mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink-200 pt-6 text-meta text-ink-600"
        />
      </div>
    </main>
  );
}
