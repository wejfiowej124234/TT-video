"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 /traveltrust 网络落地页壳一致（85 路由；仅骨架） */
export default function TravelTrustLoading() {
  const { t } = useTranslation();
  return (
    <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6" role="status" aria-label={t("traveltrust_title")} aria-busy="true">
      <div className="min-h-[44px] h-11 w-4/5 max-w-lg rounded-[var(--radius-lg)] bg-white/10 animate-pulse" aria-hidden />
      <div className="mt-4 h-4 w-full rounded-[var(--radius-md)] bg-white/8 animate-pulse" aria-hidden />
      <div className="mt-2 h-4 w-11/12 rounded-[var(--radius-md)] bg-white/8 animate-pulse" aria-hidden />
      <div className="mt-4 h-3 w-48 rounded-[var(--radius-md)] bg-ref-cyan/20 animate-pulse" aria-hidden />
      <section
        className="mt-10 space-y-2 rounded-[var(--radius-xl)] border border-white/10 bg-slate-900/40 p-6 shadow-scifi-panel backdrop-blur-sm"
        aria-hidden
      >
        <div className="h-5 w-40 rounded-[var(--radius-md)] bg-white/12 animate-pulse" />
        <div className="h-3 w-full rounded-[var(--radius-md)] bg-white/8 animate-pulse" />
        <div className="h-3 w-full rounded-[var(--radius-md)] bg-white/8 animate-pulse" />
      </section>
    </main>
  );
}
