import { safeInternalReturnPath } from "@/lib/safeInternalReturnPath";
import {
  communityMeDedicatedHrefFromHubQuery,
  communityMeDedicatedPathForTab,
} from "@/lib/communityMeContentNav";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { ME_SETTINGS_PROFILE_PATH } from "@/lib/me/meSettingsL5";

/** TT 社区动态（小红书式：登录先进 Feed，「我」仅主动点 Tab） */
export const COMMUNITY_FEED_PATH = "/community" as const;

/** 登录/注册成功且无 `returnUrl` 时的默认落点：官网地球仪首页 */
export const POST_AUTH_DEFAULT_RETURN_PATH = "/" as const;

/**
 * 裸 `/community/me`（无 `?tab=` 深链）→ `/me/settings/profile`；
 * `/community/me/posts` 等子路径保留；Hub `?tab=posts|collects|likes|orders` → 独立页 / `/orders`。
 */
export function normalizeXiaohongshuCommunityReturn(returnPath: string): string {
  if (!returnPath.startsWith("/community/me")) return returnPath;
  if (returnPath.length > "/community/me".length && returnPath["/community/me".length] === "/") {
    return returnPath;
  }

  const q = returnPath.indexOf("?");
  const search = q === -1 ? "" : returnPath.slice(q + 1);
  if (!search) return ME_SETTINGS_PROFILE_PATH;

  const sp = new URLSearchParams(search);
  const tabRaw = sp.get("tab")?.trim().toLowerCase();
  if (!tabRaw) return ME_SETTINGS_PROFILE_PATH;

  const tab =
    tabRaw === "community_posts"
      ? "posts"
      : tabRaw === "likes" || tabRaw === "collects" || tabRaw === "posts" || tabRaw === "orders"
        ? tabRaw
        : null;
  if (!tab) return COMMUNITY_FEED_PATH;

  const dedicated = communityMeDedicatedPathForTab(tab, isCommunityMeLikesListEnabled());
  if (dedicated != null) {
    return communityMeDedicatedHrefFromHubQuery(dedicated, sp);
  }
  return returnPath;
}

/** `returnUrl` 缺失/空白 → 社区动态；其余经站内校验 + 小红书式社区资料归一。 */
export function resolvePostAuthReturnPath(raw: string | null | undefined): string {
  const resolved = safeInternalReturnPath(raw, POST_AUTH_DEFAULT_RETURN_PATH);
  return normalizeXiaohongshuCommunityReturn(resolved);
}
