"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { CommunityMessagesListSkeleton } from "@/components/community/CommunityMessagesListSkeleton";

/** 与会话列表页壳一致：标题区 + 玻璃列表容器 + 列表骨架 */
export default function CommunityMessagesLoading() {
  const { t } = useTranslation();
  return (
    <main className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb" role="status" aria-label={t("community_tab_messages")} aria-busy="true">
      <header className="mb-4 space-y-2" aria-hidden>
        <div className="min-h-[44px] h-11 w-48 max-w-full rounded-[var(--radius-sm)] bg-gradient-to-r from-cyan-500/25 to-fuchsia-500/25 animate-pulse" />
        <div className="h-4 w-72 max-w-full bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
      </header>
      <section className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-scifi-panel">
        <CommunityMessagesListSkeleton />
      </section>
      <div className="h-4 w-40 mx-auto mt-6 bg-slate-700/40 rounded-[var(--radius-sm)] animate-pulse" aria-hidden />
    </main>
  );
}
