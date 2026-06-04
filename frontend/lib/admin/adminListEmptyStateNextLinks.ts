/** ① 列表空态「下一步」链 SSOT（HON-04 · 与 `AdminListPageEmptyState` 对拍）。 */

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";

export type AdminEmptyNextLink = { href: string; labelKey: string };

export const ADMIN_EMPTY_NEXT_CONFIG_HUB: AdminEmptyNextLink = {
  href: "/admin/config",
  labelKey: "admin_config_hub_title",
};

export const ADMIN_EMPTY_NEXT_PERMISSIONS: AdminEmptyNextLink = {
  href: "/admin/permissions",
  labelKey: "admin_shell_nav_permissions",
};

/** 平台 / 配置 / Flags 类列表默认可去配置枢纽 + 权限中心 */
export const ADMIN_EMPTY_NEXT_PLATFORM_HUB: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_CONFIG_HUB,
  ADMIN_EMPTY_NEXT_PERMISSIONS,
];

export const ADMIN_EMPTY_NEXT_AUDIT_HUB: AdminEmptyNextLink[] = [
  { href: "/admin/audit/operations", labelKey: "admin_audit_link_operations" },
  { href: "/admin", labelKey: "admin_shell_nav_workspace" },
];

export const ADMIN_EMPTY_NEXT_ONBOARDING_HUB: AdminEmptyNextLink = {
  href: "/admin/onboarding",
  labelKey: "admin_onboarding_hub_title",
};

export const ADMIN_EMPTY_NEXT_PROVIDER_QUEUE: AdminEmptyNextLink = {
  href: ADMIN_INBOX_QUEUE_HREFS.provider,
  labelKey: "admin_home_inbox_provider",
};

export const ADMIN_EMPTY_NEXT_STEWARD_QUEUE: AdminEmptyNextLink = {
  href: ADMIN_INBOX_QUEUE_HREFS.steward,
  labelKey: "admin_home_inbox_steward",
};

export const ADMIN_EMPTY_NEXT_APPROVALS_QUEUE: AdminEmptyNextLink = {
  href: ADMIN_INBOX_QUEUE_HREFS.approvals,
  labelKey: "admin_home_pinned_approvals",
};

export const ADMIN_EMPTY_NEXT_REPORTS_QUEUE: AdminEmptyNextLink = {
  href: ADMIN_INBOX_QUEUE_HREFS.reports,
  labelKey: "admin_community_reports_title",
};

export const ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_PINNED: AdminEmptyNextLink = {
  href: ADMIN_INBOX_QUEUE_HREFS.provider,
  labelKey: "admin_home_pinned_provider",
};

export const ADMIN_EMPTY_NEXT_REPORTS_QUEUE_PINNED: AdminEmptyNextLink = {
  href: ADMIN_INBOX_QUEUE_HREFS.reports,
  labelKey: "admin_home_pinned_reports",
};

export const ADMIN_EMPTY_NEXT_ONBOARDING_ENTITLEMENTS: AdminEmptyNextLink = {
  href: "/admin/onboarding/entitlements",
  labelKey: "admin_onb_entitlements_title",
};

export const ADMIN_EMPTY_NEXT_PROVIDER_APPLICATIONS: AdminEmptyNextLink = {
  href: "/admin/provider-applications",
  labelKey: "admin_provider_list_title",
};

export const ADMIN_EMPTY_NEXT_COMMUNITY_APPEALS: AdminEmptyNextLink = {
  href: "/admin/community/appeals",
  labelKey: "admin_appeals_title",
};

export const ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES: AdminEmptyNextLink = {
  href: "/admin/community/penalties",
  labelKey: "admin_penalties_title",
};

