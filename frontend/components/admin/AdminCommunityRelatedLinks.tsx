"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const LINKS: { href: string; labelKey: string }[] = [
  { href: ADMIN_INBOX_QUEUE_HREFS.reports, labelKey: "admin_community_reports_title" },
  { href: "/admin/community/penalties", labelKey: "admin_penalties_title" },
  { href: "/admin/community/appeals", labelKey: "admin_appeals_title" },
];

/** COM-05：处罚/申诉页与举报工单交叉入口。 */
export function AdminCommunityRelatedLinks() {
  const { t } = useTranslation();
  return (
    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-small" data-tt-admin-community-related="1">
      <span className="text-ink-500">{t("admin_community_related_label")}</span>
      {LINKS.map(({ href, labelKey }) => (
        <Link
          key={href}
          href={href}
          className={`${adminPageNavLinkClass()}`}
        >
          {t(labelKey)}
        </Link>
      ))}
    </p>
  );
}
