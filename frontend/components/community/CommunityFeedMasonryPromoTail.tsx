"use client";

import Link from "next/link";
import { TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";

export function CommunityFeedMasonryPromoTail({ t }: { t: (key: string) => string }) {
  return (
    <div
      className={TT_COMMUNITY_FEED_L5.promoTailShell}
      role="status"
      data-testid="community-feed-masonry-promo-tail"
    >
      <p className={TT_COMMUNITY_FEED_L5.promoTailHint}>{t("community_feed_promo_more_posts_hint")}</p>
      <Link href="/community/explore" className={`${TT_COMMUNITY_FEED_L5.promoTailLink} ${communityCardLinkFocus}`}>
        {t("community_feed_promo_explore_cta")}
      </Link>
    </div>
  );
}
