"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { ADMIN_DETAIL_FIELD_LABEL_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

const LINKS: { href: string; labelKey: string; observabilityHub?: boolean }[] = [
  { href: "/admin/inbox", labelKey: "admin_unified_inbox_nav_short" },
  { href: ADMIN_INBOX_QUEUE_HREFS.reports, labelKey: "admin_community_reports_title" },
  { href: "/admin/community/penalties", labelKey: "admin_penalties_title" },
  { href: "/admin/community/appeals", labelKey: "admin_appeals_title" },
  { href: "/admin/community/risk-signals", labelKey: "admin_risk_signals_title" },
  { href: "/admin/community/policy-change-logs", labelKey: "admin_policy_logs_title" },
  { href: "/admin/community/ranking/snapshots", labelKey: "admin_rank_snapshots_title" },
  { href: "/admin/community/moderation/cases", labelKey: "admin_mod_cases_title" },
  { href: "/admin/audit/operations", labelKey: "admin_audit_ops_title" },
  { href: "/admin/observability", labelKey: "admin_observability_title", observabilityHub: true },
];

/**
 * COM-05 · 社区运营交叉入口（G084 KEEP_AND_PRODUCTIONIZE · G087 ops log）。
 * Bounded: 举报·申诉·风控信号·策略审计·排序快照·审核案·运维审计 — 非独立风控平台。
 */
export function AdminCommunityRelatedLinks() {
  const { t } = useTranslation();
  return (
    <p
      className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-small"
      data-tt-admin-community-related="1"
      data-tt-admin-community-bounded-honesty="1"
    >
      <span className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t("admin_community_related_label")}</span>
      {LINKS.map(({ href, labelKey, observabilityHub }) => (
        <Link
          key={href}
          href={href}
          className={adminPageNavLinkClass()}
          {...(observabilityHub ? { "data-tt-admin-back-observability-hub": "1" as const } : {})}
        >
          {t(labelKey)}
        </Link>
      ))}
    </p>
  );
}
