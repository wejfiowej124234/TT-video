import Link from "next/link";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
export function AdminCommunityReportsHeaderLinks({ t }: { t: (k: string) => string }) {
  const link = `${adminPageNavLinkClass()}`;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
      <Link href="/admin/community/moderation/cases" className={link}>
        {t("admin_community_reports_linkModCases")}
      </Link>
      <Link href="/admin/community/risk-signals" className={link}>
        {t("admin_community_reports_linkRisk")}
      </Link>
      <Link href="/admin/community/policy-change-logs" className={link}>
        {t("admin_community_reports_linkPolicy")}
      </Link>
      <Link href="/admin/community/abuse-policy" className={link}>
        {t("admin_community_reports_linkAbusePolicy")}
      </Link>
      <Link href="/admin/community/comments/visibility" className={link}>
        {t("admin_community_reports_linkCommentVis")}
      </Link>
      <Link href="/admin/community/ranking/snapshots" className={link}>
        {t("admin_community_reports_linkRanking")}
      </Link>
      <Link href="/admin/community/penalties" className={link}>
        {t("admin_community_reports_linkPenalties")}
      </Link>
      <Link href="/admin/community/appeals" className={link}>
        {t("admin_community_reports_linkAppeals")}
      </Link>
      <Link href="/admin/community/appeals/review" className={link}>
        {t("admin_community_reports_linkAppealReview")}
      </Link>
      <Link
        href="/admin/observability"
        className={`${adminPageNavLinkClass()}`}
      >
        {t("admin_observability_title")}
      </Link>
      <Link href="/admin" className={link}>
        {t("admin_community_reports_back")}
      </Link>
    </div>
  );
}
