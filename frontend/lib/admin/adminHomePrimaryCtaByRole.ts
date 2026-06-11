import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import type { ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";

export type PrimaryCtaDef = {
  href: string;
  labelKey: string;
};

/** ① 按控制台角色优先展示的主 CTA（仍与待办分数合并）。 */
export function rolePrimaryCtaFallback(consoleRole: ConsoleRole70 | null): PrimaryCtaDef[] {
  switch (consoleRole) {
    case "Finance":
      return [
        { href: "/admin/finance-suite", labelKey: "admin_home_primary_cta_finance" },
        { href: "/admin/finance-reconciliation", labelKey: "admin_home_primary_cta_reconciliation" },
        { href: "/admin/orders", labelKey: "admin_home_primary_cta_orders" },
      ];
    case "CS":
      return [
        { href: ADMIN_INBOX_QUEUE_HREFS.reports, labelKey: "admin_home_primary_cta_reports" },
        { href: "/admin/users", labelKey: "admin_home_primary_cta_users" },
        { href: "/admin/disputes", labelKey: "admin_home_primary_cta_disputes" },
      ];
    case "Risk":
      return [
        { href: "/admin/disputes", labelKey: "admin_home_primary_cta_disputes" },
        { href: "/admin/community/risk-signals", labelKey: "admin_home_primary_cta_risk" },
        { href: ADMIN_INBOX_QUEUE_HREFS.approvals, labelKey: "admin_home_primary_cta_approvals" },
      ];
    case "Auditor":
      return [
        { href: "/admin/audit", labelKey: "admin_home_primary_cta_audit" },
        { href: "/admin/cross-check", labelKey: "admin_home_primary_cta_cross_check" },
        { href: "/admin/drift-summary", labelKey: "admin_home_primary_cta_drift" },
      ];
    case "SuperAdmin":
      return [
        { href: ADMIN_INBOX_QUEUE_HREFS.approvals, labelKey: "admin_home_primary_cta_approvals" },
        { href: ADMIN_INBOX_QUEUE_HREFS.provider, labelKey: "admin_home_primary_cta_provider" },
        { href: ADMIN_INBOX_QUEUE_HREFS.reports, labelKey: "admin_home_primary_cta_reports" },
      ];
    case "Ops":
    default:
      return [
        { href: "/admin/content/countries", labelKey: "admin_home_primary_cta_content_publish" },
        { href: "/admin/growth/analytics", labelKey: "admin_home_primary_cta_growth_analytics" },
        { href: ADMIN_INBOX_QUEUE_HREFS.reports, labelKey: "admin_home_primary_cta_reports" },
      ];
  }
}
