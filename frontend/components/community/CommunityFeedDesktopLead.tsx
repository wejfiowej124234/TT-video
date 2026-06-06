import Link from "next/link";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_FEED_LEAD_GRID_CELL } from "@/lib/marketingUi";

export interface CommunityFeedDesktopLeadProps {
  t: (key: string) => string;
}

/** 224-D · 桌面首屏顶带（一行 · 与侧栏顶对齐） */
export default function CommunityFeedDesktopLead({ t }: CommunityFeedDesktopLeadProps) {
  return (
    <div
      className={`${TT_COMMUNITY_FEED_LEAD_GRID_CELL} ${TT_COMMUNITY_FEED_ACTION.feedHeroRow}`}
      aria-label={t("community_tab_feed")}
    >
      <p className={TT_COMMUNITY_FEED_ACTION.feedHeroTitle}>{t("community_subtitle")}</p>
      <div className={TT_COMMUNITY_FEED_ACTION.headerExploreRow}>
        <Link href="/community/explore" className={`${TT_COMMUNITY_FEED_ACTION.headerLink} ${communityCardLinkFocus}`}>
          {t("community_explore_title")}
        </Link>
        <span className="text-slate-600" aria-hidden>
          ·
        </span>
        <Link
          href="/terms/community-guidelines"
          className={`inline-flex min-h-[44px] items-center justify-center text-meta text-slate-400 hover:text-ref-sun/90 motion-sub underline-offset-2 hover:underline ${communityCardLinkFocus}`}
        >
          {t("community_guidelines")}
        </Link>
      </div>
    </div>
  );
}
