"use client";

import { useTranslation } from "@/components/LocaleProvider";

/**
 * `/community/topic/[tag]`：段级 loading；与 Feed 壳 + `CommunityTopicHero` 条带同构，并与 `CommunityFeedRouteSuspense` fallback 分工（首屏壳 vs `useSearchParams` 内层）。
 */
export default function CommunityTopicTagLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      role="status"
      aria-label={t("community_topic_page_label")}
      aria-busy="true"
    >
      <section
        className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-4 sm:p-5 mb-4 space-y-3 shadow-scifi-panel"
        aria-hidden
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-h-[44px] h-11 w-28 rounded-full bg-slate-800/80 border border-slate-600/50 animate-pulse" />
          <div className="min-h-[44px] h-11 w-36 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/35 animate-pulse" />
        </div>
        <div className="h-4 w-full max-w-md rounded-[var(--radius-sm)] bg-slate-700/50 animate-pulse" />
        <div className="h-4 w-48 max-w-full rounded-[var(--radius-sm)] bg-slate-700/40 animate-pulse" />
      </section>

      <section className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-3 sm:p-4 mb-4 space-y-3" aria-hidden>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-h-[44px] h-11 w-20 rounded-full bg-slate-800/80 border border-slate-600/50 animate-pulse" />
          ))}
        </div>
        <div className="min-h-[44px] h-11 w-full max-w-md rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-950/50 animate-pulse" />
      </section>

      <ul className="space-y-4 list-none p-0 m-0" aria-hidden>
        {[1, 2].map((i) => (
          <li
            key={i}
            className="rounded-[var(--radius-xl)] border border-cyan-500/25 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-scifi-panel"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-600/40">
              <div className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-700/70 ring-2 ring-cyan-400/20 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
                <div className="h-3 w-24 bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
              </div>
            </div>
            <div className="aspect-[4/3] max-h-56 bg-slate-800/60 animate-pulse" />
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
