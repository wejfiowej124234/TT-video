import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";

import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

/** 经营查阅列表 · 可观测枢纽（顶栏 dedupe → 折叠入口 · batch58）。 */
export const ADMIN_OPS_OBSERVABILITY_RELATED_LINK: AdminOpsDetailRelatedLink = {
  href: "/admin/observability",
  labelKey: "admin_observability_title",
  dataTt: "admin-ops-cross-observability",
};

/** 用户列表 · 折叠交叉入口（审批链见页内主操作 pill · ADM-U01 e2e 可见）。 */
export const USERS_LIST_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: ADMIN_INBOX_QUEUE_HREFS.provider, labelKey: "admin_provider_list_title" },
  { href: ADMIN_INBOX_QUEUE_HREFS.steward, labelKey: "admin_steward_list_title" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];

/** 审批列表 · 折叠交叉入口。 */
export const APPROVALS_LIST_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/users", labelKey: "admin_approvals_linkUsers", dataTt: "admin-ops-cross-users" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];

/** 订单列表 · 折叠交叉入口。 */
export const ORDERS_LIST_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/disputes", labelKey: "admin_disputes_title" },
  { href: "/admin/reviews", labelKey: "admin_reviews_title" },
  { href: "/admin/users", labelKey: "admin_users_title" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];

/** 向导列表 · 折叠交叉入口。 */
export const GUIDES_LIST_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/users", labelKey: "admin_users_title" },
  { href: "/admin/reviews", labelKey: "admin_reviews_title" },
  { href: "/admin/orders", labelKey: "admin_orders_title" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];

/** 评价列表 · 折叠交叉入口。 */
export const REVIEWS_LIST_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/orders", labelKey: "admin_orders_title" },
  { href: "/admin/guides", labelKey: "admin_guides_title" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];

/** 商家入驻队列 · 折叠交叉入口。 */
export const PROVIDER_QUEUE_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: ADMIN_INBOX_QUEUE_HREFS.steward, labelKey: "admin_steward_list_title" },
  { href: "/admin/approvals", labelKey: "admin_approvals_title" },
  { href: "/admin/users", labelKey: "admin_users_title" },
  { href: "/admin/onboarding", labelKey: "admin_onboarding_hub_title" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];

/** 主理人入驻队列 · 折叠交叉入口。 */
export const STEWARD_QUEUE_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: ADMIN_INBOX_QUEUE_HREFS.provider, labelKey: "admin_provider_list_title" },
  { href: "/admin/approvals", labelKey: "admin_approvals_title" },
  { href: "/admin/users", labelKey: "admin_users_title" },
  { href: "/admin/onboarding", labelKey: "admin_onboarding_hub_title" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];
