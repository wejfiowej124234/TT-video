"use client";

import type { UserShape } from "@/components/me/constants";
import { isCommunityMeBioEnabled } from "@/lib/communityMeFeatureFlags";
import {
  profileCompletenessItems,
  profileCompletenessPercent,
  profileCompletenessTotal,
  type ProfileCompletenessItem,
} from "@/lib/me/meSettingsProfileDisplay";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import type { LocaleTranslateFn } from "@/lib/i18n";

const ITEM_KEYS: Record<ProfileCompletenessItem, string> = {
  avatar: "me_settings_profile_complete_avatar",
  nickname: "me_settings_profile_complete_nickname",
  bio: "me_settings_profile_complete_bio",
  wallet: "me_settings_profile_complete_wallet",
};

export function MeSettingsProfileCompleteness({ user, t }: { user: UserShape; t: LocaleTranslateFn }) {
  const bioEnabled = isCommunityMeBioEnabled();
  const done = profileCompletenessItems(user, bioEnabled);
  const total = profileCompletenessTotal(bioEnabled);
  const percent = profileCompletenessPercent(user, bioEnabled);

  if (percent >= 100) return null;

  const allItems: ProfileCompletenessItem[] = bioEnabled
    ? ["avatar", "nickname", "bio", "wallet"]
    : ["avatar", "nickname", "wallet"];

  return (
    <section
      className={TT_ME_SETTINGS_L5.profileCompletenessWrap}
      aria-labelledby="me-settings-profile-completeness-heading"
      data-tt-me-settings-profile-completeness="1"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 id="me-settings-profile-completeness-heading" className={TT_ME_SETTINGS_L5.sectionTitle}>
          {t("me_settings_profile_completeness_title")}
        </h2>
        <span className={TT_ME_SETTINGS_L5.profileCompletenessPct}>{percent}%</span>
      </div>
      <div className={TT_ME_SETTINGS_L5.profileCompletenessTrack} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className={TT_ME_SETTINGS_L5.profileCompletenessFill} style={{ width: `${percent}%` }} />
      </div>
      <ul className={TT_ME_SETTINGS_L5.profileCompletenessList}>
        {allItems.map((item) => {
          const complete = done.includes(item);
          return (
            <li key={item} className={complete ? TT_ME_SETTINGS_L5.profileCompletenessItemDone : TT_ME_SETTINGS_L5.profileCompletenessItem}>
              <span aria-hidden>{complete ? "✓" : "○"}</span>
              {t(ITEM_KEYS[item])}
            </li>
          );
        })}
      </ul>
      <p className={TT_ME_SETTINGS_L5.profileSectionHint}>{t("me_settings_profile_completeness_hint", { done: String(done.length), total: String(total) })}</p>
    </section>
  );
}
