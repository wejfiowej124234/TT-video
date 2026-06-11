/**
 * 账户导航 · 全站逐页统一追踪（① 本地 · ME-P1-9）
 *
 * 合并 `meSettingsPageTracker` + `communityMePageTracker`；改动任一族须本 contract + 对应子 tracker 绿集 exit 0。
 */
import { COMMUNITY_ME_PAGE_TRACKER_V1 } from "@/lib/communityMePageTracker.v1";
import {
  ACCOUNT_NAV_HEADER_PAGE_TRACKER_V1 as SETTINGS_HEADER_TRACKER,
  ME_SETTINGS_PAGE_TRACKER_V1,
} from "@/lib/me/meSettingsPageTracker.v1";

export type AccountNavPageDomain = "settings" | "community-me" | "header-shared";

export type AccountNavUnifiedRouteV1 = {
  route: string;
  domain: AccountNavPageDomain;
  /** 机读 marker 或 route attr（文档/JSON 消费） */
  marker?: string;
  childTracker: "meSettingsPageTracker.v1" | "communityMePageTracker.v1";
};

/** 设置族 + 社区资料族（去重路径） */
export const ACCOUNT_NAV_UNIFIED_ROUTES_V1: readonly AccountNavUnifiedRouteV1[] = [
  ...ME_SETTINGS_PAGE_TRACKER_V1.map((e) => ({
    route: e.route,
    domain: "settings" as const,
    marker: e.routeMarker,
    childTracker: "meSettingsPageTracker.v1" as const,
  })),
  ...COMMUNITY_ME_PAGE_TRACKER_V1.map((e) => ({
    route: e.route,
    domain: "community-me" as const,
    marker: e.route === "/community/me" ? "hub" : e.route.replace(/^\/community\/me\//, ""),
    childTracker: "communityMePageTracker.v1" as const,
  })),
] as const;

/** 顶栏「账户 / 我的 / 工具」直达（与 Hub 设置分组去重） */
export const ACCOUNT_NAV_HEADER_ROUTES_V1 = SETTINGS_HEADER_TRACKER.map((e) => e.route);

/**
 * 跨域 IA 硬闸（顶栏主入口 · Hub 不重复）
 * @see evidence/GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md
 */
export const ACCOUNT_NAV_IA_CROSS_RULES_V1 = {
  headerSections: ["account", "mine", "tools"] as const,
  reportsHref: "/community/me/reports",
  reportsHeaderSection: "tools",
  settingsHubPath: "/me/settings",
  hubMustNotDuplicateHrefs: [
    "/orders",
    "/me/settings/profile",
    "/community/me/posts",
    "/community/me/collects",
    "/community/me/likes",
    "/community/me/reports",
    "/me/identities",
  ] as const,
  greenScripts: [
    "scripts/dev/smoke-account-nav-full-local.sh",
    "scripts/dev/smoke-account-nav-local.sh",
    "scripts/dev/smoke-me-settings-local.sh",
    "scripts/dev/run-community-me-l5-green.sh",
  ] as const,
  vitestUnion: [
    "accountNavPageTracker",
    "accountNavNamingP3",
    "meSettingsPageTracker",
    "communityMePageTracker",
    "headerUserMenuNavModel",
    "headerUtilityMenuUiFreeze",
    "MeQuickLinksSection",
  ] as const,
} as const;

export const ACCOUNT_NAV_PAGE_TRACKER_SCHEMA = "traveltrust.account-nav-page-tracker.v1" as const;

/** 机读闸 JSON（与 TS 对拍 · contract 校验） */
export const ACCOUNT_NAV_PAGE_TRACKER_JSON_PATH =
  "evidence/GO_local_auth_l5/account-nav-page-tracker.v1.json" as const;
