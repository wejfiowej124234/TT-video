"use client";

import { useTranslation } from "@/components/LocaleProvider";
import MarketAmbientBackdrop from "@/components/market/MarketAmbientBackdrop";

/** 子站详情路由 `loading.tsx`：与详情页头图 + 段落区块节奏一致。 */
export default function MarketSubsiteDetailLoading() {
  const { t } = useTranslation();
  return (
    <main className="relative min-h-screen" role="status" aria-busy="true" aria-label={t("common_loading")}>
      <MarketAmbientBackdrop />
      <div className="relative z-10 isolate min-h-screen">
        <div className="flex justify-center px-4 pt-4">
          <div className="h-10 w-full max-w-5xl animate-pulse motion-reduce:animate-none rounded-[var(--radius-md)] bg-white/10" aria-hidden />
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-4">
          <div className="h-4 w-32 animate-pulse motion-reduce:animate-none rounded bg-white/15" aria-hidden />
          <div className="mt-3 h-10 w-full max-w-lg animate-pulse motion-reduce:animate-none rounded-lg bg-white/15" aria-hidden />
          <div className="mt-3 h-4 w-full animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
          <div className="mt-2 h-4 w-[92%] max-w-2xl animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="h-8 w-24 animate-pulse motion-reduce:animate-none rounded-full bg-white/10" aria-hidden />
            <div className="h-8 w-28 animate-pulse motion-reduce:animate-none rounded-full bg-white/10" aria-hidden />
            <div className="h-8 w-32 animate-pulse motion-reduce:animate-none rounded-full bg-warning/20" aria-hidden />
          </div>
          <div className="relative mt-6 aspect-[16/10] w-full animate-pulse motion-reduce:animate-none rounded-[var(--radius-lg)] bg-white/10" aria-hidden />
          <div className="mt-8 space-y-3 rounded-[var(--radius-lg)] border border-white/15 bg-ink-900/50 p-5">
            <div className="h-5 w-40 animate-pulse motion-reduce:animate-none rounded bg-white/15" aria-hidden />
            <div className="h-4 w-full animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
            <div className="h-4 w-full animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
          </div>
          <div className="mt-6 space-y-2">
            <div className="h-7 w-48 animate-pulse motion-reduce:animate-none rounded bg-white/15" aria-hidden />
            <div className="h-4 w-full animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
            <div className="h-4 w-full animate-pulse motion-reduce:animate-none rounded bg-white/10" aria-hidden />
          </div>
        </div>
        <p className="pb-10 text-center text-small text-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" aria-live="polite">
          {t("common_loading")}
        </p>
      </div>
    </main>
  );
}
