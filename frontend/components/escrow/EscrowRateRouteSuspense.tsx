"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 `/escrow/[id]/rate` 主内容区样式一致，供骨架与内页共用 */
export const escrowRatePanelClass =
  "rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-4 md:p-6";
export const escrowRateZoneClass = "rounded-[var(--radius-xl)] bg-slate-950 text-slate-200 space-y-6 p-4 md:p-6";

/** §4.4.7：与首屏布局同构的骨架，200ms 内可感知 */
export function EscrowRatePageSkeleton({ t }: { t: (k: string) => string }) {
  return (
    <main className="min-h-screen bg-bg-main text-ink-800" aria-label={t("rate_pageTitle")}>
      <h1 className="sr-only">{t("rate_pageTitle")}</h1>
      <div className="container py-8 md:py-12">
        <div data-zone="order-protocol" className={escrowRateZoneClass}>
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-h-[44px] h-11 w-48 rounded-[var(--radius-sm)] bg-slate-700/50 animate-pulse" />
            <div className="h-5 w-24 rounded-[var(--radius-sm)] bg-slate-700/50 animate-pulse" />
          </header>
          <section className={escrowRatePanelClass}>
            <div className="h-5 w-40 rounded-[var(--radius-sm)] bg-slate-700/50 animate-pulse mb-2" />
            <div className="h-4 w-full max-w-md rounded-[var(--radius-sm)] bg-slate-700/50 animate-pulse mb-4" />
            <div className="border-2 border-dashed border-slate-600 rounded-[var(--radius-md)] p-8 h-32" />
          </section>
          <section className={escrowRatePanelClass}>
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

/** `/escrow/[id]/rate` 内层使用 `useParams`；须在 Suspense 内（Next 15 · 07 §5.1） */
export function EscrowRateRouteSuspenseFallback() {
  const { t } = useTranslation();
  return <EscrowRatePageSkeleton t={t} />;
}

export function EscrowRateRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<EscrowRateRouteSuspenseFallback />}>{children}</Suspense>;
}
