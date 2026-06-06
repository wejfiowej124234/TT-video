"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

export function MeSettingsPrefsSyncBanner({
  syncError,
}: {
  syncError: string | null;
}) {
  const { t } = useTranslation();
  if (syncError !== "sync_failed") return null;
  return (
    <p className={TT_ME_SETTINGS_L5.sectionCallout} role="alert" data-tt-me-settings-prefs-sync-error="1">
      {t("me_settings_prefs_sync_failed")}
    </p>
  );
}
