import Link from "next/link";
import { communityShellTabFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

type CommunityFeedEmptyFooterProps = {
  t: (key: string) => string;
  showGuidelines?: boolean;
};

/** Feed 空态页脚链（弱化 · 与 §1.7 SSOT 同轨） */
export function CommunityFeedEmptyFooter({ t, showGuidelines = true }: CommunityFeedEmptyFooterProps) {
  return (
    <p className={TT_COMMUNITY_FEED_ACTION.emptyFooter}>
      <Link
        href="/community/explore"
        className={`${TT_COMMUNITY_FEED_ACTION.emptyFooterLink} ${communityShellTabFocus}`}
      >
        {t("community_explore_title")}
      </Link>
      <span className="text-slate-600/80" aria-hidden>
        ·
      </span>
      <Link href="/help" className={`${TT_COMMUNITY_FEED_ACTION.emptyFooterLink} ${communityShellTabFocus}`}>
        {t("help_title")}
      </Link>
      {showGuidelines ? (
        <>
          <span className="text-slate-600/80" aria-hidden>
            ·
          </span>
          <Link
            href="/terms/community-guidelines"
            className={`${TT_COMMUNITY_FEED_ACTION.emptyFooterLink} ${communityShellTabFocus}`}
          >
            {t("community_guidelines")}
          </Link>
        </>
      ) : null}
    </p>
  );
}
