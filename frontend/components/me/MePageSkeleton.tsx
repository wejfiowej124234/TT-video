"use client";

import MePageBackground from "./MePageBackground";

export interface MePageSkeletonProps {
  t: (k: string) => string;
  /** 缺省 `me_title`；向导工作台等可传 `guide_dashboard_title` */
  ariaLabelKey?: string;
}

export default function MePageSkeleton({ t, ariaLabelKey = "me_title" }: MePageSkeletonProps) {
  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950" aria-label={t(ariaLabelKey)}>
      <MePageBackground />
      <div className="relative z-10 max-w-3xl mx-auto px-3 py-6 sm:px-4 sm:py-8">
        <header className="rounded-[var(--radius-md)] border border-cyan-400/30 bg-slate-900/60 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-4 sm:mb-6">
          <div className="min-h-[44px] h-11 w-40 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="h-4 w-56 mt-2 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
        </header>
        <section className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-4 sm:mb-6">
          <div className="h-5 w-24 mb-3 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[var(--radius-md)] border border-cyan-500/20 bg-slate-800/60 px-3 py-3 sm:px-4 sm:py-3">
                <div className="min-h-[44px] h-11 min-w-[44px] w-12 mx-auto bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
                <div className="h-3 w-14 mx-auto mt-2 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[var(--radius-md)] border border-fuchsia-500/30 bg-slate-900/70 backdrop-blur-md overflow-hidden mb-6">
          <div className="border-b border-fuchsia-500/20 bg-slate-800/60 px-4 py-3 sm:px-6">
            <div className="h-5 w-28 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
          <div className="p-4 sm:p-6 flex gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-700/50 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 bg-slate-600/50 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-4 w-48 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-3 w-full max-w-[200px] bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
            </div>
          </div>
        </section>
        <p className="sr-only" role="status" aria-live="polite">{t("me_loading")}</p>
      </div>
    </main>
  );
}
