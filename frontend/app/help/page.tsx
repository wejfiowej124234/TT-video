"use client";

import Link from "next/link";
import { useId } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { MeSettingsExtensionDocumentShell } from "@/components/me/MeSettingsExtensionDocumentShell";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  isMeSettingsExtensionFromQuery,
  meSettingsNavExtensionHref,
} from "@/lib/me/meSettingsExtensionContext";
import {
  meSettingsExtensionDocBodyClass,
  meSettingsExtensionDocDetailsClass,
  meSettingsExtensionDocFooterLinkClass,
  meSettingsExtensionDocIntroClass,
  meSettingsExtensionDocLinkClass,
  meSettingsExtensionDocListClass,
  meSettingsExtensionDocSectionTitleClass,
  meSettingsExtensionDocTitleClass,
} from "@/lib/me/meSettingsExtensionDocumentUi";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * 帮助中心（51-H2/51-O-40）：平台说明 + FAQ（可折叠）+ 法务入口链接；文案与 08-4 第 1～6 章用户侧口径对齐（不托管、混合治理、Pause 期间能力等）。
 * 参见：docs/spec/40-运营与内容就绪.md §3.2、08-4 第 7 章（可验证发布）、缺口官方总表 P1-D。
 */
export default function HelpPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fromSettings = isMeSettingsExtensionFromQuery(searchParams.get("from"));
  const faqHeadingId = useId();

  const disputesHref = fromSettings ? "/disputes?from=settings" : "/disputes";
  const feedbackHref = fromSettings ? "/community/feedback?from=settings" : "/community/feedback";
  const termsHref = fromSettings ? meSettingsNavExtensionHref("/terms") : "/terms";
  const privacyHref = fromSettings ? meSettingsNavExtensionHref("/privacy") : "/privacy";

  const linkClass = meSettingsExtensionDocLinkClass(fromSettings);
  const linkClassWithOffset = fromSettings
    ? linkClass
    : `${linkClass} ${travelFocusRingOffset2Classes}`;
  const footerLinkClass = meSettingsExtensionDocFooterLinkClass(fromSettings);
  const footerLinkClassWithOffset = fromSettings
    ? footerLinkClass
    : `${footerLinkClass} ${travelFocusRingOffset2Classes}`;
  const detailsClass = meSettingsExtensionDocDetailsClass(fromSettings);

  const body = (
    <>
      <h1 className={meSettingsExtensionDocTitleClass(fromSettings)}>{t("help_title")}</h1>

      <p className={meSettingsExtensionDocIntroClass(fromSettings)}>{t("help_desc")}</p>

      <h2 className={meSettingsExtensionDocSectionTitleClass(fromSettings)}>{t("help_platform")}</h2>
      <ul className={meSettingsExtensionDocListClass(fromSettings)}>
        <li>{t("help_platformBullet1")}</li>
        <li>{t("help_platformBullet2")}</li>
        <li>{t("help_platformBullet3")}</li>
      </ul>

      <h2 className={meSettingsExtensionDocSectionTitleClass(fromSettings)}>{t("help_disputes")}</h2>
      <p className={meSettingsExtensionDocBodyClass(fromSettings)}>{t("help_disputesParagraph")}</p>

      <h2 id={faqHeadingId} className={meSettingsExtensionDocSectionTitleClass(fromSettings)}>
        {t("help_faqTitle")}
      </h2>
      <div className="mt-4 space-y-2">
        <details className={detailsClass}>
          <summary>{t("help_faqPayQ")}</summary>
          <p className={`mt-2 ${meSettingsExtensionDocBodyClass(fromSettings)}`}>{t("help_faqPayA")}</p>
          <Link href="/pay" className={`mt-2 inline-block ${linkClassWithOffset}`}>
            {t("help_faqPayCta")}
            {t("ui_link_nav_arrow_suffix")}
          </Link>
          <p className="mt-2 text-meta text-slate-400/90 leading-relaxed">
            {t("help_faqPayDeepLink")}
          </p>
        </details>
        <details className={detailsClass}>
          <summary>{t("help_faqStakingQ")}</summary>
          <p className={`mt-2 ${meSettingsExtensionDocBodyClass(fromSettings)}`}>{t("help_faqStakingA")}</p>
          <Link href="/staking" className={`mt-2 inline-block ${linkClassWithOffset}`}>
            {t("help_faqStakingCta")}
            {t("ui_link_nav_arrow_suffix")}
          </Link>
        </details>
        <details className={detailsClass}>
          <summary>{t("help_faqEscrowQ")}</summary>
          <p className={`mt-2 ${meSettingsExtensionDocBodyClass(fromSettings)}`}>{t("help_faqEscrowA")}</p>
          <Link href="/orders" className={`mt-2 inline-block ${linkClassWithOffset}`}>
            {t("help_faqEscrowCta")}
            {t("ui_link_nav_arrow_suffix")}
          </Link>
        </details>
        <details className={detailsClass}>
          <summary>{t("help_faqFeeRouterQ")}</summary>
          <p className={`mt-2 ${meSettingsExtensionDocBodyClass(fromSettings)}`}>{t("help_faqFeeRouterA")}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/trust" className={linkClassWithOffset}>
              {t("footer_link_trust_center")}
              {t("ui_link_nav_arrow_suffix")}
            </Link>
            <Link href="/governance" className={linkClassWithOffset}>
              {t("governance_title")}
              {t("ui_link_nav_arrow_suffix")}
            </Link>
          </p>
        </details>
        <details className={detailsClass}>
          <summary>{t("help_faqDisputeQ")}</summary>
          <p className={`mt-2 ${meSettingsExtensionDocBodyClass(fromSettings)}`}>{t("help_faqDisputeA")}</p>
          <Link href={disputesHref} className={`mt-2 inline-block ${linkClassWithOffset}`}>
            {t("help_faqDisputeCta")}
            {t("ui_link_nav_arrow_suffix")}
          </Link>
        </details>
        <details className={detailsClass}>
          <summary>{t("help_faqCommunityQ")}</summary>
          <p className={`mt-2 ${meSettingsExtensionDocBodyClass(fromSettings)}`}>{t("help_faqCommunityA")}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/community/tt" className={linkClassWithOffset}>
              {t("help_faqCommunityCta")}
              {t("ui_link_nav_arrow_suffix")}
            </Link>
            <Link href="/community" className={linkClassWithOffset}>
              {t("help_faqCommunityCtaFeed")}
              {t("ui_link_nav_arrow_suffix")}
            </Link>
            <Link href={feedbackHref} className={linkClassWithOffset}>
              {t("footer_link_feedback")}
              {t("ui_link_nav_arrow_suffix")}
            </Link>
          </p>
        </details>
      </div>

      <h2 className={meSettingsExtensionDocSectionTitleClass(fromSettings)}>{t("help_feedbackTitle")}</h2>
      <p className={meSettingsExtensionDocBodyClass(fromSettings)}>
        {t("help_feedbackDesc")}{" "}
        <Link href={feedbackHref} className={linkClassWithOffset}>
          {t("footer_link_feedback")}
          {t("ui_link_nav_arrow_suffix")}
        </Link>
      </p>

      <p className="text-meta text-slate-400/90 mt-6">
        {t("help_termsIntro")}
        <Link href={termsHref} className={footerLinkClassWithOffset}>
          {t("help_terms")}
        </Link>
        {t("market_listSeparator")}
        <Link href={privacyHref} className={footerLinkClassWithOffset}>
          {t("help_privacy")}
        </Link>
        {t("help_docNote")}
      </p>

      <p className="mt-4">
        {fromSettings ? (
          <>
            <Link href={ME_SETTINGS_HUB_PATH} className={footerLinkClassWithOffset}>
              {t("me_settings_back_hub")}
            </Link>
            {" · "}
          </>
        ) : (
          <>
            <Link href="/" className={footerLinkClassWithOffset}>
              {t("help_backHome")}
            </Link>
            {" · "}
          </>
        )}
        <Link href={termsHref} className={footerLinkClassWithOffset}>
          {t("help_terms")}
        </Link>
        {" · "}
        <Link href={privacyHref} className={footerLinkClassWithOffset}>
          {t("help_privacy")}
        </Link>
      </p>

      {!fromSettings ? (
        <ProductCrossNav
          ariaLabelKey="help_relatedNav_aria"
          showGuides
          className={`not-prose ${GOV_PROPOSALS_L5.crossNavWrap} border-t border-ref-sun/14 pt-6`}
          linkClassName={GOV_PROPOSALS_L5.crossNavLink}
          separatorClassName={GOV_PROPOSALS_L5.crossNavSep}
        />
      ) : null}
    </>
  );

  return (
    <MeSettingsExtensionDocumentShell
      fromSettings={fromSettings}
      route={fromSettings ? "help-from-settings" : "help"}
      dataMarker={fromSettings ? "data-tt-help-from-settings" : "data-tt-help-page"}
      noticeKey="me_settings_help_from_settings_notice"
      ariaLabel={t("help_title")}
      t={t}
    >
      {body}
    </MeSettingsExtensionDocumentShell>
  );
}
