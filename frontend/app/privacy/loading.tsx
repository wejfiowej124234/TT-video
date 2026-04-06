"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 privacy 页 prose 壳一致 */
export default function PrivacyLoading() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-console py-12 px-4" role="status" aria-label={t("privacy_title")} aria-busy="true">
      <div className="max-w-2xl mx-auto prose prose-ink" aria-hidden>
        <div className="min-h-[44px] h-11 w-44 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="mt-2 h-4 w-full bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="min-h-[44px] h-11 w-48 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mt-6" />
        <div className="mt-2 space-y-2 pl-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-3 w-full max-w-lg bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          ))}
        </div>
        <div className="min-h-[44px] h-11 w-52 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mt-6" />
        <div className="mt-2 space-y-2 pl-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-3 w-full max-w-md bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          ))}
        </div>
        <div className="mt-8 h-3 w-56 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="mt-4 flex gap-2">
          <div className="h-4 w-20 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="h-4 w-16 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        </div>
      </div>
    </main>
  );
}
