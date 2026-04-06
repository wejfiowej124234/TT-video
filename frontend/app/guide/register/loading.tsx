"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 guide/register 表单壳：max-w-md + DID 说明框 + 字段槽 */
export default function GuideRegisterLoading() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-main" role="status" aria-label={t("guideRegister_title")} aria-busy="true">
      <section className="mx-auto max-w-md px-6 py-12" aria-hidden>
        <div className="min-h-[44px] h-11 w-48 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mb-2" />
        <div className="h-4 w-full bg-ink-100 rounded-[var(--radius-sm)] animate-pulse mb-4" />
        <div className="mb-4 rounded-[var(--radius-sm)] border border-travel-500/30 bg-travel-500/5 p-3 space-y-2">
          <div className="h-4 w-40 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="h-3 w-full bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2 rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/50 p-3">
            <div className="h-4 w-36 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-h-[44px] h-11 w-full bg-white border border-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            ))}
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-24 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="min-h-[44px] h-11 w-full border border-ink-200 rounded-[var(--radius-sm)] bg-bg-console animate-pulse" />
            </div>
          ))}
          <div className="min-h-[44px] h-11 w-full rounded-[var(--radius-sm)] bg-travel-500/30 border border-travel-500/50 animate-pulse" />
        </div>
      </section>
    </main>
  );
}
