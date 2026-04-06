"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 help 页 prose + FAQ 折叠壳一致 */
export default function HelpLoading() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-console py-12 px-4" role="status" aria-label={t("help_title")} aria-busy="true">
      <div className="max-w-2xl mx-auto" aria-hidden>
        <div className="min-h-[44px] h-11 w-48 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="mt-2 h-4 w-full max-w-xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="min-h-[44px] h-11 w-40 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mt-6" />
        <div className="mt-2 space-y-2 pl-1">
          <div className="h-3 w-full bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="h-3 w-11/12 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        </div>
        <div className="min-h-[44px] h-11 w-36 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mt-6" />
        <div className="mt-2 h-3 w-full bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="mt-8 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main px-4 py-3 flex items-center justify-between gap-2"
            >
              <div className="h-4 flex-1 max-w-md bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="h-4 w-4 bg-ink-100 rounded-[var(--radius-sm)] shrink-0 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
