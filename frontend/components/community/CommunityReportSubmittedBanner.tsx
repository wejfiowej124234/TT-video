"use client";

import Link from "next/link";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";

/** 举报提交成功后的固定底栏：单条工单 + 全部列表（160 / 31 §3.2） */
export function CommunityReportSubmittedBanner({
  t,
  reportId,
  className = "",
}: {
  t: (key: string) => string;
  reportId: string;
  /** 附加定位/z-index 等 */
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-center font-medium">{t("community_report_submitted")}</p>
      <div className="mt-2 flex flex-col items-center gap-2 border-t border-ref-sun/18 pt-2">
        <Link
          href={`/community/me/reports/${encodeURIComponent(reportId)}`}
          className={`inline-flex min-h-[44px] items-center justify-center text-meta font-medium text-ref-sun/90 underline underline-offset-2 hover:text-ref-sun/95 motion-sub ${communityCardLinkFocus}`}
        >
          {t("community_report_view_ticket")}
        </Link>
        <Link
          href="/community/me/reports"
          className={`inline-flex min-h-[44px] items-center justify-center text-meta font-medium text-slate-300 underline underline-offset-2 hover:text-ref-sun/95 motion-sub ${communityCardLinkFocus}`}
        >
          {t("community_report_view_all_reports")}
        </Link>
      </div>
    </div>
  );
}
