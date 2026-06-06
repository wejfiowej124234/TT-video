"use client";

import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

export function MeSettingsSavedToast({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return (
    <p
      className={TT_ME_SETTINGS_L5.sectionCallout}
      role="status"
      aria-live="polite"
      data-tt-me-settings-saved-toast="1"
    >
      {message}
    </p>
  );
}
