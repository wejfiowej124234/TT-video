"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 community/me 页壳一致：资料卡 + 统计条 + 推荐横滑槽 + 快捷入口网格 */
export default function CommunityMeLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      role="status"
      aria-label={t("me_title")}
      aria-busy="true"
    >
      <header className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-slate-900/60 backdrop-blur-md px-4 py-6 mb-4 shadow-scifi-banner" aria-hidden>
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="h-20 w-20 rounded-full bg-slate-700/70 ring-2 ring-ref-sun/25 animate-pulse" />
            <div className="absolute -bottom-0.5 -right-0.5 h-11 w-11 min-h-[44px] min-w-[44px] rounded-full border-2 border-slate-900 bg-slate-600/80 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="min-h-[44px] h-11 w-40 max-w-full bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-4 w-24 bg-ref-sun/12 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-3 w-full max-w-sm bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-3 w-3/4 max-w-xs bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 sm:gap-6 mt-4 pt-4 border-t border-slate-600/50 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center min-w-[60px] flex flex-col gap-1">
              <span className="block min-h-[44px] h-11 min-w-[44px] w-12 rounded-[var(--radius-sm)] bg-slate-600/70 animate-pulse mx-auto" />
              <span className="block h-3 w-12 rounded-[var(--radius-sm)] bg-slate-700/60 animate-pulse mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <div className="min-h-[44px] h-11 w-28 rounded-full bg-ref-sun/12 border border-ref-sun/28 animate-pulse" />
          <div className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-800/80 border border-slate-500/50 animate-pulse" />
        </div>
      </header>

      <section className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-900/70 backdrop-blur-md p-4 mb-4" aria-hidden>
        <div className="h-5 w-40 bg-slate-600/45 rounded-[var(--radius-sm)] animate-pulse mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-[120px] rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 p-3 space-y-2">
              <div className="h-12 w-12 rounded-full bg-slate-700/70 mx-auto animate-pulse" />
              <div className="h-3 w-full bg-slate-600/40 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="min-h-[44px] h-11 w-full rounded-full bg-slate-700/50 animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-900/70 backdrop-blur-md p-4 mb-4" aria-hidden>
        <div className="h-5 w-32 bg-slate-600/45 rounded-[var(--radius-sm)] animate-pulse mb-3" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-4 py-3 min-h-[52px] flex items-center gap-3">
              <div className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] bg-slate-700/60 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="h-4 w-3/4 bg-slate-600/45 rounded-[var(--radius-sm)] animate-pulse" />
                <div className="h-3 w-full bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
