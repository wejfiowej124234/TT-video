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
  meSettingsExtensionDocIntroClass,
  meSettingsExtensionDocFooterLinkClass,
  meSettingsExtensionDocListClass,
  meSettingsExtensionDocSectionTitleClass,
  meSettingsExtensionDocTitleClass,
} from "@/lib/me/meSettingsExtensionDocumentUi";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * 服务条款页：核心表述与《对外口径包》08-4 第 1～2 章一致；
 * 完整条款以法务定稿为准。文档版本与定稿日期见 08-4 文末。
 */
export default function TermsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fromSettings = isMeSettingsExtensionFromQuery(searchParams.get("from"));
  const privacyHref = fromSettings ? meSettingsNavExtensionHref("/privacy") : "/privacy";
  const footerLinkClass = meSettingsExtensionDocFooterLinkClass(fromSettings);
  const footerLinkClassWithOffset = fromSettings
    ? footerLinkClass
    : `${footerLinkClass} ${travelFocusRingOffset2Classes}`;

  return (
    <MeSettingsExtensionDocumentShell
      fromSettings={fromSettings}
      route="terms-from-settings"
      dataMarker="data-tt-terms-from-settings"
      noticeKey="me_settings_terms_from_settings_notice"
      ariaLabel={t("terms_title")}
      t={t}
    >
      <h1 className={meSettingsExtensionDocTitleClass(fromSettings)}>{t("terms_title")}</h1>

      <p className={meSettingsExtensionDocIntroClass(fromSettings)}>{t("terms_intro")}</p>

      <h2 className={meSettingsExtensionDocSectionTitleClass(fromSettings)}>{t("terms_section1Title")}</h2>
      <ul className={meSettingsExtensionDocListClass(fromSettings)}>
        <li>{t("terms_section1Bullet1")}</li>
        <li>{t("terms_section1Bullet2")}</li>
        <li>{t("terms_section1Bullet3")}</li>
      </ul>

      <h2 className={meSettingsExtensionDocSectionTitleClass(fromSettings)}>{t("terms_section2Title")}</h2>
      <ul className={meSettingsExtensionDocListClass(fromSettings)}>
        <li>{t("terms_section2Bullet1")}</li>
        <li>{t("terms_section2Bullet2")}</li>
      </ul>

      <p className={fromSettings ? "text-meta text-slate-400/90 mt-8" : "text-meta text-ink-600 mt-8"}>
        {t("terms_footerNote")}
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
              {t("terms_backHome")}
            </Link>
            {" · "}
          </>
        )}
        <Link href={privacyHref} className={footerLinkClassWithOffset}>
          {t("help_privacy")}
        </Link>
      </p>
    </MeSettingsExtensionDocumentShell>
  );
}
