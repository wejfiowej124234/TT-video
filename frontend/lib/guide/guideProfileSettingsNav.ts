import { ME_IDENTITIES_GUIDE_SETTINGS_HREF } from "@/lib/me/meIdentitiesProfileLinksModel";
import { ME_IDENTITIES_HUB_PATH } from "@/lib/me/meIdentitiesL5";
import { GUIDE_WORKSPACE_HREF } from "@/lib/workspace/workspaceIdentityModel";

/** 向导工作台 → 挂牌 settings（保留返回工作台） */
export function guideProfileSettingsHrefFromWorkbench(): string {
  return `${ME_IDENTITIES_GUIDE_SETTINGS_HREF}?from=guide`;
}

export function resolveGuideProfileSettingsBack(input: {
  from: string | null | undefined;
}): { href: string; labelKey: string } {
  if (input.from === "guide") {
    return { href: GUIDE_WORKSPACE_HREF, labelKey: "me_guide_profile_back_workbench" };
  }
  return { href: ME_IDENTITIES_HUB_PATH, labelKey: "me_guide_profile_back_identities" };
}
