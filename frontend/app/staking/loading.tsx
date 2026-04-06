"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** /staking：与质押页同 max-w-2xl + 多块 Console 面板骨架（35 信任区） */
export default function StakingLoading() {
  const { t } = useTranslation();
  const panelClass =
    "rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft space-y-4";

  return (
    <main className="min-h-screen bg-bg-main text-ink-800" role="status" aria-label={t("staking_pageTitle")} aria-busy="true">
      <div className="container max-w-2xl py-12 px-4">
        <header className="mb-8">
          <div className="min-h-[44px] h-11 w-52 max-w-full bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
          <div className="h-4 w-full max-w-lg bg-ink-100 rounded-[var(--radius-sm)] mt-3 animate-pulse" aria-hidden />
          <div className="h-4 w-2/3 max-w-md bg-ink-100 rounded-[var(--radius-sm)] mt-2 animate-pulse" aria-hidden />
        </header>

        <section className={panelClass} aria-hidden>
          <div className="h-4 w-full max-w-xl bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="h-4 w-full max-w-lg bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full max-w-md bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-4 w-full max-w-md bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
          </div>
          <div className="min-h-[44px] h-11 w-44 bg-trust-600/25 rounded-[var(--radius-sm)] animate-pulse mt-4" />
        </section>

        {[1, 2, 3, 4].map((i) => (
          <section key={i} className={`${panelClass} mt-6`} aria-hidden>
            <div className="h-5 w-40 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-4 w-full max-w-sm bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="h-24 w-full bg-ink-100/80 rounded-[var(--radius-sm)] animate-pulse" />
          </section>
        ))}

        <p className="mt-8 text-center text-meta text-ink-500 motion-sub animate-pulse" aria-live="polite">
          {t("common_loading")}
        </p>
      </div>
    </main>
  );
}
