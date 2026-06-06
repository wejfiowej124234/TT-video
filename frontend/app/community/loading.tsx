"use client";

import { useTranslation } from "@/components/LocaleProvider";

/**
 * 仅作用于 `/community` 首页（同段 page.tsx）；子路由另有各自 loading。
 * 与 CommunityFeedHeader + 发布入口 + FilterBar + Feed 卡片栅格同构；Tab 进度条仍在 layout。
 */
export default function CommunityLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6"
      role="status"
      aria-label={t("community_tab_feed")}
      aria-busy="true"
    >
      <header
        className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-slate-900/60 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-4 shadow-scifi-banner-strong"
        aria-hidden
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="min-h-[44px] h-11 w-48 max-w-full rounded-[var(--radius-sm)] bg-gradient-to-r from-ref-sun/25 to-ref-coral/20 animate-pulse" />
            <div className="h-4 w-64 max-w-full bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="min-h-[44px] h-11 w-24 rounded-full bg-ref-sun/12 border border-ref-sun/35 animate-pulse" />
            <div className="min-h-[44px] h-11 w-28 rounded-full bg-slate-800/80 border border-slate-500/50 animate-pulse" />
            <div className="min-h-[44px] h-11 w-24 rounded-full bg-slate-800/80 border border-slate-500/50 animate-pulse" />
          </div>
        </div>
      </header>

      <div
        className="w-full rounded-[var(--radius-xl)] border border-ref-sun/28 bg-slate-900/70 backdrop-blur-md px-4 py-3 mb-4 flex items-center gap-3 min-h-[52px]"
        aria-hidden
      >
        <div className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-ref-sun/12 border border-ref-sun/35 animate-pulse shrink-0" />
        <div className="flex-1 h-4 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="h-4 w-20 bg-ref-sun/12 rounded-[var(--radius-sm)] animate-pulse shrink-0" />
      </div>

      <section className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-900/70 backdrop-blur-md p-3 sm:p-4 mb-4 space-y-3" aria-hidden>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-h-[44px] h-11 w-20 rounded-full bg-slate-800/80 border border-slate-600/50 animate-pulse" />
          ))}
        </div>
        <div className="min-h-[44px] h-11 w-full max-w-md rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-950/50 animate-pulse" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-h-[44px] h-11 w-16 rounded-[var(--radius-md)] bg-slate-800/70 animate-pulse" />
          ))}
        </div>
      </section>

      <ul className="space-y-4 list-none p-0 m-0" aria-hidden>
        {[1, 2, 3].map((i) => (
          <li
            key={i}
            className="rounded-[var(--radius-xl)] border border-ref-sun/22 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-scifi-panel"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-600/40">
              <div className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-700/70 ring-2 ring-ref-sun/20 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
                <div className="h-3 w-24 bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
              </div>
            </div>
            <div className="aspect-[4/3] max-h-72 bg-slate-800/60 animate-pulse" />
            <div className="px-4 py-3 flex gap-4">
              <div className="h-4 w-12 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-4 w-12 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-4 w-12 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
