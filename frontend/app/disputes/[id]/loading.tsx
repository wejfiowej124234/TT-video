"use client";

import { useTranslation } from "@/components/LocaleProvider";

const SECTION = "rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-soft border border-ink-200";

/** 与 disputes/[id] 控制台布局一致：标题行 + 多段 glass 面板骨架 */
export default function DisputeDetailLoading() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-main" role="status" aria-label={t("dispute_detailTitle")} aria-busy="true">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        <div className="flex items-center justify-between gap-4" aria-hidden>
          <div className="min-h-[44px] h-11 w-56 max-w-[70%] bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="min-h-[44px] h-11 w-20 rounded-[var(--radius-sm)] bg-warning/20 animate-pulse shrink-0" />
        </div>
        <section className={SECTION} aria-hidden>
          <div className="h-5 w-32 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mb-3" />
          <ul className="space-y-2">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ink-300 animate-pulse" />
                <div className="h-4 flex-1 max-w-md bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
              </li>
            ))}
          </ul>
        </section>
        <section className={SECTION} aria-hidden>
          <div className="h-5 w-40 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-4 w-11/12 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
        </section>
        <section className={SECTION} aria-hidden>
          <div className="h-5 w-36 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse mb-3" />
          <div className="min-h-[44px] h-11 w-full bg-ink-50 border border-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
        </section>
      </div>
    </main>
  );
}
