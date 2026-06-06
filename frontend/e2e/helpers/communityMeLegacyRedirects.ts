/**
 * `<main aria-label={t("me_title")}>`（`app/community/me/page.tsx`）：en **Community profile**、zh **社区资料**。
 * 旧烟雾用 `/Me|我/i` 或「个人中心」与 i18n 漂移后不再匹配，且 `/Me` 易与 **Messages** 等词串误匹配。
 */
export const communityMeMainAccessibleNameRe = /Community profile|社区资料/;

/**
 * 与 `lib/communityMeFeatureFlags.isCommunityMeLikesListEnabled` 同口径（Playwright 进程 env）；
 * 赞过列表关时 E2E 跳过依赖 `/community/me/likes` 的用例。
 */
export function likesListEnabledForPlaywright(): boolean {
  const raw = process.env.NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST;
  if (raw == null || raw.trim() === "") return true;
  const v = raw.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  return false;
}
