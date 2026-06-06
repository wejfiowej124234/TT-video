"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 community/user/[id] 作者主页：顶栏 + 帖子列表卡片骨架 */
export default function CommunityUserLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      role="status"
      aria-label={t("community_user_main_aria")}
      aria-busy="true"
    >
      <header className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-slate-900/60 backdrop-blur-md px-4 py-6 mb-4" aria-hidden>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-slate-700/70 ring-2 ring-ref-sun/25 animate-pulse shrink-0" />
            <div className="space-y-2 min-w-0">
              <div className="min-h-[44px] h-11 w-32 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-4 w-24 bg-ref-sun/12 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-3 w-48 max-w-full bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" />
            </div>
          </div>
          <div className="min-h-[44px] h-11 w-24 rounded-full bg-ref-sun/12 border border-ref-sun/28 animate-pulse shrink-0" />
        </div>
      </header>

      <section className="space-y-4" aria-hidden>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-scifi-panel"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-600/40">
              <div className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-700/70 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-28 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
                <div className="h-3 w-20 bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" />
              </div>
            </div>
            <div className="aspect-[4/3] max-h-64 bg-slate-800/60 animate-pulse" />
            <div className="px-4 py-3 space-y-2">
              <div className="h-3 w-full bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-3 w-11/12 bg-slate-700/35 rounded-[var(--radius-sm)] animate-pulse" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
