/**
 * 发布中心 · 订单 · 顶栏 · 商家工作台 IA 边界 · ① ACTIVE / FROZEN（100/100）
 * SSOT：`evidence/GO_local_auth_l5/PUBLISH-HUB-IA-BOUNDARY-SCORE.md`
 */

export const PUBLISH_HUB_IA_BOUNDARY_SCORE = 100 as const;

export const PUBLISH_HUB_IA_BOUNDARY_ACTIVE = true as const;

export const PUBLISH_HUB_IA_BOUNDARY_FROZEN = true as const;

export const PUBLISH_HUB_IA_BOUNDARY_FROZEN_AT = "2026-06-13" as const;

export const PUBLISH_HUB_IA_BOUNDARY_FROZEN_MARKER = "publish-hub-ia-boundary-20260613" as const;

export const PUBLISH_HUB_IA_BOUNDARY_SCORE_DOC =
  "evidence/GO_local_auth_l5/PUBLISH-HUB-IA-BOUNDARY-SCORE.md" as const;

export const PUBLISH_HUB_IA_BOUNDARY_PUBLISH_PATH = "/me/publish" as const;

/** 冻结范围 · 结构/copy/互链 · ① 不再新增 Publish Hub 功能 */
export const PUBLISH_HUB_IA_BOUNDARY_FROZEN_SCOPES = [
  "me_publish_page",
  "orders_boundary_copy",
  "header_menu_naming",
  "provider_cross_links",
] as const;

export type PublishHubIaBoundaryFrozenScope = (typeof PUBLISH_HUB_IA_BOUNDARY_FROZEN_SCOPES)[number];

export const PUBLISH_HUB_IA_BOUNDARY_PAGE_DATA_ATTR = "data-tt-publish-hub-ia-boundary-frozen" as const;

export const ORDERS_IA_BOUNDARY_PAGE_DATA_ATTR = "data-tt-orders-ia-boundary-frozen" as const;

export const ORDERS_PUBLISH_HUB_BOUNDARY_LINK_DATA_ATTR = "data-tt-orders-list-publish-hub-link" as const;

export const PROVIDER_PUBLISH_HUB_LINK_DATA_ATTR = "data-tt-provider-workbench-publish-hub-link" as const;

/** 冻结 copy / nav 键 · 改文案须 i18n 同批 + 绿集 */
export const PUBLISH_HUB_IA_BOUNDARY_FROZEN_I18N_KEYS: readonly string[] = [
  "publish_hub_subtitle",
  "publish_hub_meta_description",
  "orders_list_publish_hub_boundary",
  "orders_list_open_publish_hub",
  "header_userMenu_publish_hub",
  "header_userMenu_my_posts",
  "header_myOrders",
  "provider_workbench_market_exposure_subtitle",
  "provider_workbench_market_exposure_subtitle_blocked",
] as const;

export const PUBLISH_HUB_IA_BOUNDARY_HEADER_NAV = {
  publishHubHref: PUBLISH_HUB_IA_BOUNDARY_PUBLISH_PATH,
  publishHubLabelKey: "header_userMenu_publish_hub",
  ordersLabelKey: "header_myOrders",
  ordersHref: "/orders",
  postsLabelKey: "header_userMenu_my_posts",
  postsHref: "/community/me/posts",
} as const;

export const PUBLISH_HUB_IA_BOUNDARY_PROVIDER_LINK = {
  href: `${PUBLISH_HUB_IA_BOUNDARY_PUBLISH_PATH}?filter=merchant`,
  labelKey: "header_userMenu_publish_hub",
  dataAttr: PROVIDER_PUBLISH_HUB_LINK_DATA_ATTR,
} as const;

export function publishHubIaBoundaryPageDataAttrs(): Record<string, string> {
  return {
    [PUBLISH_HUB_IA_BOUNDARY_PAGE_DATA_ATTR]: "1",
    "data-tt-ui-frozen-ia-boundary": PUBLISH_HUB_IA_BOUNDARY_FROZEN_MARKER,
  };
}

export function ordersIaBoundaryPageDataAttrs(): Record<string, string> {
  return {
    [ORDERS_IA_BOUNDARY_PAGE_DATA_ATTR]: "1",
    "data-tt-ui-frozen-ia-boundary": PUBLISH_HUB_IA_BOUNDARY_FROZEN_MARKER,
  };
}
