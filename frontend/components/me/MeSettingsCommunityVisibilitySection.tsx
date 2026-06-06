"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { MeSettingsL5Icon } from "@/components/me/MeSettingsL5Icon";
import { MeSettingsPrefsSyncBanner } from "@/components/me/MeSettingsPrefsSyncBanner";
import { MeSettingsSavedToast } from "@/components/me/MeSettingsSavedToast";
import { useMeSettingsUserPreferences } from "@/hooks/useMeSettingsUserPreferences";
import type { MeSettingsCommunityVisibility } from "@/lib/me/meSettingsCommunityVisibilityStorage";
import { meSettingsUserId } from "@/lib/me/meSettingsUserId";
import { useMeSettingsSummary } from "@/lib/me/useMeSettingsSummary";
import { ME_SETTINGS_PROFILE_PATH, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

const OPTIONS: readonly { value: MeSettingsCommunityVisibility; labelKey: string; descKey: string }[] = [
  { value: "public", labelKey: "me_settings_visibility_public", descKey: "me_settings_visibility_public_desc" },
  {
    value: "followers",
    labelKey: "me_settings_visibility_followers",
    descKey: "me_settings_visibility_followers_desc",
  },
  { value: "private", labelKey: "me_settings_visibility_private", descKey: "me_settings_visibility_private_desc" },
] as const;

export function MeSettingsCommunityVisibilitySection() {
  const { t } = useTranslation();
  const summary = useMeSettingsSummary(t);
  const userId = meSettingsUserId(summary.user);
  const { prefs, patch, savedFlash, syncError, ready } = useMeSettingsUserPreferences(userId);
  const value = prefs?.communityVisibility ?? "public";

  return (
    <section
      className={TT_ME_SETTINGS_L5.section}
      aria-label={t("me_settings_visibility_section")}
      data-tt-me-settings-community-visibility="1"
      data-tt-me-settings-prefs-ready={ready && !summary.loading ? "1" : undefined}
    >
      <h2 className={TT_ME_SETTINGS_L5.sectionTitle}>{t("me_settings_visibility_section")}</h2>
      <p className="px-1 text-meta leading-relaxed text-slate-400/95">{t("me_settings_visibility_section_hint")}</p>
      <MeSettingsSavedToast show={savedFlash} message={t("me_settings_prefs_saved")} />
      <MeSettingsPrefsSyncBanner syncError={syncError} />
      <ul className={TT_ME_SETTINGS_L5.sectionCard} role="radiogroup" aria-label={t("me_settings_visibility_section")}>
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <li key={opt.value} className="list-none">
              <label
                className={TT_ME_SETTINGS_L5.visibilityOption}
                data-tt-me-settings-visibility-option={opt.value}
              >
                <input
                  type="radio"
                  name="me-settings-community-visibility"
                  className={TT_ME_SETTINGS_L5.visibilityRadio}
                  checked={selected}
                  disabled={!ready || summary.loading}
                  onChange={() => patch({ communityVisibility: opt.value })}
                />
                <span className={TT_ME_SETTINGS_L5.rowIcon} aria-hidden>
                  <MeSettingsL5Icon id="profile" />
                </span>
                <span className={TT_ME_SETTINGS_L5.rowBody}>
                  <span className={TT_ME_SETTINGS_L5.rowLabel}>{t(opt.labelKey)}</span>
                  <span className={TT_ME_SETTINGS_L5.rowDesc}>{t(opt.descKey)}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="text-meta text-slate-500/90">
        <Link
          href={ME_SETTINGS_PROFILE_PATH}
          className={`text-ref-sun/80 underline underline-offset-4 hover:text-[#fde9a8] ${authL5InlineLinkFocusClasses}`}
        >
          {t("me_settings_visibility_edit_profile_link")}
        </Link>
      </p>
    </section>
  );
}
