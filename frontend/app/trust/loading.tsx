"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** /trust：与 TrustTransparencyHub 深色壳 + 玻璃卡骨架一致（96-16 D4 / 88） */
export default function TrustLoading() {
  const { t } = useTranslation();
  const card =
    "rounded-[var(--radius-md)] border border-ink-500/55 bg-ink-800/60 backdrop-blur-md px-4 py-4 sm:px-5 sm:py-5";

  return (
    <main
      className="min-h-screen relative overflow-hidden bg-ink-900"
      role="status"
      aria-label={t("trust_page_title")}
      aria-busy="true"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.08),_transparent_55%)]" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <header className="mb-8 space-y-3">
          <div className="h-4 w-28 rounded-[var(--radius-sm)] bg-cyan-500/20 animate-pulse motion-reduce:animate-none" aria-hidden />
          <div className="min-h-[44px] h-11 w-64 max-w-full rounded-[var(--radius-sm)] bg-ink-500/80 animate-pulse motion-reduce:animate-none" aria-hidden />
          <div className="h-4 w-full max-w-xl rounded-[var(--radius-sm)] bg-ink-500/60 animate-pulse motion-reduce:animate-none" aria-hidden />
          <div className="h-4 w-5/6 max-w-lg rounded-[var(--radius-sm)] bg-ink-500/50 animate-pulse motion-reduce:animate-none" aria-hidden />
        </header>

        <section className={`${card} mb-6 border-cyan-500/25`} aria-hidden>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 rounded-[var(--radius-sm)] bg-ink-500/70 animate-pulse motion-reduce:animate-none" />
              <div className="h-4 w-full max-w-md rounded-[var(--radius-sm)] bg-ink-500/50 animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="min-h-[44px] h-11 w-32 rounded-full border border-cyan-400/40 bg-cyan-500/15 animate-pulse motion-reduce:animate-none shrink-0" />
          </div>
          <div className="mt-6 h-24 w-full rounded-[var(--radius-sm)] bg-ink-700/80 animate-pulse motion-reduce:animate-none" />
        </section>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <section key={i} className={card} aria-hidden>
              <div className="h-4 w-24 rounded-[var(--radius-sm)] bg-ink-500/60 animate-pulse motion-reduce:animate-none mb-3" />
              <div className="h-3 w-full rounded-[var(--radius-sm)] bg-ink-500/45 animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-5/6 mt-2 rounded-[var(--radius-sm)] bg-ink-500/40 animate-pulse motion-reduce:animate-none" />
            </section>
          ))}
        </div>

        <p className="text-center text-meta text-ink-400 motion-sub animate-pulse motion-reduce:animate-none" aria-live="polite">
          {t("common_loading")}
        </p>
      </div>
    </main>
  );
}
