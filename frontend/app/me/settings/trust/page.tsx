"use client";

import { useTranslation } from "@/components/LocaleProvider";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { MeSettingsTrustProgressPanel } from "@/components/me/MeSettingsTrustProgressPanel";
import { useMeSettingsTrustPage } from "@/lib/me/useMeSettingsTrustPage";

/** 信任与核验（L5）· 行业 checklist + 单一主 CTA + 高级透明区 */
export default function MeSettingsTrustPage() {
  const { t } = useTranslation();
  const { loading, error, reload, emailOk, progress, needsLogin } = useMeSettingsTrustPage(t);

  const subtitleKey = needsLogin
    ? "me_settings_trust_login_required_hint"
    : progress?.coreComplete
      ? "me_settings_trust_subtitle_complete"
      : progress?.showGuideAdmissionSection && emailOk
        ? "me_settings_trust_subtitle_guide_admission"
        : emailOk
          ? "me_settings_trust_subtitle_kyc"
          : "me_settings_trust_subtitle_email_pending";

  return (
    <MeSettingsL5FlowPage
      ariaLabel={t("me_settings_trust_page_title")}
      route="settings-trust"
      dataAttrs={{
        "data-tt-me-settings-route": "settings-trust",
        "data-tt-me-settings-trust": "1",
      }}
      showMinimalFooter={false}
    >
      <MeSettingsHubBackLink t={t} />

      <MeSettingsSubpageHeader
        t={t}
        eyebrowKey="me_settings_section_account_security"
        titleKey="me_settings_trust_page_title"
        subtitleKey={subtitleKey}
      />

      <MeSettingsTrustProgressPanel
        t={t}
        loading={loading}
        error={error}
        onRetry={reload}
        progress={progress}
        needsLogin={needsLogin}
      />
    </MeSettingsL5FlowPage>
  );
}
