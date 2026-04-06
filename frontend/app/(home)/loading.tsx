"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 28 Landing：首屏骨架；与 Hero 深色底协调，≤200ms 可感知加载（52 §7.5 精神） */
export default function HomeLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="relative min-h-screen flex items-center justify-center p-8"
      role="status"
      aria-label={t("landing_hero_title")}
      aria-busy="true"
    >
      <h1 className="sr-only">{t("landing_hero_title")}</h1>
      <div className="fixed inset-0 z-0 bg-slate-900 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 z-0 bg-black/45 pointer-events-none" aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-[var(--radius-lg)] border border-white/20 bg-black/35 backdrop-blur-md px-8 py-10 flex flex-col items-center gap-4 shadow-strong">
        <div className="min-h-[44px] h-11 w-56 rounded-[var(--radius-md)] bg-white/20 animate-pulse" aria-hidden />
        <div className="h-4 w-44 rounded-[var(--radius-sm)] bg-white/15 animate-pulse" aria-hidden />
        <div className="h-4 w-32 rounded-[var(--radius-sm)] bg-white/10 animate-pulse" aria-hidden />
        <p className="text-small text-white/85 motion-sub animate-pulse mt-2" aria-live="polite">
          {t("common_loading")}
        </p>
      </div>
    </main>
  );
}
