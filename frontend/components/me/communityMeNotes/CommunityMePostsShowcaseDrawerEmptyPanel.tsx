"use client";

import Link from "next/link";
import { communityCyanPillFocus, communityFuchsiaPillFocus } from "@/lib/communityA11yFocus";

/** 「社区帖子」橱窗抽屉：空列表时置于三格占位下方，与「赞过 / 收藏」弹层结构对齐 */
export function CommunityMePostsShowcaseDrawerEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-4 text-center" role="region" aria-label={t("community_me_posts_drawer_preview_empty")}>
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-300"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">{t("community_me_posts_drawer_preview_empty")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link
          href="/community"
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityCyanPillFocus}`}
        >
          {t("community_empty_cta")}
        </Link>
        <Link
          href="/community/explore"
          className={`rounded-full border border-fuchsia-400/45 bg-fuchsia-500/15 px-4 py-2 text-meta font-medium text-fuchsia-100 hover:bg-fuchsia-500/25 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityFuchsiaPillFocus}`}
        >
          {t("community_explore_title")}
        </Link>
        <Link
          href="/community?publish=1"
          prefetch={false}
          className={`rounded-full border border-cyan-400/40 bg-ink-700/70 px-4 py-2 text-meta font-medium text-cyan-200 hover:bg-ink-600/80 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityCyanPillFocus}`}
        >
          {t("community_me_posts_link_publish")}
        </Link>
      </div>
    </div>
  );
}
