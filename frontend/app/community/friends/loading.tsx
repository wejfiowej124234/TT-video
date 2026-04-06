"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { CommunityFriendsListSkeleton } from "@/components/community/CommunityFriendsListSkeleton";

/** 与好友页壳一致：标题 + Tab 条 + 玻璃列表骨架 */
export default function CommunityFriendsLoading() {
  const { t } = useTranslation();
  return (
    <main className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb" role="status" aria-label={t("community_tab_friends")} aria-busy="true">
      <header className="mb-4 space-y-2" aria-hidden>
        <div className="min-h-[44px] h-11 w-44 max-w-full rounded-[var(--radius-sm)] bg-gradient-to-r from-cyan-500/25 to-fuchsia-500/25 animate-pulse" />
        <div className="h-4 w-64 max-w-full bg-slate-700/45 rounded-[var(--radius-sm)] animate-pulse" />
      </header>
      <div className="flex gap-2 mb-4 rounded-[var(--radius-md)] p-1 bg-slate-800/60 flex-wrap" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-h-[44px] h-11 w-20 sm:w-24 rounded-[var(--radius-md)] bg-slate-700/50 animate-pulse" />
        ))}
      </div>
      <section className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-scifi-panel">
        <CommunityFriendsListSkeleton />
      </section>
    </main>
  );
}
