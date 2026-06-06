import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

/** 告警 incident 详情 · 折叠可观测交叉入口。 */
export const ALERT_INCIDENT_DETAIL_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/schema", labelKey: "admin_schema_title" },
  { href: "/admin/jobs", labelKey: "admin_jobs_title" },
];
