import {
  communityMeDedicatedHrefFromHubQuery,
  communityMeDedicatedPathForTab,
  parseCommunityMeTabQuery,
} from "@/lib/communityMeContentNav";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { ME_SETTINGS_PROFILE_PATH } from "@/lib/me/meSettingsL5";

type TabSearch = { get: (name: string) => string | null; toString(): string } | null;

/**
 * `/community/me` Hub 已取消：保留 `?tab=` 深链归一化；裸路径 → 设置 · 个人资料。
 */
export function resolveCommunityMeHubRedirect(searchParams: TabSearch): string {
  const tab = parseCommunityMeTabQuery("/community/me", searchParams);
  if (tab) {
    const dedicated = communityMeDedicatedPathForTab(tab, isCommunityMeLikesListEnabled());
    if (dedicated) {
      return communityMeDedicatedHrefFromHubQuery(dedicated, searchParams);
    }
  }

  const sp = new URLSearchParams(searchParams?.toString() ?? "");
  sp.delete("tab");
  const qs = sp.toString();
  return qs ? `${ME_SETTINGS_PROFILE_PATH}?${qs}` : ME_SETTINGS_PROFILE_PATH;
}
