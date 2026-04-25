"use client";

import { useTranslation } from "@/components/LocaleProvider";
const PANEL = "rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-800/70 backdrop-blur-md shadow-scifi-panel";

/** 与 guides/[id]/page 首屏一致：市场背景 + max-w-2xl Hero + 资质区骨架 */
export default function GuideDetailLoading() {
  const { t } = useTranslation();
  return (
    <main className="relative min-h-screen" role="status" aria-label={t("guideDetail_title")} aria-busy="true">
      <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
      <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="h-4 w-64 max-w-full bg-ink-500/40 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" aria-hidden />
          <section className={`${PANEL} p-6`} aria-hidden>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-24 h-24 shrink-0 rounded-full bg-ink-600/70 ring-2 ring-cyan-400/30 animate-pulse motion-reduce:animate-none" />
              <div className="flex-1 space-y-3 min-w-0">
                <div className="min-h-[44px] h-11 w-48 max-w-full bg-ink-500/50 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
                <div className="h-4 w-56 max-w-full bg-ink-600/45 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
                <div className="flex flex-wrap gap-2">
                  <div className="min-h-[44px] h-11 w-28 rounded-full bg-success/15 border border-success/30 animate-pulse motion-reduce:animate-none" />
                  <div className="min-h-[44px] h-11 w-40 rounded-[var(--radius-md)] bg-cyan-500/10 border border-cyan-500/35 animate-pulse motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          </section>
          <section className={PANEL} aria-hidden>
            <div className="h-12 border-b border-slate-600/50 px-4 flex items-center">
              <div className="h-5 w-32 bg-ink-500/50 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="p-4 grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-[var(--radius-md)] border border-slate-600/50 bg-ink-700/50 p-4 space-y-2">
                  <div className="h-4 w-24 bg-ink-500/45 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
                  <div className="h-3 w-full bg-ink-600/40 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
                  <div className="h-3 w-4/5 bg-ink-600/35 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
