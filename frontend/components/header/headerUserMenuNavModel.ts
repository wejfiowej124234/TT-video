import {
  TT_MARKETING_HEADER_MENU_ITEM_FOCUS,
  TT_MARKETING_HEADER_USER_MENU_ITEM_AUTH_L5,
  TT_MARKETING_HEADER_USER_MENU_ITEM_DARK,
} from "@/lib/marketingUi";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { PUBLISH_HUB_PATH } from "@/lib/me/publishHubL5";
import type { HeaderUtilityVariant } from "@/lib/uiSystem";

/** 顶栏 profile strip 唯一 href（账户组不再单列「个人资料」菜单项 · 方案 A） */
export { ME_SETTINGS_PROFILE_PATH as HEADER_USER_MENU_PROFILE_HREF } from "@/lib/me/meSettingsL5";

export type HeaderUserMenuNavSectionId = "account" | "mine" | "tools";

export type HeaderUserMenuNavItem = {
  href: string;
  /** i18n key passed to `t()` */
  labelKey: string;
  className: string;
  iconId: string;
  featured?: boolean;
  /** Auth L5 分组；非 authL5 忽略 */
  section?: HeaderUserMenuNavSectionId;
  dividerBefore?: boolean;
};

export type HeaderUserMenuNavSection = {
  id: HeaderUserMenuNavSectionId;
  labelKey: string;
  items: readonly HeaderUserMenuNavItem[];
};

export type HeaderUserMenuVariant = "light" | "dark" | "authL5";

export type HeaderUserMenuNavOptions = {
  /** 与 `isCommunityMeLikesListEnabled()` 一致；默认构建时 env */
  showLikesList?: boolean;
};

export function headerUserMenuVariantFromUtility(variant: HeaderUtilityVariant): HeaderUserMenuVariant {
  if (variant === "authL5") return "authL5";
  if (variant === "community" || variant === "dark") return "dark";
  return "light";
}

function itemClass(variant: HeaderUserMenuVariant, withTopBorder = false): string {
  if (variant === "authL5") {
    const base = `block w-full text-left ${TT_MARKETING_HEADER_USER_MENU_ITEM_AUTH_L5}`;
    return withTopBorder ? `${base} border-t border-ref-sun/18 mt-1 font-medium text-ref-sun/95` : base;
  }
  if (variant === "dark") {
    const base = TT_MARKETING_HEADER_USER_MENU_ITEM_DARK;
    return withTopBorder ? `${base} border-t border-white/15 mt-1 font-medium` : base;
  }
  const base = `block px-3 py-2 text-small text-ink-800 hover:bg-ink-100 w-full text-left ${TT_MARKETING_HEADER_MENU_ITEM_FOCUS}`;
  return withTopBorder
    ? `block border-t border-ink-200 mt-1 px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-100 w-full text-left ${TT_MARKETING_HEADER_MENU_ITEM_FOCUS}`
    : base;
}

function mineNavItems(variant: HeaderUserMenuVariant, showLikesList: boolean): HeaderUserMenuNavItem[] {
  const isAuthL5 = variant === "authL5";
  const section: HeaderUserMenuNavSectionId = "mine";
  const items: HeaderUserMenuNavItem[] = [
    {
      href: PUBLISH_HUB_PATH,
      labelKey: "header_userMenu_publish_hub",
      className: itemClass(variant),
      iconId: "publish",
      featured: isAuthL5,
      section: isAuthL5 ? section : undefined,
    },
    {
      href: "/orders",
      labelKey: "header_myOrders",
      className: itemClass(variant),
      iconId: "orders",
      section: isAuthL5 ? section : undefined,
    },
    {
      href: "/community/me/posts",
      labelKey: "header_userMenu_my_posts",
      className: itemClass(variant),
      iconId: "posts",
      section: isAuthL5 ? section : undefined,
    },
    {
      href: "/community/me/collects",
      labelKey: "header_userMenu_my_collects",
      className: itemClass(variant),
      iconId: "collects",
      section: isAuthL5 ? section : undefined,
    },
  ];
  if (showLikesList) {
    items.push({
      href: "/community/me/likes",
      labelKey: "header_userMenu_my_likes",
      className: itemClass(variant),
      iconId: "likes",
      section: isAuthL5 ? section : undefined,
    });
  }
  return items;
}

function accountNavItems(variant: HeaderUserMenuVariant): HeaderUserMenuNavItem[] {
  const isAuthL5 = variant === "authL5";
  return [
    {
      href: "/me/identities",
      labelKey: "header_multiIdentity",
      className: itemClass(variant),
      iconId: "identities",
      featured: isAuthL5,
      section: isAuthL5 ? "account" : undefined,
    },
  ];
}

function toolsNavItems(variant: HeaderUserMenuVariant): HeaderUserMenuNavItem[] {
  const isAuthL5 = variant === "authL5";
  return [
    {
      href: "/community/me/reports",
      labelKey: "me_settings_item_reports",
      className: itemClass(variant),
      iconId: "reports",
      section: isAuthL5 ? "tools" : undefined,
    },
    {
      href: "/me/settings",
      labelKey: "header_settings",
      className: itemClass(variant, !isAuthL5),
      iconId: "settings",
      section: isAuthL5 ? "tools" : undefined,
      dividerBefore: !isAuthL5,
    },
  ];
}

/** 70：仅 `admin` / `super_admin` 展示；有意不在五主路由公开导航露出。 */
export function headerAdminWorkspaceNavItem(variant: HeaderUserMenuVariant): HeaderUserMenuNavItem {
  const isAuthL5 = variant === "authL5";
  return {
    href: "/admin",
    labelKey: "header_admin_workspace",
    className: itemClass(variant, true),
    iconId: "settings",
    dividerBefore: true,
    section: isAuthL5 ? "tools" : undefined,
  };
}

export type HeaderUserMenuNavOptionsWithAdmin = HeaderUserMenuNavOptions & {
  showAdminWorkspace?: boolean;
};

/**
 * 顶栏用户菜单 · 快捷轨（账户 + 我的 + 设置；与 `/me/settings` 全量目录分工）
 */
export function headerUserMenuNavItems(
  variant: HeaderUserMenuVariant,
  opts?: HeaderUserMenuNavOptionsWithAdmin,
): readonly HeaderUserMenuNavItem[] {
  const showLikesList = opts?.showLikesList ?? isCommunityMeLikesListEnabled();
  const base = [...accountNavItems(variant), ...mineNavItems(variant, showLikesList), ...toolsNavItems(variant)];
  if (!opts?.showAdminWorkspace) return base;
  return [...base, headerAdminWorkspaceNavItem(variant)];
}

export function headerUserMenuNavSections(
  variant: HeaderUserMenuVariant,
  opts?: HeaderUserMenuNavOptionsWithAdmin,
): readonly HeaderUserMenuNavSection[] {
  const items = headerUserMenuNavItems(variant, opts);
  if (variant !== "authL5") {
    return [{ id: "account", labelKey: "header_userMenu_section_account", items }];
  }
  return [
    {
      id: "account",
      labelKey: "header_userMenu_section_account",
      items: items.filter((item) => item.section === "account"),
    },
    {
      id: "mine",
      labelKey: "header_userMenu_section_mine",
      items: items.filter((item) => item.section === "mine"),
    },
    {
      id: "tools",
      labelKey: "header_userMenu_section_tools",
      items: items.filter((item) => item.section === "tools"),
    },
  ] as const;
}
