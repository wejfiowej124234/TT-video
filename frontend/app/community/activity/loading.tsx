"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 活动中心：与页头标题区 + 卡片区同宽，避免 Tab 切到「消息/活动」时空白闪动 */
export default function CommunityActivityLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      role="status"
      aria-label={t("community_activity_title")}
      aria-busy="true"
    >
      <header className="mb-4 space-y-3" aria-hidden>
        <div className="min-h-[44px] h-11 w-56 max-w-full rounded-[var(--radius-md)] bg-gradient-to-r from-cyan-500/25 to-fuchsia-500/25 animate-pulse" />
        <div className="h-4 w-72 max-w-full rounded-[var(--radius-sm)] bg-slate-700/50 animate-pulse" />
      </header>
      <div
        className="rounded-[var(--radius-xl)] border border-cyan-500/25 bg-slate-900/70 backdrop-blur-md p-6 min-h-[12rem] space-y-4"
        aria-hidden
      >
        <div className="h-5 w-40 rounded-[var(--radius-md)] bg-slate-700/60 animate-pulse" />
        <div className="h-24 w-full rounded-[var(--radius-md)] bg-slate-800/60 animate-pulse" />
      </div>
    </main>
  );
}
