"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** /pay：与 Phase 4 支付页同容器与 Console 卡片骨架（07 / 13 资金区克制） */
export default function PayLoading() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-main text-ink-800" role="status" aria-label={t("pay_pageTitle")} aria-busy="true">
      <div className="container max-w-2xl py-12 px-4">
        <header className="mb-8">
          <div className="min-h-[44px] h-11 w-40 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
          <div className="h-4 w-full max-w-lg bg-ink-100 rounded-[var(--radius-sm)] mt-3 animate-pulse" aria-hidden />
          <div className="h-4 w-4/5 max-w-md bg-ink-100 rounded-[var(--radius-sm)] mt-2 animate-pulse" aria-hidden />
        </header>

        <div className="mb-8 space-y-2" aria-hidden>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="min-h-[44px] h-11 min-w-[3.5rem] flex-1 max-w-[4.5rem] rounded-[var(--radius-sm)] bg-ink-100 animate-pulse" />
            ))}
          </div>
          <div className="h-4 w-full max-w-sm bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        </div>

        <section
          className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft space-y-4"
          aria-hidden
        >
          <div className="h-4 w-32 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="space-y-2 pl-2">
            <div className="h-4 w-full max-w-md bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-4 w-full max-w-lg bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-4 w-3/4 max-w-sm bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="min-h-[44px] h-11 w-32 bg-travel-500/30 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="min-h-[44px] h-11 w-36 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
          <div className="pt-4 border-t border-ink-200 space-y-2">
            <div className="h-4 w-28 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="min-h-[44px] h-11 w-full max-w-md bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
        </section>

        <p className="mt-8 text-center text-meta text-ink-500 motion-sub animate-pulse" aria-live="polite">
          {t("common_loading")}
        </p>
      </div>
    </main>
  );
}
