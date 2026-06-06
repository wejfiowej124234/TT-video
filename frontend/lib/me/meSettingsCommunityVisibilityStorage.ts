/** ① 本地 · 社区资料可见性意向（localStorage · 与 `/community/me` 编辑对拍） */
export const ME_SETTINGS_COMMUNITY_VISIBILITY_STORAGE_KEY = "tt_me_community_visibility_v1" as const;

export type MeSettingsCommunityVisibility = "public" | "followers" | "private";

const DEFAULT_VISIBILITY: MeSettingsCommunityVisibility = "public";

export function defaultMeSettingsCommunityVisibility(): MeSettingsCommunityVisibility {
  return DEFAULT_VISIBILITY;
}

export function readMeSettingsCommunityVisibility(): MeSettingsCommunityVisibility {
  if (typeof window === "undefined") return defaultMeSettingsCommunityVisibility();
  try {
    const raw = window.localStorage.getItem(ME_SETTINGS_COMMUNITY_VISIBILITY_STORAGE_KEY);
    if (raw === "public" || raw === "followers" || raw === "private") return raw;
    return defaultMeSettingsCommunityVisibility();
  } catch {
    return defaultMeSettingsCommunityVisibility();
  }
}

export function writeMeSettingsCommunityVisibility(
  value: MeSettingsCommunityVisibility,
): MeSettingsCommunityVisibility {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ME_SETTINGS_COMMUNITY_VISIBILITY_STORAGE_KEY, value);
  }
  return value;
}
