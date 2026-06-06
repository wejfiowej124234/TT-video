"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { ADMIN_DETAIL_FIELD_LABEL_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const LINKS: { href: string; labelKey: string; dataTt?: string }[] = [
  { href: "/admin/inbox", labelKey: "admin_unified_inbox_nav_short" },
  { href: ADMIN_INBOX_QUEUE_HREFS.reports, labelKey: "admin_community_reports_title" },
  { href: "/admin/community/penalties", labelKey: "admin_penalties_title" },
  { href: "/admin/community/appeals", labelKey: "admin_appeals_title" },
  {
    href: "/admin/observability",
    labelKey: "admin_observability_title",
    dataTt: "admin-back-observability-hub",
  },
];

/** COM-05：处罚/申诉页与举报工单交叉入口。 */
export function AdminCommunityRelatedLinks() {
  const { t } = useTranslation();
  return (
    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-small" data-tt-admin-community-related="1">
      <span className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t("admin_community_related_label")}</span>
      {LINKS.map(({ href, labelKey, dataTt }) => (
        <Link
          key={href}
          href={href}
          className={adminPageNavLinkClass()}
          {...(href === "/admin/observability"
            ? { "data-tt-admin-back-observability-hub": "1" }
            : dataTt
              ? { [`data-tt-${dataTt}`]: "1" }
              : {})}
        >
          {t(labelKey)}
        </Link>
      ))}
    </p>
  );
}
