"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 orders/new：步骤条 + 创建表单壳（53 下单入口） */
export default function OrdersNewLoading() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-main" role="status" aria-label={t("orders_createTitle")} aria-busy="true">
      <section className="mx-auto max-w-md px-6 py-12" aria-hidden>
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`min-h-[44px] min-w-[44px] h-11 w-11 rounded-[var(--radius-sm)] border ${
                i === 0 ? "border-travel-500 bg-travel-500/15" : "border-ink-200 bg-ink-50"
              } animate-pulse`}
            />
          ))}
        </div>
        <div className="min-h-[44px] h-11 w-48 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mt-6 mb-4" />
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="h-3 w-24 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="min-h-[44px] h-11 w-full border border-ink-200 rounded-[var(--radius-sm)] bg-bg-console animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-20 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="min-h-[44px] h-11 w-full border border-ink-200 rounded-[var(--radius-sm)] bg-bg-console animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-20 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="min-h-[44px] h-11 w-full border border-ink-200 rounded-[var(--radius-sm)] bg-bg-console animate-pulse" />
          </div>
          <div className="min-h-[44px] h-11 w-full rounded-[var(--radius-sm)] bg-travel-500/25 animate-pulse" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="h-4 w-24 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="h-4 w-20 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="h-4 w-16 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        </div>
      </section>
    </main>
  );
}
