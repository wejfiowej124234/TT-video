"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 community/me/collects 纵向 Feed 卡片列表一致 */
export default function CommunityMeCollectsLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      role="status"
      aria-label={t("community_me_my_collects")}
      aria-busy="true"
    >
      <header className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-slate-900/60 backdrop-blur-md px-4 py-4 mb-4" aria-hidden>
        <div className="flex items-center justify-between">
          <div className="min-h-[44px] h-11 w-40 bg-cyan-500/20 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="min-h-[44px] h-11 w-24 rounded-full bg-cyan-500/15 border border-cyan-400/35 animate-pulse" />
        </div>
      </header>
      <div className="space-y-4" aria-hidden>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-600/40">
              <div className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-700/70 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
                <div className="h-3 w-24 bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" />
              </div>
            </div>
            <div className="h-40 sm:h-48 bg-slate-800/55 animate-pulse" />
            <div className="px-4 py-3 space-y-2">
              <div className="h-3 w-full bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-3 w-4/5 bg-slate-700/35 rounded-[var(--radius-sm)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
