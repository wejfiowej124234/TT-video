import type { UserShape } from "@/components/me/constants";

import type { MeSettingsNavItem } from "@/lib/me/meSettingsNavModel";

export type MeSettingsHubStatusSnapshot = {

  loading: boolean;

  failed: boolean;

  activeSessionCount: number | null;

  walletVerified: boolean | null;

};



/** Hub 列表行副文案：结合安全状态动态覆盖静态 i18n */

export function meSettingsRowDescription(

  item: MeSettingsNavItem,

  t: (key: string, vars?: Record<string, string | number>) => string,

  status: MeSettingsHubStatusSnapshot,

  _user?: UserShape | null,

): string | undefined {

  if (status.failed && (item.id === "security" || item.id === "wallet")) {

    return t("me_settings_desc_hub_status_failed");

  }



  if (!item.descKey) return undefined;



  if (item.id === "security" && !status.loading && !status.failed && status.activeSessionCount != null) {

    return t("me_settings_desc_security_live", { n: status.activeSessionCount });

  }



  if (item.id === "wallet" && !status.loading && !status.failed) {

    if (status.walletVerified === true) return t("me_settings_desc_wallet_verified_row");

    if (status.walletVerified === false) return t("me_settings_desc_wallet_pending_row");

  }



  return t(item.descKey);

}

