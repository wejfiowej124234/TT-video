/**
 * 设置偏好 · `PUT/GET /api/v1/me` `settings_preferences`（① chain_off 真写）
 */
import { clearGetMeCache, getMe } from "@/lib/apiClient";
import { putMe } from "@/lib/apiClient/me/meWrite";
import type { MeSettingsCommunityVisibility } from "@/lib/me/meSettingsCommunityVisibilityStorage";
import type { MeSettingsNotificationPrefs } from "@/lib/me/meSettingsNotificationPrefsStorage";

export type MeSettingsPreferencesPayload = {
  notification: MeSettingsNotificationPrefs;
  communityVisibility: MeSettingsCommunityVisibility;
  updatedAt: string;
};

function isVisibility(v: unknown): v is MeSettingsCommunityVisibility {
  return v === "public" || v === "followers" || v === "private";
}

export function parseMeSettingsPreferencesFromMe(
  data: unknown,
): MeSettingsPreferencesPayload | null {
  const user = (data as { user?: Record<string, unknown> })?.user;
  const raw = user?.settings_preferences;
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const notification = obj.notification as Record<string, unknown> | undefined;
  const communityVisibility = obj.communityVisibility;
  if (!notification || typeof notification !== "object") return null;
  return {
    notification: {
      emailDigest: notification.emailDigest === true,
      push: notification.push === true,
    },
    communityVisibility: isVisibility(communityVisibility) ? communityVisibility : "public",
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString(),
  };
}

export async function fetchMeSettingsPreferencesFromApi(): Promise<MeSettingsPreferencesPayload | null> {
  try {
    const data = await getMe();
    return parseMeSettingsPreferencesFromMe(data);
  } catch {
    return null;
  }
}

export async function putMeSettingsPreferencesToApi(
  prefs: MeSettingsPreferencesPayload,
): Promise<void> {
  await putMe({
    settings_preferences: {
      notification: prefs.notification,
      communityVisibility: prefs.communityVisibility,
      updatedAt: prefs.updatedAt,
    },
  });
  clearGetMeCache();
}
