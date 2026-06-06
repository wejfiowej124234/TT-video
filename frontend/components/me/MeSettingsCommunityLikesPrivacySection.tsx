"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityMeHideLikesReceivedMetric } from "@/lib/useCommunityMeHideLikesReceivedMetric";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { FOCUS_RING } from "@/components/me/constants";

/** 设置 · 隐私：本机隐藏社区「获赞总数」（与社区资料统计条同源 localStorage） */
export function MeSettingsCommunityLikesPrivacySection() {
  const { t } = useTranslation();
  const likesListEnabled = isCommunityMeLikesListEnabled();
  const [hideLikesReceivedMetric, setHideLikesReceivedMetric] = useCommunityMeHideLikesReceivedMetric();

  if (!likesListEnabled) return null;

  return (
    <section
      className={TT_ME_SETTINGS_L5.section}
      aria-label={t("me_settings_likes_privacy_section")}
      data-tt-me-settings-hide-likes-metric="1"
    >
      <h2 className={TT_ME_SETTINGS_L5.sectionTitle}>{t("me_settings_likes_privacy_section")}</h2>
      <p className="px-1 text-meta leading-relaxed text-slate-400/95">{t("me_settings_likes_privacy_section_hint")}</p>
      <div className={TT_ME_SETTINGS_L5.sectionCard}>
        <label className="flex cursor-pointer items-start gap-3 px-4 py-3.5 text-left">
          <input
            type="checkbox"
            className={`mt-0.5 h-4 w-4 shrink-0 rounded border-slate-500/70 bg-ink-900/80 text-ref-sun focus:ring-ref-sun/40 ${FOCUS_RING}`}
            checked={hideLikesReceivedMetric}
            onChange={(e) => setHideLikesReceivedMetric(e.target.checked)}
            aria-label={t("community_me_privacy_hide_likes_received_label")}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-body font-medium text-slate-100">
              {t("community_me_privacy_hide_likes_received_label")}
            </span>
            <span className="mt-0.5 block text-meta leading-relaxed text-slate-400/95">
              {t("community_me_privacy_hide_likes_received_hint")}
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
