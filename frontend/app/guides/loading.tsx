"use client";

import { useTranslation } from "@/components/LocaleProvider";
/** 与 guides/page 首屏布局一致：市场背景 + 标题区 + 卡片网格骨架 */
export default function GuidesLoading() {
  const { t } = useTranslation();
  return (
    <main className="relative min-h-screen" role="status" aria-label={t("guides_title")} aria-busy="true">
      <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
      <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="space-y-2">
            <div className="h-4 w-48 bg-slate-600/40 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
            <div className="min-h-[44px] h-11 w-56 max-w-full bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
            <div className="h-4 w-72 max-w-full bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
          </header>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0" aria-hidden>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <li key={i} className="rounded-[var(--radius-xl)] border border-white/20 bg-white/5 backdrop-blur-md p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-700/50 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-2/3 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
                    <div className="h-3 w-full bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-full bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" />
                <div className="h-3 w-4/5 bg-slate-700/30 rounded-[var(--radius-sm)] animate-pulse" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
