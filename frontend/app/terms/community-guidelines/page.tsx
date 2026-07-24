"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { MeSettingsExtensionDocumentShell } from "@/components/me/MeSettingsExtensionDocumentShell";
import {
  isMeSettingsExtensionFromQuery,
  meSettingsNavExtensionHref,
} from "@/lib/me/meSettingsExtensionContext";
import {
  meSettingsExtensionDocBodyClass,
  meSettingsExtensionDocFooterLinkClass,
  meSettingsExtensionDocIntroClass,
  meSettingsExtensionDocTitleClass,
} from "@/lib/me/meSettingsExtensionDocumentUi";
import { ME_SETTINGS_HUB_PATH, ME_SETTINGS_PROFILE_PATH } from "@/lib/me/meSettingsL5";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/**
 * 社区规范占位页：正式内容待法务/运营提供后替换（51-H2/51-31-24）。
 * 31 §3.3：社区规范链接从「我的」页链入此处。
 * 页身与 `/terms`、`/privacy`、`/help` 同档（**22** · **`bg-bg-console`**），与 **88 §3.5** 静态信息行一致。
 */
export default function CommunityGuidelinesPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fromSettings = isMeSettingsExtensionFromQuery(searchParams.get("from"));
  const termsHref = fromSettings ? meSettingsNavExtensionHref("/terms") : "/terms";
  const meHref = ME_SETTINGS_PROFILE_PATH;
  const footerLinkClass = meSettingsExtensionDocFooterLinkClass(fromSettings);
  const footerLinkClassWithOffset = fromSettings
    ? footerLinkClass
    : `${footerLinkClass} ${travelFocusRingOffset2Classes}`;

  const ctaPrimary = `${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ref-sun/40 bg-ref-sun/15 px-4 py-2 text-meta font-medium text-ref-sun hover:bg-ref-sun/22 ${fromSettings ? "" : travelFocusRingCoreOffset2Classes}`;

  const ctaSecondary = `${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ref-sun/28 bg-ref-sun/[0.06] px-4 py-2 text-meta font-medium text-slate-200 hover:border-ref-sun/45 ${fromSettings ? "" : travelFocusRingCoreOffset2Classes}`;

  return (
    <MeSettingsExtensionDocumentShell
      fromSettings={fromSettings}
      route="guidelines-from-settings"
      dataMarker="data-tt-guidelines-from-settings"
      noticeKey="me_settings_guidelines_from_settings_notice"
      ariaLabel={t("community_guidelines")}
      t={t}
    >
      <h1 className={meSettingsExtensionDocTitleClass(fromSettings)}>{t("community_guidelines")}</h1>
      <p className={meSettingsExtensionDocIntroClass(fromSettings)}>{t("community_guidelines_draft_note")}</p>
      <p className={meSettingsExtensionDocBodyClass(fromSettings)}>{t("community_guidelines_content")}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href={meHref} className={ctaPrimary}>
          {t("me_title")}
        </Link>
        <Link href="/community" className={ctaSecondary}>
          {t("community_tab_feed")}
        </Link>
      </div>

      <p className="mt-6">
        <Link href={termsHref} className={footerLinkClassWithOffset}>
          {t("common_terms")}
        </Link>
        {" · "}
        {fromSettings ? (
          <Link href={ME_SETTINGS_HUB_PATH} className={footerLinkClassWithOffset}>
            {t("me_settings_back_hub")}
          </Link>
        ) : (
          <Link href="/" className={footerLinkClassWithOffset}>
            {t("terms_backHome")}
          </Link>
        )}
      </p>
    </MeSettingsExtensionDocumentShell>
  );
}
