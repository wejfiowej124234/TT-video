"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 admin 首页：顶栏 + 模块卡片网格骨架（07 §五 5.6C / 70） */
export default function AdminLoading() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" role="status" aria-label={t("admin_workspace_title")} aria-busy="true">
      <header className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-5 space-y-3" aria-hidden>
        <div className="min-h-[44px] h-11 w-56 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="h-4 w-full max-w-2xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
      </header>
      <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft space-y-2"
          >
            <div className="min-h-[44px] h-11 w-32 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-3 w-full bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-3 w-4/5 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
        ))}
      </section>
    </main>
  );
}
