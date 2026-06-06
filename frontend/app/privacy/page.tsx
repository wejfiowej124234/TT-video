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
  meSettingsExtensionDocListClass,
  meSettingsExtensionDocSectionTitleClass,
  meSettingsExtensionDocTitleClass,
} from "@/lib/me/meSettingsExtensionDocumentUi";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * 隐私政策页：核心表述与《对外口径包》08-4 第 3 章（证据、数据主权等）一致；
 * 完整隐私政策以法务定稿为准。文档版本与定稿日期见 08-4 文末。
 */
export default function PrivacyPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fromSettings = isMeSettingsExtensionFromQuery(searchParams.get("from"));
  const termsHref = fromSettings ? meSettingsNavExtensionHref("/terms") : "/terms";
  const footerLinkClass = meSettingsExtensionDocFooterLinkClass(fromSettings);
  const footerLinkClassWithOffset = fromSettings
    ? footerLinkClass
    : `${footerLinkClass} ${travelFocusRingOffset2Classes}`;

  return (
    <MeSettingsExtensionDocumentShell
      fromSettings={fromSettings}
      route="privacy-from-settings"
      dataMarker="data-tt-privacy-from-settings"
      noticeKey="me_settings_privacy_from_settings_notice"
      ariaLabel={t("privacy_title")}
      t={t}
    >
      <h1 className={meSettingsExtensionDocTitleClass(fromSettings)}>{t("privacy_title")}</h1>

      <p className={meSettingsExtensionDocIntroClass(fromSettings)}>{t("privacy_intro")}</p>

      <h2 className={meSettingsExtensionDocSectionTitleClass(fromSettings)}>{t("privacy_section1Title")}</h2>
      <ul className={meSettingsExtensionDocListClass(fromSettings)}>
        <li>{t("privacy_section1Bullet1")}</li>
        <li>{t("privacy_section1Bullet2")}</li>
      </ul>

      <h2 className={meSettingsExtensionDocSectionTitleClass(fromSettings)}>{t("privacy_section2Title")}</h2>
      <ul className={meSettingsExtensionDocListClass(fromSettings)}>
        <li>{t("privacy_section2Bullet1")}</li>
        <li>{t("privacy_section2Bullet2")}</li>
      </ul>

      <p className={fromSettings ? "text-meta text-slate-400/90 mt-8" : "text-meta text-ink-600 mt-8"}>
        {t("privacy_footerNote")}
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
              {t("privacy_backHome")}
            </Link>
            {" · "}
          </>
        )}
        <Link href={termsHref} className={footerLinkClassWithOffset}>
          {t("help_terms")}
        </Link>
      </p>
    </MeSettingsExtensionDocumentShell>
  );
}
