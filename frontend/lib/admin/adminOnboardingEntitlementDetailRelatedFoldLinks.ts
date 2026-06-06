import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

/** 入驻权益详情 · 折叠枢纽交叉入口（列表回链保留顶栏）。 */
export const ONBOARDING_ENTITLEMENT_DETAIL_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/users", labelKey: "admin_onboarding_hub_users" },
  { href: "/admin/onboarding/payment-events", labelKey: "admin_onb_payment_events_title" },
  { href: "/admin/onboarding/webhook-jobs", labelKey: "admin_onboarding_hub_webhooks" },
  { href: "/admin/onboarding/compliance-audit", labelKey: "admin_onboarding_hub_compliance" },
];
