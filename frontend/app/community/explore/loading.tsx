"use client";

import { useTranslation } from "@/components/LocaleProvider";

export default function CommunityExploreLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      role="status"
      aria-label={t("community_explore_title")}
      aria-busy="true"
    >
      <div className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-slate-900/60 px-4 py-8 mb-4 space-y-3 animate-pulse" aria-hidden>
        <div className="min-h-[44px] h-11 w-48 max-w-full bg-slate-600/50 rounded" />
        <div className="h-4 w-full max-w-md bg-slate-700/45 rounded" />
        <div className="min-h-[44px] h-11 w-32 rounded-full bg-ref-sun/12" />
      </div>
      <div className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-900/70 p-4 h-32 animate-pulse" aria-hidden />
    </main>
  );
}
