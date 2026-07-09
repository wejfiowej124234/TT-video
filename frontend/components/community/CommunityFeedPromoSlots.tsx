"use client";



import Link from "next/link";

import type { CommunityPost } from "@/lib/communityMockData";

import { TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";

import { communityCardLinkFocus } from "@/lib/communityA11yFocus";

import { CommunityFeedPromoThumb } from "@/components/community/CommunityFeedPromoThumb";

import {

  communityFeedPromoActivityViewModel,

  communityFeedPromoHotRankViewModel,

} from "./communityFeedPromoRowViewModel";



export interface CommunityFeedPromoMasonrySlotsProps {

  t: (key: string) => string;

  hotDestinations: string[];

  feedPosts?: readonly CommunityPost[];

  previewPost?: CommunityPost;

}



const HOT_THUMB_GRADIENTS = [

  "from-ref-sun/30 via-ink-800 to-ink-900",

  "from-ref-coral/25 via-ink-800 to-ink-900",

  "from-amber-500/20 via-ink-800 to-ink-900",

] as const;



function StarIcon() {

  return (

    <svg className="h-2.5 w-2.5 shrink-0 text-ref-sun/90" fill="currentColor" viewBox="0 0 24 24" aria-hidden>

      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />

    </svg>

  );

}



function PromoHotThumb({

  thumbSrc,

  rank,

  grad,

}: {

  thumbSrc?: string;

  rank: number;

  grad: string;

}) {

  return (

    <div

      className={`${TT_COMMUNITY_FEED_ACTION.promoHotThumb} ${thumbSrc ? "" : `bg-gradient-to-br ${grad}`}`}

    >

      <CommunityFeedPromoThumb

        src={thumbSrc}

        sizes="40px"

        fallbackSeed={String(rank)}

        fallback={

          !thumbSrc ? (

            <span className="absolute inset-0 bg-gradient-to-br opacity-100" aria-hidden />

          ) : null

        }

      />

      <span className={TT_COMMUNITY_FEED_ACTION.promoHotRankNum}>{rank}</span>

    </div>

  );

}



/** 瀑布顶栏左卡 · 附近活动（仅消费 ViewModel） */

export function CommunityFeedPromoActivitySlot({

  t,

  previewPost,

}: Pick<CommunityFeedPromoMasonrySlotsProps, "t" | "previewPost">) {

  const vm = communityFeedPromoActivityViewModel(t, previewPost);



  return (

    <div className={TT_COMMUNITY_FEED_L5.promoLeadCell} data-testid="community-feed-promo-activity-slot">

      <Link

        href={vm.href}

        className={`${TT_COMMUNITY_FEED_ACTION.promoActivityCard} ${TT_COMMUNITY_FEED_L5.promoCardFocus} ${communityCardLinkFocus}`}

      >

        <div className={TT_COMMUNITY_FEED_ACTION.promoActivityThumb} aria-hidden>

          <CommunityFeedPromoThumb

            src={vm.thumbSrc}

            sizes="72px"

            fallbackSeed={previewPost?.id ?? "activity"}

            fallback={

              <span className="absolute inset-0 flex items-center justify-center text-ref-sun/80">

                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />

                </svg>

              </span>

            }

          />

        </div>

        <div className={TT_COMMUNITY_FEED_ACTION.promoActivityBody}>

          <div className="min-w-0">

            <p className={TT_COMMUNITY_FEED_ACTION.promoActivityEyebrow}>{vm.eyebrow}</p>

            <p className={TT_COMMUNITY_FEED_ACTION.promoActivityTitle}>{vm.headline}</p>

            <p className={TT_COMMUNITY_FEED_ACTION.promoActivityHint}>{vm.subline}</p>

          </div>

          <span className={TT_COMMUNITY_FEED_ACTION.promoActivityMore}>{vm.moreLabel}</span>

        </div>

      </Link>

    </div>

  );

}



/** 瀑布顶栏右卡 · 热榜 TOP3（仅消费 ViewModel） */

export function CommunityFeedPromoHotRankSlot({

  t,

  hotDestinations,

  feedPosts = [],

}: Pick<CommunityFeedPromoMasonrySlotsProps, "t" | "hotDestinations" | "feedPosts">) {

  const vm = communityFeedPromoHotRankViewModel(t, hotDestinations, feedPosts, 3);



  return (

    <div className={TT_COMMUNITY_FEED_L5.promoLeadCell} data-testid="community-feed-promo-hot-slot">

      <div className={TT_COMMUNITY_FEED_ACTION.promoHotCard}>

        <div className={TT_COMMUNITY_FEED_ACTION.promoHotHead}>

          <span className={TT_COMMUNITY_FEED_ACTION.promoHotTitle}>{vm.title}</span>

          <Link href={vm.moreHref} className={`${TT_COMMUNITY_FEED_ACTION.promoHotMore} ${communityCardLinkFocus}`}>

            {vm.moreLabel}

          </Link>

        </div>

        {vm.rows.length > 0 ? (

          <ol className="space-y-0">

            {vm.rows.map((row, i) => {

              const grad = HOT_THUMB_GRADIENTS[i] ?? HOT_THUMB_GRADIENTS[0];

              return (

                <li key={row.destination}>

                  <Link

                    href={row.href}

                    className={`${TT_COMMUNITY_FEED_ACTION.promoHotRow} ${TT_COMMUNITY_FEED_L5.promoCardFocus} ${communityCardLinkFocus}`}

                  >

                    <PromoHotThumb thumbSrc={row.thumbSrc} rank={row.rank} grad={grad} />

                    <div className="min-w-0 flex-1">

                      <p className={TT_COMMUNITY_FEED_ACTION.promoHotRowTitle}>{row.label}</p>

                      <p className={TT_COMMUNITY_FEED_ACTION.promoHotRowMeta}>

                        <span className="inline-flex items-center gap-0.5">

                          <StarIcon />

                          {row.scoreLabel}

                        </span>

                        <span className="mx-1 text-slate-600" aria-hidden>

                          ·

                        </span>

                        {row.checkinsLabel}

                        <span className="mx-1 text-slate-600" aria-hidden>

                          ·

                        </span>

                        {row.distanceLabel}

                      </p>

                    </div>

                  </Link>

                </li>

              );

            })}

          </ol>

        ) : (

          <p className={TT_COMMUNITY_FEED_ACTION.promoActivityHint}>{vm.emptyHint}</p>

        )}

      </div>

    </div>

  );

}

