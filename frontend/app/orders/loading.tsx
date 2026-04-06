"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 我的订单：与列表页布局同构（max-w-4xl + 卡片行），降低 CLS（51-31-25 / 52） */
export default function OrdersLoading() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-main" role="status" aria-label={t("orders_myOrders")} aria-busy="true">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8">
          <div className="min-h-[44px] h-11 w-48 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
          <div className="h-4 w-72 max-w-full bg-ink-100 rounded-[var(--radius-sm)] mt-2 animate-pulse" aria-hidden />
        </header>
        <ul className="space-y-4" role="list" aria-hidden>
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className="rounded-[var(--radius-lg)] border border-ink-200 bg-white shadow-soft overflow-hidden flex flex-col sm:flex-row"
            >
              <div className="h-40 sm:h-auto sm:w-44 shrink-0 bg-ink-100 animate-pulse" />
              <div className="flex-1 p-4 sm:p-5 space-y-3">
                <div className="h-5 w-2/3 max-w-xs bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
                <div className="h-4 w-40 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  <div className="min-h-[44px] h-11 w-24 bg-ink-100 rounded-[var(--radius-md)] animate-pulse" />
                  <div className="min-h-[44px] h-11 w-28 bg-ink-100 rounded-[var(--radius-md)] animate-pulse" />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-meta text-ink-500 motion-sub animate-pulse" aria-live="polite">
          {t("common_loading")}
        </p>
      </section>
    </main>
  );
}
