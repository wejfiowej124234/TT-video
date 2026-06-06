import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";

export const ME_SETTINGS_FLASH_VALUES = ["wallet", "sessions"] as const;

export type MeSettingsFlash = (typeof ME_SETTINGS_FLASH_VALUES)[number];

export function parseMeSettingsFlash(raw: string | null): MeSettingsFlash | null {
  if (raw === "wallet" || raw === "sessions") return raw;
  return null;
}

export function meSettingsHubHref(flash?: MeSettingsFlash): string {
  if (!flash) return ME_SETTINGS_HUB_PATH;
  return `${ME_SETTINGS_HUB_PATH}?flash=${flash}`;
}

export function meSettingsFlashMessageKey(flash: MeSettingsFlash): string {
  if (flash === "wallet") return "me_settings_flash_wallet_verified";
  return "me_settings_flash_sessions_updated";
}
