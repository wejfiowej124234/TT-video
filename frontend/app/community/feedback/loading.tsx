"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 feedback 页首屏：玻璃标题区 + 列表区卡片骨架 */
export default function CommunityFeedbackLoading() {
  const { t } = useTranslation();
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6" role="status" aria-label={t("community_feedback_title")} aria-busy="true">
      <header className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-slate-900/60 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-6 shadow-scifi-banner-strong space-y-3" aria-hidden>
        <div className="min-h-[44px] h-11 w-3/5 max-w-xs rounded-[var(--radius-sm)] bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-cyan-500/20 animate-pulse" />
        <div className="h-4 w-full max-w-md bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="min-h-[44px] h-11 w-28 rounded-full bg-fuchsia-500/25 border border-fuchsia-400/40 animate-pulse" />
          <div className="min-h-[44px] h-11 w-24 rounded-full bg-slate-700/50 border border-slate-500/50 animate-pulse" />
        </div>
      </header>
      <section className="rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/40 p-4 sm:p-6 space-y-4" aria-hidden>
        <div className="min-h-[44px] h-11 w-40 bg-slate-600/45 rounded-[var(--radius-sm)] animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 p-4 space-y-2">
            <div className="flex gap-2">
              <div className="h-3 w-20 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-3 w-14 bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
            </div>
            <div className="h-3 w-full bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-3 w-11/12 bg-slate-700/35 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
        ))}
      </section>
    </main>
  );
}
