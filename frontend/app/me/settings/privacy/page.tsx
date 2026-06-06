"use client";



import { useTranslation } from "@/components/LocaleProvider";

import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";

import { MeSettingsCommunityVisibilitySection } from "@/components/me/MeSettingsCommunityVisibilitySection";
import { MeSettingsCommunityLikesPrivacySection } from "@/components/me/MeSettingsCommunityLikesPrivacySection";

import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";

import { MeSettingsL5Row } from "@/components/me/MeSettingsL5Row";

import { meSecurityHref } from "@/lib/me/meSecurityL5";

import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";



/** 隐私说明（L5）· 社区可见性 + 政策外链 + 安全通知入口 */

export default function MeSettingsPrivacyPage() {

  const { t } = useTranslation();



  const legalRows = [

    { id: "privacy", iconId: "privacy", labelKey: "privacy_title", href: "/privacy" },

    { id: "terms", iconId: "legal", labelKey: "terms_title", href: "/terms" },

    {

      id: "guidelines",

      iconId: "legal",

      labelKey: "me_settings_item_community_guidelines",

      href: "/terms/community-guidelines",

    },

    {

      id: "notification_prefs",

      iconId: "bell",

      labelKey: "me_settings_item_notification_prefs",

      href: "/me/settings/notifications-prefs",

    },

    {

      id: "security_events",

      iconId: "shield",

      labelKey: "me_settings_item_security_events",

      href: meSecurityHref("notifications"),

    },

  ] as const;

  const soonLabel = t("me_settings_badge_soon");



  return (

    <MeSettingsL5FlowPage

      ariaLabel={t("me_settings_privacy_page_title")}

      route="settings-privacy"

      dataAttrs={{ "data-tt-me-settings-route": "privacy" }}

      showMinimalFooter={false}

    >

      <MeSettingsHubBackLink t={t} />



      <MeSettingsSubpageHeader

        t={t}

        eyebrowKey="me_settings_section_privacy"

        titleKey="me_settings_privacy_page_title"

        subtitleKey="me_settings_privacy_subtitle"

      />



      <MeSettingsCommunityVisibilitySection />

      <MeSettingsCommunityLikesPrivacySection />

      <section className={TT_ME_SETTINGS_L5.section} aria-label={t("me_settings_section_privacy")}>

        <h2 className={TT_ME_SETTINGS_L5.sectionTitle}>{t("me_settings_privacy_legal_section")}</h2>

        <ul className={TT_ME_SETTINGS_L5.sectionCard} role="list">

          {legalRows.map((row) => (

            <li key={row.id} className="list-none">

              <MeSettingsL5Row

                item={{

                  id: row.id,

                  iconId: row.iconId,

                  labelKey: row.labelKey,

                  href: row.href,

                }}

                label={t(row.labelKey)}

                soonLabel={soonLabel}

              />

            </li>

          ))}

        </ul>

      </section>

    </MeSettingsL5FlowPage>

  );

}

