/**
 * ① 本地 · 设置偏好（按 userId 分桶 · 登录后真实读写）
 *
 * 通知偏好与社区可见性在服务端字段落地前，以本模块为 SSOT；切换账号不会串偏好。
 */
import {
  defaultMeSettingsCommunityVisibility,
  type MeSettingsCommunityVisibility,
  readMeSettingsCommunityVisibility,
  writeMeSettingsCommunityVisibility,
} from "@/lib/me/meSettingsCommunityVisibilityStorage";
import {
  defaultMeSettingsNotificationPrefs,
  type MeSettingsNotificationPrefs,
  readMeSettingsNotificationPrefs,
  writeMeSettingsNotificationPrefs,
} from "@/lib/me/meSettingsNotificationPrefsStorage";

export type MeSettingsUserPreferences = {
  notification: MeSettingsNotificationPrefs;
  communityVisibility: MeSettingsCommunityVisibility;
  updatedAt: string;
};

const LEGACY_NOTIF_KEY = "tt_me_notif_prefs_v1";
const LEGACY_VISIBILITY_KEY = "tt_me_community_visibility_v1";

function prefsStorageKey(userId: string): string {
  return `tt_me_settings_prefs_v2_${userId}`;
}

function readRaw(userId: string | null): MeSettingsUserPreferences | null {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(prefsStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MeSettingsUserPreferences>;
    const notification = parsed.notification ?? defaultMeSettingsNotificationPrefs();
    const communityVisibility =
      parsed.communityVisibility === "public" ||
      parsed.communityVisibility === "followers" ||
      parsed.communityVisibility === "private"
        ? parsed.communityVisibility
        : defaultMeSettingsCommunityVisibility();
    return {
      notification,
      communityVisibility,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function writeRaw(userId: string, prefs: MeSettingsUserPreferences): MeSettingsUserPreferences {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(prefsStorageKey(userId), JSON.stringify(prefs));
  }
  return prefs;
}

/** 从 v1 全局键迁移到当前 userId 桶（仅当 v2 桶为空时） */
export function migrateLegacyMeSettingsPreferences(userId: string): MeSettingsUserPreferences | null {
  if (readRaw(userId)) return readRaw(userId);
  if (typeof window === "undefined") return null;
  const hasLegacy =
    window.localStorage.getItem(LEGACY_NOTIF_KEY) != null ||
    window.localStorage.getItem(LEGACY_VISIBILITY_KEY) != null;
  if (!hasLegacy) return null;
  const prefs: MeSettingsUserPreferences = {
    notification: readMeSettingsNotificationPrefs(),
    communityVisibility: readMeSettingsCommunityVisibility(),
    updatedAt: new Date().toISOString(),
  };
  return writeRaw(userId, prefs);
}

export function readMeSettingsUserPreferences(userId: string | null): MeSettingsUserPreferences {
  if (!userId) {
    return {
      notification: defaultMeSettingsNotificationPrefs(),
      communityVisibility: defaultMeSettingsCommunityVisibility(),
      updatedAt: new Date(0).toISOString(),
    };
  }
  const migrated = migrateLegacyMeSettingsPreferences(userId);
  if (migrated) return migrated;
  const existing = readRaw(userId);
  if (existing) return existing;
  return {
    notification: defaultMeSettingsNotificationPrefs(),
    communityVisibility: defaultMeSettingsCommunityVisibility(),
    updatedAt: new Date().toISOString(),
  };
}

export function patchMeSettingsUserPreferences(
  userId: string,
  patch: {
    notification?: Partial<MeSettingsNotificationPrefs>;
    communityVisibility?: MeSettingsCommunityVisibility;
  },
): MeSettingsUserPreferences {
  const current = readMeSettingsUserPreferences(userId);
  const next: MeSettingsUserPreferences = {
    notification: { ...current.notification, ...patch.notification },
    communityVisibility: patch.communityVisibility ?? current.communityVisibility,
    updatedAt: new Date().toISOString(),
  };
  writeRaw(userId, next);
  writeMeSettingsNotificationPrefs(next.notification);
  writeMeSettingsCommunityVisibility(next.communityVisibility);
  return next;
}
