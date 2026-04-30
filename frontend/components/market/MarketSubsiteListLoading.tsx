"use client";

import { useTranslation } from "@/components/LocaleProvider";
import MarketAmbientBackdrop from "@/components/market/MarketAmbientBackdrop";

type Variant = "provider" | "acquisition";

/** 子站列表路由 `loading.tsx`：与筛选条 + 瀑布流版式对齐，减少白屏闪烁。 */
export default function MarketSubsiteListLoading({ variant }: { variant: Variant }) {
  const { t } = useTranslation();
  const mainLabel =
    variant === "provider" ? t("market_segment_provider_title") : t("market_segment_acquisition_title");

  return (
    <main className="relative min-h-screen" role="status" aria-busy="true" aria-label={mainLabel}>
      <MarketAmbientBackdrop />
      <div className="relative z-10 isolate min-h-screen">
        <section className="px-4 pt-5 pb-3 sm:pt-6" aria-hidden>
          <div className="mx-auto max-w-5xl space-y-3 rounded-[var(--radius-lg)] border border-white/10 bg-ink-900/55 p-4 ring-1 ring-white/[0.04] sm:p-5">
            <div className="mx-auto h-8 max-w-xs animate-pulse motion-reduce:animate-none rounded-lg bg-white/12" />
            <div className="mx-auto h-3 max-w-md animate-pulse motion-reduce:animate-none rounded bg-white/10" />
            <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-ink-900/40 p-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                <div className="mx-auto h-11 w-full max-w-[11rem] animate-pulse motion-reduce:animate-none rounded-xl bg-white/10 sm:mx-0" />
                <div className="flex justify-center gap-1 border-t border-white/10 pt-2 sm:border-t-0 sm:border-l sm:border-white/10 sm:pt-0 sm:pl-4 sm:ml-2">
                  <div className="h-9 w-16 animate-pulse motion-reduce:animate-none rounded-[var(--radius-md)] bg-white/10" />
                  <div className="h-9 w-14 animate-pulse motion-reduce:animate-none rounded-[var(--radius-md)] bg-white/10" />
                  <div className="h-9 w-16 animate-pulse motion-reduce:animate-none rounded-[var(--radius-md)] bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="sticky top-0 z-20 border-b border-white/10 bg-ink-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-ink-900/65">
          <div className="mx-auto max-w-5xl space-y-3 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="h-5 w-28 animate-pulse motion-reduce:animate-none rounded bg-white/15" aria-hidden />
              <div className="h-5 w-24 animate-pulse motion-reduce:animate-none rounded bg-warning/20" aria-hidden />
            </div>
            <div className="h-4 w-40 animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
            <div className="flex gap-2 overflow-hidden pb-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-11 w-16 shrink-0 animate-pulse motion-reduce:animate-none rounded-[var(--radius-sm)] bg-white/10" aria-hidden />
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-11 w-20 animate-pulse motion-reduce:animate-none rounded-[var(--radius-sm)] bg-white/10" aria-hidden />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-11 w-28 animate-pulse motion-reduce:animate-none rounded-[var(--radius-sm)] bg-white/10" aria-hidden />
                  ))}
                </div>
              </div>
            </div>
            <div className="h-4 w-3/4 max-w-xl mx-auto animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="columns-1 gap-4 sm:columns-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid">
                <div className="overflow-hidden rounded-[var(--radius-lg)] border border-white/15 bg-ink-900/55 shadow-[0_0_24px_-8px_rgba(35,206,217,0.12)]">
                  <div className="aspect-[4/5] w-full animate-pulse motion-reduce:animate-none bg-white/10 sm:aspect-[3/4]" aria-hidden />
                  <div className="space-y-2 p-3.5">
                    <div className="h-4 w-full animate-pulse motion-reduce:animate-none rounded bg-white/15" aria-hidden />
                    <div className="h-4 w-[80%] animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
                    <div className="h-3 w-1/2 animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="pb-10 text-center text-small text-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" aria-live="polite">
          {t("common_loading")}
        </p>
      </div>
    </main>
  );
}
