/** ① 本地 · 通知偏好（localStorage · 无后端时仍可验收 L5 交互） */
export const ME_SETTINGS_NOTIF_PREFS_STORAGE_KEY = "tt_me_notif_prefs_v1" as const;

export type MeSettingsNotificationPrefs = {
  emailDigest: boolean;
  push: boolean;
};

const DEFAULT_PREFS: MeSettingsNotificationPrefs = {
  emailDigest: true,
  push: false,
};

export function defaultMeSettingsNotificationPrefs(): MeSettingsNotificationPrefs {
  return { ...DEFAULT_PREFS };
}

export function readMeSettingsNotificationPrefs(): MeSettingsNotificationPrefs {
  if (typeof window === "undefined") return defaultMeSettingsNotificationPrefs();
  try {
    const raw = window.localStorage.getItem(ME_SETTINGS_NOTIF_PREFS_STORAGE_KEY);
    if (!raw) return defaultMeSettingsNotificationPrefs();
    const parsed = JSON.parse(raw) as Partial<MeSettingsNotificationPrefs>;
    return {
      emailDigest: parsed.emailDigest ?? DEFAULT_PREFS.emailDigest,
      push: parsed.push ?? DEFAULT_PREFS.push,
    };
  } catch {
    return defaultMeSettingsNotificationPrefs();
  }
}

export function writeMeSettingsNotificationPrefs(
  patch: Partial<MeSettingsNotificationPrefs>,
): MeSettingsNotificationPrefs {
  const next = { ...readMeSettingsNotificationPrefs(), ...patch };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ME_SETTINGS_NOTIF_PREFS_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
