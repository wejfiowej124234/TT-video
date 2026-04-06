"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 itinerary/new：步骤条槽 + 标题 + 表单字段骨架（不引用 OrderFlowSteps，避免与加载段重复拉取） */
export default function ItineraryNewLoading() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-2xl p-8" role="status" aria-label={t("itin_title")} aria-busy="true">
      <div className="flex flex-wrap gap-1 sm:gap-2 mb-2" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`min-h-[44px] min-w-[44px] h-11 w-11 rounded-[var(--radius-sm)] border text-center flex items-center justify-center text-meta ${
              i === 0 ? "border-travel-500 bg-travel-500/15" : "border-ink-200 bg-ink-50"
            } animate-pulse`}
          />
        ))}
      </div>
      <div className="min-h-[44px] h-11 w-48 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mt-6" aria-hidden />
      <div className="mt-2 h-4 w-full max-w-lg bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
      <div className="mt-6 space-y-3" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-28 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="min-h-[44px] h-11 w-full border border-ink-200 rounded-[var(--radius-sm)] bg-bg-console animate-pulse" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="min-h-[44px] h-11 border border-ink-200 rounded-[var(--radius-sm)] bg-bg-console animate-pulse" />
          <div className="min-h-[44px] h-11 border border-ink-200 rounded-[var(--radius-sm)] bg-bg-console animate-pulse" />
        </div>
        <div className="h-24 w-full border border-ink-200 rounded-[var(--radius-sm)] bg-bg-console animate-pulse" />
        <div className="min-h-[44px] h-11 w-full max-w-xs rounded-[var(--radius-sm)] bg-travel-500/20 border border-travel-500/40 animate-pulse mt-2" />
      </div>
    </main>
  );
}
