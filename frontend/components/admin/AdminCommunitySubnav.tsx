"use client";

import { ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";

const RELATED_LINKS: { href: string; labelKey: string }[] = [
  { href: "/admin/community/reports", labelKey: "admin_community_reports_title" },
  { href: "/admin/community/moderation/cases", labelKey: "admin_community_reports_linkModCases" },
  { href: "/admin/community/risk-signals", labelKey: "admin_community_reports_linkRisk" },
  { href: "/admin/community/penalties", labelKey: "admin_community_reports_linkPenalties" },
  { href: "/admin/community/appeals", labelKey: "admin_community_reports_linkAppeals" },
  { href: "/admin/community/appeals/review", labelKey: "admin_community_reports_linkAppealReview" },
  { href: "/admin/community/abuse-policy", labelKey: "admin_community_reports_linkAbusePolicy" },
  { href: "/admin/community/comments/visibility", labelKey: "admin_community_reports_linkCommentVis" },
  { href: "/admin/community/policy-change-logs", labelKey: "admin_community_reports_linkPolicy" },
  { href: "/admin/community/ranking/snapshots", labelKey: "admin_community_reports_linkRanking" },
];

/** 社区治理子页：相关页面折叠（面包屑由 AdminSubpageBreadcrumb 统一承担 · batch54）。 */
export function AdminCommunitySubnav() {
  const { t } = useTranslation();

  return (
    <nav className="mb-4" aria-label={t("admin_community_subnav_aria")}>
      <details className={ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS}>
        <summary className="cursor-pointer text-small font-medium text-ink-700">
          {t("admin_community_subnav_related")}
        </summary>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small">
          {RELATED_LINKS.map(({ href, labelKey }) => (
            <li key={href}>
              <Link href={href} className={`${adminPageNavLinkClass()}`}>
                {t(labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
