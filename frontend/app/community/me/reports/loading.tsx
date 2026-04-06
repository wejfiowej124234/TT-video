"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 community/me/reports 列表卡片一致 */
export default function CommunityMeReportsListLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-lg mx-auto px-4 py-6 pb-24 safe-area-pb"
      role="status"
      aria-label={t("community_me_my_reports")}
      aria-busy="true"
    >
      <div className="flex items-center gap-3 mb-6" aria-hidden>
        <div className="h-4 w-16 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="min-h-[44px] h-11 flex-1 max-w-[12rem] bg-cyan-500/15 rounded-[var(--radius-sm)] animate-pulse" />
      </div>
      <div className="h-4 w-full max-w-md bg-slate-700/40 rounded-[var(--radius-sm)] mb-4 animate-pulse" aria-hidden />
      <ul className="space-y-3" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-900/70 p-4 h-[5.5rem] animate-pulse"
          />
        ))}
      </ul>
    </main>
  );
}