/** 商家入驻队列为空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_STEWARD_QUEUE,
  ADMIN_EMPTY_NEXT_APPROVALS_QUEUE,
  ADMIN_EMPTY_NEXT_ONBOARDING_HUB,
];

/** 主理人入驻队列为空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_STEWARD_QUEUE_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_PROVIDER_QUEUE,
  ADMIN_EMPTY_NEXT_APPROVALS_QUEUE,
  ADMIN_EMPTY_NEXT_ONBOARDING_HUB,
];

/** 统一收件箱全部清空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_UNIFIED_INBOX_CLEAR: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_REPORTS_QUEUE,
  { href: "/admin/orders", labelKey: "admin_orders_title" },
  { href: "/admin", labelKey: "admin_shell_nav_workspace" },
];

/** 审批列表筛选空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_PINNED,
  ADMIN_EMPTY_NEXT_REPORTS_QUEUE_PINNED,
  ADMIN_EMPTY_NEXT_ONBOARDING_HUB,
];

/** 社区举报列表空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_COMMUNITY_APPEALS,
  ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES,
  ADMIN_EMPTY_NEXT_APPROVALS_QUEUE,
];

/** onboarding 子列表空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_ONBOARDING_LIST_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_ONBOARDING_HUB,
  ADMIN_EMPTY_NEXT_ONBOARDING_ENTITLEMENTS,
  ADMIN_EMPTY_NEXT_PROVIDER_APPLICATIONS,
];

export const ADMIN_EMPTY_NEXT_DISPUTES: AdminEmptyNextLink = {
  href: "/admin/disputes",
  labelKey: "admin_disputes_title",
};

export const ADMIN_EMPTY_NEXT_USERS: AdminEmptyNextLink = {
  href: "/admin/users",
  labelKey: "admin_home_pinned_users",
};

export const ADMIN_EMPTY_NEXT_ORDERS_PINNED: AdminEmptyNextLink = {
  href: "/admin/orders",
  labelKey: "admin_home_pinned_orders",
};

export const ADMIN_EMPTY_NEXT_WORKSPACE: AdminEmptyNextLink = {
  href: "/admin",
  labelKey: "admin_shell_nav_workspace",
};

export const ADMIN_EMPTY_NEXT_APPROVALS_SHELL: AdminEmptyNextLink = {
  href: ADMIN_INBOX_QUEUE_HREFS.approvals,
  labelKey: "admin_shell_nav_approvals_queue",
};

/** 订单列表筛选空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_ORDERS_FILTERED_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_DISPUTES,
  ADMIN_EMPTY_NEXT_USERS,
  ADMIN_EMPTY_NEXT_WORKSPACE,
];

/** 争议列表筛选空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_DISPUTES_FILTERED_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_ORDERS_PINNED,
  ADMIN_EMPTY_NEXT_REPORTS_QUEUE_PINNED,
  ADMIN_EMPTY_NEXT_APPROVALS_QUEUE,
];

/** 用户列表筛选空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_USERS_FILTERED_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_APPROVALS_SHELL,
  ADMIN_EMPTY_NEXT_PROVIDER_QUEUE,
  ADMIN_EMPTY_NEXT_WORKSPACE,
];

export const ADMIN_EMPTY_NEXT_GUIDES_SHELL_PROVIDER: AdminEmptyNextLink = {
  href: ADMIN_INBOX_QUEUE_HREFS.provider,
  labelKey: "admin_shell_nav_provider_queue",
};

export const ADMIN_EMPTY_NEXT_MARKET_PUBLIC: AdminEmptyNextLink = {
  href: "/market",
  labelKey: "admin_guides_linkPublic",
};

export const ADMIN_EMPTY_NEXT_ORDERS: AdminEmptyNextLink = {
  href: "/admin/orders",
  labelKey: "admin_orders_title",
};

export const ADMIN_EMPTY_NEXT_MOD_CASES: AdminEmptyNextLink = {
  href: "/admin/community/moderation/cases",
  labelKey: "admin_shell_nav_mod_cases",
};

export const ADMIN_EMPTY_NEXT_RISK_SIGNALS: AdminEmptyNextLink = {
  href: "/admin/community/risk-signals",
  labelKey: "admin_shell_nav_risk_signals",
};

export const ADMIN_EMPTY_NEXT_ABUSE_POLICY: AdminEmptyNextLink = {
  href: "/admin/community/abuse-policy",
  labelKey: "admin_abuse_title",
};

export const ADMIN_EMPTY_NEXT_POLICIES: AdminEmptyNextLink = {
  href: "/admin/policies",
  labelKey: "admin_policies_title",
};

/** 向导列表空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_GUIDES_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_GUIDES_SHELL_PROVIDER,
  ADMIN_EMPTY_NEXT_MARKET_PUBLIC,
  ADMIN_EMPTY_NEXT_WORKSPACE,
];

/** 评价列表空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_REVIEWS_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_ORDERS,
  ADMIN_EMPTY_NEXT_DISPUTES,
  ADMIN_EMPTY_NEXT_WORKSPACE,
];

/** Flags 列表空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_FLAGS_EMPTY: AdminEmptyNextLink[] = [
  ...ADMIN_EMPTY_NEXT_PLATFORM_HUB,
  ADMIN_EMPTY_NEXT_WORKSPACE,
];

/** 社区处罚列表空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_REPORTS_QUEUE_PINNED,
  ADMIN_EMPTY_NEXT_COMMUNITY_APPEALS,
  ADMIN_EMPTY_NEXT_APPROVALS_QUEUE,
];

/** 社区申诉列表空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_COMMUNITY_APPEALS_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_REPORTS_QUEUE_PINNED,
  ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES,
  ADMIN_EMPTY_NEXT_APPROVALS_QUEUE,
];

/** 社区 moderation cases 空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_COMMUNITY_MOD_CASES_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_REPORTS_QUEUE_PINNED,
  ADMIN_EMPTY_NEXT_RISK_SIGNALS,
  ADMIN_EMPTY_NEXT_COMMUNITY_APPEALS,
];

/** 社区 risk signals 空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_COMMUNITY_RISK_SIGNALS_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_REPORTS_QUEUE_PINNED,
  ADMIN_EMPTY_NEXT_MOD_CASES,
  ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES,
];

/** 社区 ranking snapshots 空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_COMMUNITY_RANK_SNAPSHOTS_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_REPORTS_QUEUE_PINNED,
  ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES,
  ADMIN_EMPTY_NEXT_RISK_SIGNALS,
];

/** 社区 policy change logs 空 · 交叉链 SSOT */
export const ADMIN_EMPTY_NEXT_COMMUNITY_POLICY_LOGS_EMPTY: AdminEmptyNextLink[] = [
  ADMIN_EMPTY_NEXT_ABUSE_POLICY,
  ADMIN_EMPTY_NEXT_POLICIES,
  ADMIN_EMPTY_NEXT_REPORTS_QUEUE,
];
