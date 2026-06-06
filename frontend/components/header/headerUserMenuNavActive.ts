/** Auth L5 用户菜单 · 当前路由高亮（pathname + hub `?tab=`） */

import { ME_SETTINGS_PROFILE_PATH } from "@/lib/me/meSettingsL5";

const COMMUNITY_ME_DEDICATED_PREFIXES = [
  "/community/me/posts",
  "/community/me/collects",
  "/community/me/reports",
  "/community/me/likes",
] as const;

function parseHubTab(search: string): string | null {
  if (!search) return null;
  try {
    return new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get("tab");
  } catch {
    return null;
  }
}

function hrefHubTab(href: string): string | null {
  const q = href.indexOf("?");
  if (q < 0) return null;
  return parseHubTab(href.slice(q));
}

export function headerUserMenuNavItemIsActive(
  pathname: string,
  href: string,
  searchParams: Pick<URLSearchParams, "get"> | null,
): boolean {
  const path = pathname || "/";
  const hubTab = hrefHubTab(href);

  if (hubTab != null) {
    return false;
  }

  if (href === ME_SETTINGS_PROFILE_PATH) {
    return path === ME_SETTINGS_PROFILE_PATH || path.startsWith(`${ME_SETTINGS_PROFILE_PATH}/`);
  }

  if (
    href === "/me/settings" &&
    (path === "/me/settings" ||
      path.startsWith("/me/settings/") ||
      path === "/me/password" ||
      path === "/me/security")
  ) {
    return true;
  }

  if (path === href) return true;
  if (path.startsWith(`${href}/`)) return true;
  return false;
}
