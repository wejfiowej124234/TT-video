import { ME_IDENTITIES_MERCHANT_SETTINGS_HREF } from "@/lib/me/meIdentitiesCoreCardModel";
import { ME_IDENTITIES_HUB_PATH } from "@/lib/me/meIdentitiesL5";
import { MERCHANT_WORKSPACE_HREF } from "@/lib/workspace/workspaceIdentityModel";

/** 商家工作台 → 橱窗 settings（保留返回工作台） */
export function merchantProfileSettingsHrefFromWorkbench(): string {
  return `${ME_IDENTITIES_MERCHANT_SETTINGS_HREF}?from=provider`;
}

export function resolveMerchantProfileSettingsBack(input: {
  from: string | null | undefined;
}): { href: string; labelKey: string } {
  if (input.from === "provider") {
    return { href: MERCHANT_WORKSPACE_HREF, labelKey: "me_merchant_profile_back_workbench" };
  }
  return { href: ME_IDENTITIES_HUB_PATH, labelKey: "me_merchant_profile_back_identities" };
}
