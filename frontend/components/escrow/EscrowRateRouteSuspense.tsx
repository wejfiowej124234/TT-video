"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_ESCROW_RATE_PAGE_SHELL,
  TT_ESCROW_RATE_PANEL,
  TT_ESCROW_RATE_ZONE,
} from "@/lib/escrowRateL5";

/** 与 `/escrow/[id]/rate` 主内容区样式一致，供骨架与内页共用 */
export const escrowRatePanelClass = TT_ESCROW_RATE_PANEL;
export const escrowRateZoneClass = TT_ESCROW_RATE_ZONE;

/** §4.4.7：与首屏布局同构的骨架，200ms 内可感知 */
export function EscrowRatePageSkeleton({ t }: { t: (k: string) => string }) {
  return (
    <main className={TT_ESCROW_RATE_PAGE_SHELL} aria-label={t("rate_pageTitle")}>
      <h1 className="sr-only">{t("rate_pageTitle")}</h1>
      <div className="container py-8 md:py-12 max-w-5xl">
        <div data-zone="order-protocol" className={escrowRateZoneClass}>
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-h-[44px] h-11 w-48 rounded-[var(--radius-sm)] bg-white/10 animate-pulse" />
            <div className="h-5 w-24 rounded-[var(--radius-sm)] bg-white/10 animate-pulse" />
          </header>
          <section className={escrowRatePanelClass}>
            <div className="h-5 w-40 rounded-[var(--radius-sm)] bg-white/10 animate-pulse mb-2" />
            <div className="h-4 w-full max-w-md rounded-[var(--radius-sm)] bg-white/10 animate-pulse mb-4" />
            <div className="border-2 border-dashed border-ref-sun/20 rounded-[var(--radius-md)] p-8 h-32" />
          </section>
          <section className={escrowRatePanelClass}>
            <div className="h-4 w-24 rounded-[var(--radius-sm)] bg-white/10 animate-pulse mb-3" />
            <div className="h-4 w-32 rounded-[var(--radius-sm)] bg-white/10 animate-pulse mb-4" />
            <div className="h-4 w-24 rounded-[var(--radius-sm)] bg-white/10 animate-pulse mb-2" />
            <div className="h-4 w-40 rounded-[var(--radius-sm)] bg-white/10 animate-pulse" />
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
