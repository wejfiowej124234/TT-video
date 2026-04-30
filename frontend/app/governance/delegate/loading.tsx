"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** `/governance/delegate` 段骨架；与治理读页 loading 同 motion-reduce 口径 */
export default function GovernanceDelegateLoading() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl p-8" role="status" aria-label={t("governance_delegate_title")} aria-busy="true">
      <div className="min-h-[44px] h-11 w-56 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" aria-hidden />
      <div className="mt-3 h-4 w-full max-w-2xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" aria-hidden />
      <div className="mt-2 h-4 w-full max-w-xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" aria-hidden />
      <div className="mt-10 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 space-y-4" aria-hidden>
        <div className="h-4 w-40 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
        <div className="min-h-[44px] h-11 w-full max-w-md bg-ink-100 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none" />
        <div className="flex flex-wrap gap-2 pt-2">
          <div className="min-h-[44px] h-11 w-32 rounded-[var(--radius-sm)] bg-travel-500/20 animate-pulse motion-reduce:animate-none" />
          <div className="min-h-[44px] h-11 w-28 rounded-[var(--radius-sm)] bg-ink-200 animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
      <p className="mt-8 text-meta text-ink-500 motion-sub animate-pulse motion-reduce:animate-none" aria-live="polite">
        {t("common_loading")}
      </p>
    </main>
  );
}
