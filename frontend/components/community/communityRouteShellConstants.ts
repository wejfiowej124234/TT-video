/** L1 主 Tab；桌面端「帮助与支持」与主 Tab 同一行（TabLinks 内下拉）；移动顶栏第二行仍为独立入口 */

import {
  TT_MARKETING_DARK_ROUTE_TAB_ACTIVE_COMMUNITY_PREMIUM,
  TT_MARKETING_DARK_ROUTE_TAB_IDLE_COMMUNITY_PREMIUM,
} from "@/lib/marketingUi";



export const COMMUNITY_ROUTE_SHELL_TABS = [

  {

    path: "/community",

    pathMatch: (p: string) => p === "/community" || p === "/community/feed" || p.startsWith("/community/topic/"),

    key: "community_tab_feed",

    unread: false,

  },

  {

    path: "/community/explore",

    pathMatch: (p: string) => p.startsWith("/community/explore"),

    key: "community_tab_explore",

    unread: false,

  },

  {

    path: "/community/messages",

    pathMatch: (p: string) => p.startsWith("/community/messages") || p.startsWith("/community/activity"),

    key: "community_tab_messages",

    unread: true,

  },

  {

    path: "/community/friends",

    pathMatch: (p: string) => p.startsWith("/community/friends"),

    key: "community_tab_friends",

    unread: false,

  },

] as const;



/** L1/底栏激活（premium 哑光描边 · 非整块渐变） */
export const COMMUNITY_SHELL_TAB_ACTIVE = TT_MARKETING_DARK_ROUTE_TAB_ACTIVE_COMMUNITY_PREMIUM;
export const COMMUNITY_SHELL_TAB_IDLE = TT_MARKETING_DARK_ROUTE_TAB_IDLE_COMMUNITY_PREMIUM;



/** 52 §7.5 / 13 宪法：Tab 切换 200ms 内可感知反馈，pointerdown 即显示进度条 */

export const COMMUNITY_ROUTE_SHELL_TAB_NAV_BAR_MS = 400;

