"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 与 community/me/posts 网格相册布局一致 */
export default function CommunityMePostsLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      role="status"
      aria-label={t("community_me_my_posts")}
      aria-busy="true"
    >
      <header className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-slate-900/60 backdrop-blur-md px-4 py-4 mb-4" aria-hidden>
        <div className="flex items-center justify-between">
          <div className="min-h-[44px] h-11 w-36 bg-cyan-500/20 rounded-[var(--radius-sm)] animate-pulse" />
          <div className="min-h-[44px] h-11 w-24 rounded-full bg-cyan-500/15 border border-cyan-400/35 animate-pulse" />
        </div>
      </header>
      <div className="grid grid-cols-3 gap-2" aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-800/60 animate-pulse"
          />
        ))}
      </div>
    </main>
  );
}
