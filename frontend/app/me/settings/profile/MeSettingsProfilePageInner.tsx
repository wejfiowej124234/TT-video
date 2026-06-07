"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { MeCommunityHubRedirectNotice } from "@/components/me/MeCommunityHubRedirectNotice";
import { MeSettingsProfilePanel } from "@/components/me/MeSettingsProfilePanel";
import { MeSettingsProfilePanelLoading } from "@/components/me/MeSettingsProfilePanelLoading";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { useCommunityMeSocialStatsStripState } from "@/lib/community/useCommunityMeSocialStatsStripState";
import { useCommunityMeHideLikesReceivedMetric } from "@/lib/useCommunityMeHideLikesReceivedMetric";
import { useMeSettingsSummary } from "@/lib/me/useMeSettingsSummary";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

/** 设置 · 个人资料（L5 暖金壳 · 原 `/community/me` Hub 编辑能力） */
export function MeSettingsProfilePageInner() {
  const { t } = useTranslation();
  const { user, loading, error, reload } = useMeSettingsSummary(t);
  const [hideLikesReceivedMetric] = useCommunityMeHideLikesReceivedMetric();
  const panelEnabled = !loading && !!user && !error;
  const { socialStatsState, refetchSocialStats, showLikesReceivedMetric } = useCommunityMeSocialStatsStripState(
    panelEnabled,
    t,
    hideLikesReceivedMetric,
  );

  return (
    <MeSettingsL5FlowPage
      ariaLabel={t("me_settings_profile_page_title")}
      route="settings-profile"
      dataAttrs={{
        "data-tt-me-settings-route": "settings-profile",
        "data-tt-me-settings-profile": "1",
      }}
      showMinimalFooter={false}
    >
      <MeSettingsHubBackLink t={t} />

      <MeSettingsSubpageHeader
        t={t}
        eyebrowKey="me_settings_section_account_security"
        titleKey="me_settings_profile_page_title"
        subtitleKey="me_settings_profile_page_subtitle"
      />

      <MeCommunityHubRedirectNotice />

      {loading ? <MeSettingsProfilePanelLoading /> : null}

      {!loading && error ? (
        <p className={TT_ME_SETTINGS_L5.sectionCallout} role="alert">
          {error}{" "}
          <button
            type="button"
            className={`text-ref-sun underline ${authL5InlineLinkFocusClasses}`}
            onClick={() => reload()}
          >
            {t("common_retry")}
          </button>
        </p>
      ) : null}

      {!loading && !user && !error ? (
        <section
          data-tt-me-settings-profile-auth-gate="1"
          className={`${TT_ME_SETTINGS_L5.sectionCard} px-4 py-6 text-center`}
        >
          <p className="text-meta text-slate-400 mb-4">{t("community_me_login_prompt")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent("/me/settings/profile")}`}
            className={`${TT_AUTH_L5_FORM.primaryCta} mx-auto max-w-xs motion-reduce:transition-none`}
          >
            {t("me_goLogin")}
          </Link>
        </section>
      ) : null}

      {panelEnabled ? (
        <MeSettingsProfilePanel
          t={t}
          socialStatsState={socialStatsState}
          onSocialStatsRetry={refetchSocialStats}
          showLikesReceivedMetric={showLikesReceivedMetric}
          hideLikesReceivedMetric={hideLikesReceivedMetric}
        />
      ) : null}
    </MeSettingsL5FlowPage>
  );
}
