"use client";

import { MeLogoutL5Button } from "@/components/me/MeLogoutL5Button";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

export function MeSettingsLogoutButton() {
  return (
    <div className={TT_ME_SETTINGS_L5.logoutWrap}>
      <MeLogoutL5Button variant="settings" />
    </div>
  );
}
