"use client";

import { adminPageNavLinkClass } from "@/lib/adminUi";
import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const RELATED_LINKS: { href: string; labelKey: string }[] = [
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

/** 社区治理子页：面包屑 + 相关页面折叠（避免顶栏链接墙）。 */
export function AdminCommunitySubnav(props: { currentLabelKey: string }) {
  const { t } = useTranslation();

  return (
    <nav className="mb-4 space-y-2" aria-label={t("admin_community_subnav_aria")}>
      <p className="text-small text-ink-600">
        <Link
          href="/admin"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_community_reports_back")}
        </Link>
        <span className="mx-2 text-ink-300" aria-hidden>
          /
        </span>
        <span className="font-medium text-ink-800">{t(props.currentLabelKey)}</span>
      </p>
      <details className="rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/60 px-3 py-2">
        <summary className="cursor-pointer text-small font-medium text-ink-700">
          {t("admin_community_subnav_related")}
        </summary>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small">
          {RELATED_LINKS.map(({ href, labelKey }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${adminPageNavLinkClass()}`}
              >
                {t(labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
