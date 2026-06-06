"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 community/me/reports/[id] 工单详情骨架一致 */
export default function CommunityMeReportDetailLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-lg mx-auto px-4 py-6 pb-24 safe-area-pb"
      role="status"
      aria-label={t("community_report_ticket_title")}
      aria-busy="true"
    >
      <div className="flex items-center gap-3 mb-6" aria-hidden>
        <div className="h-4 w-20 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="min-h-[44px] h-11 flex-1 bg-ref-sun/12 rounded-[var(--radius-sm)] animate-pulse" />
      </div>
      <div
        className="space-y-4 rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-900/70 p-4"
        aria-hidden
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 bg-slate-600/40 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-4 w-full bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
