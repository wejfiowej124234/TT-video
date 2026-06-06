"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsL5Row } from "@/components/me/MeSettingsL5Row";
import { MeSettingsL5ToggleRow } from "@/components/me/MeSettingsL5ToggleRow";
import { MeSettingsPrefsSyncBanner } from "@/components/me/MeSettingsPrefsSyncBanner";
import { MeSettingsSavedToast } from "@/components/me/MeSettingsSavedToast";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { useMeSettingsUserPreferences } from "@/hooks/useMeSettingsUserPreferences";
import { meSecurityHref } from "@/lib/me/meSecurityL5";
import { meSettingsUserId } from "@/lib/me/meSettingsUserId";
import { useMeSettingsSummary } from "@/lib/me/useMeSettingsSummary";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

/** 通知偏好（L5）· 按用户分桶持久化 + 安全事件记录入口 */
export default function MeSettingsNotificationsPrefsPage() {
  const { t } = useTranslation();
  const summary = useMeSettingsSummary(t);
  const userId = meSettingsUserId(summary.user);
  const { prefs, patch, savedFlash, syncError, ready } = useMeSettingsUserPreferences(userId);

  return (
    <MeSettingsL5FlowPage
      ariaLabel={t("me_settings_notif_prefs_page_title")}
      route="settings-notifications-prefs"
      dataAttrs={{
        "data-tt-me-settings-route": "notifications-prefs",
        "data-tt-me-settings-notif-prefs": "1",
        "data-tt-me-settings-prefs-ready": ready ? "1" : undefined,
      }}
      showMinimalFooter={false}
    >
      <MeSettingsHubBackLink t={t} />

      <MeSettingsSubpageHeader
        t={t}
        eyebrowKey="me_settings_section_privacy"
        titleKey="me_settings_notif_prefs_page_title"
        subtitleKey="me_settings_notif_prefs_subtitle"
      />

      <p className="rounded-xl border border-ref-sun/28 bg-ref-sun/[0.06] px-4 py-3 text-meta leading-relaxed text-slate-400/95">
        {t("me_settings_notif_prefs_local_notice")}
      </p>

      <MeSettingsSavedToast show={savedFlash} message={t("me_settings_prefs_saved")} />
      <MeSettingsPrefsSyncBanner syncError={syncError} />

      {summary.error ? (
        <p className={TT_ME_SETTINGS_L5.sectionCallout} role="alert">
          {summary.error}
        </p>
      ) : null}

      <section className={TT_ME_SETTINGS_L5.section}>
        <h2 className={TT_ME_SETTINGS_L5.sectionTitle}>{t("me_settings_notif_prefs_section")}</h2>
        <ul className={TT_ME_SETTINGS_L5.sectionCard} role="list">
          {ready && prefs ? (
            <>
              <li className="list-none">
                <MeSettingsL5ToggleRow
                  id="email_digest"
                  iconId="bell"
                  label={t("me_settings_notif_prefs_email")}
                  desc={t("me_settings_notif_prefs_email_desc")}
                  checked={prefs.notification.emailDigest}
                  disabled={summary.loading}
                  onChange={(emailDigest) => patch({ notification: { emailDigest } })}
                />
              </li>
              <li className="list-none">
                <MeSettingsL5ToggleRow
                  id="push"
                  iconId="bell"
                  label={t("me_settings_notif_prefs_push")}
                  desc={t("me_settings_notif_prefs_push_desc")}
                  checked={prefs.notification.push}
                  disabled={summary.loading}
                  onChange={(push) => patch({ notification: { push } })}
                />
              </li>
            </>
          ) : summary.loading ? (
            <li className="list-none px-4 py-3 text-meta text-slate-400/90">{t("common_loading")}</li>
          ) : null}
          <li className="list-none">
            <MeSettingsL5Row
              item={{
                id: "security_events",
                iconId: "shield",
                labelKey: "me_settings_item_security_events",
                descKey: "me_settings_desc_security_events",
                href: meSecurityHref("notifications"),
              }}
              label={t("me_settings_item_security_events")}
              desc={t("me_settings_desc_security_events")}
              soonLabel={t("me_settings_badge_soon")}
            />
          </li>
        </ul>
      </section>

      <p className="text-meta text-slate-500/90">
        <Link
          href="/me/settings/privacy"
          className={`text-ref-sun/80 underline underline-offset-4 hover:text-[#fde9a8] ${authL5InlineLinkFocusClasses}`}
        >
          {t("me_settings_item_privacy_hub")}
        </Link>
      </p>
    </MeSettingsL5FlowPage>
  );
}
