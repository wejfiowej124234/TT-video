"use client";

import { useTranslation } from "@/components/LocaleProvider";

const panelClass = "rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-4 md:p-6";
const zoneClass = "rounded-[var(--radius-xl)] bg-slate-950 text-slate-200 space-y-6 p-4 md:p-6";

/** 与 escrow/[id]/rate 页内 RatePageSkeleton 同构，供路由段首屏 */
export default function EscrowRateLoading() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-main text-ink-800" role="status" aria-label={t("rate_pageTitle")} aria-busy="true">
      <div className="container py-8 md:py-12">
        <div data-zone="order-protocol" className={zoneClass} aria-hidden>
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-h-[44px] h-11 w-48 rounded-[var(--radius-sm)] bg-slate-700/50 animate-pulse" />
            <div className="h-5 w-24 rounded-[var(--radius-sm)] bg-slate-700/50 animate-pulse" />
          </header>
          <section className={panelClass}>
            <div className="h-5 w-40 rounded-[var(--radius-sm)] bg-slate-700/50 animate-pulse mb-2" />
            <div className="h-4 w-full max-w-md rounded-[var(--radius-sm)] bg-slate-700/50 animate-pulse mb-4" />
            <div className="border-2 border-dashed border-slate-600 rounded-[var(--radius-md)] p-8 h-32 bg-slate-900/40 animate-pulse" />
          </section>
          <section className={panelClass}>
            <div className="h-4 w-24 rounded-[var(--radius-sm)] bg-slate-700/50 mb-3" />
            <div className="h-4 w-32 rounded-[var(--radius-sm)] bg-slate-700/50 mb-4" />
            <div className="h-4 w-24 rounded-[var(--radius-sm)] bg-slate-700/50 mb-2" />
            <div className="h-4 w-40 rounded-[var(--radius-sm)] bg-slate-700/50" />
          </section>
        </div>
      </div>
    </main>
  );
}
