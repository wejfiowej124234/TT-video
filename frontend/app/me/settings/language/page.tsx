"use client";

import { useTranslation } from "@/components/LocaleProvider";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsLanguagePicker } from "@/components/me/MeSettingsLanguagePicker";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

/** 显示语言（L5）· 与顶栏语言切换同源 `LocaleProvider` · 内容翻译目标跟随此项 */
export default function MeSettingsLanguagePage() {
  const { t } = useTranslation();

  return (
    <MeSettingsL5FlowPage
      ariaLabel={t("me_settings_language_page_title")}
      route="settings-language"
      dataAttrs={{ "data-tt-me-settings-route": "language" }}
      showMinimalFooter={false}
    >
      <MeSettingsHubBackLink t={t} />

      <MeSettingsSubpageHeader
        t={t}
        eyebrowKey="me_settings_section_general"
        titleKey="me_settings_language_page_title"
        subtitleKey="me_settings_language_subtitle"
      />

      <section className={TT_ME_SETTINGS_L5.section} aria-labelledby="me-settings-language-heading">
        <h2 id="me-settings-language-heading" className={TT_ME_SETTINGS_L5.sectionTitle}>
          {t("me_settings_item_language")}
        </h2>
        <p className="px-1 text-meta leading-relaxed text-slate-400/95">
          {t("me_settings_content_translation_subtitle")}
        </p>
        <MeSettingsLanguagePicker />
      </section>

      <p className="text-meta leading-relaxed text-slate-500/90">{t("me_settings_language_header_hint")}</p>
    </MeSettingsL5FlowPage>
  );
}
