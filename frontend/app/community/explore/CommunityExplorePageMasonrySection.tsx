"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { CommunityExplorePhotoMasonry } from "@/components/community/CommunityExplorePhotoMasonry";
import { communityTopicPathForTag } from "@/lib/communityFeedSortUrl";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import { EXPLORE_TOPIC_LINKS } from "./communityExplorePageConstants";
import type { CommunityExplorePageViewModel } from "./useCommunityExplorePage";

export function CommunityExplorePageMasonrySection(vm: CommunityExplorePageViewModel) {
  const {
    t,
    exploreMasonryHeadingId,
    exploreLoadSentinelRef,
    feedIsError,
    feedIsPending,
    feedRefetch,
    feedHasNextPage,
    feedIsFetchingNextPage,
    feedFetchNextPage,
    feedError,
    posts,
    masonryMaxThumbs,
  } = vm;

  return (
    <section
      className="rounded-[var(--radius-md)] border border-violet-500/30 bg-ink-800/70 backdrop-blur-md p-4 mb-4 [content-visibility:auto]"
      aria-labelledby={exploreMasonryHeadingId}
    >
      <h2 id={exploreMasonryHeadingId} className="text-body font-semibold text-slate-200 mb-1">
        {t("community_explore_section_masonry")}
      </h2>
      <p className="text-meta text-slate-400 mb-3">{t("community_explore_masonry_subtitle")}</p>
      {feedIsError ? (
        <div className="space-y-3 py-4" role="alert">
          <ApiErrorAlert message={mapApiReadError(feedError, t, "community_error_feed")} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              feedRefetch();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${TT_COMMUNITY_PAGE_L5.pill} motion-reduce:transition-none ${communityCyanPillFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : (
        <>
          <CommunityExplorePhotoMasonry
            posts={posts}
            t={t}
            loading={feedIsPending}
            maxThumbs={masonryMaxThumbs}
            emptyActions={
              <>
                <Link
                  href="/community"
                  className={`${TT_COMMUNITY_PAGE_L5.pill} motion-reduce:transition-none ${communityCyanPillFocus}`}
                >
                  {t("community_explore_open_feed")}
                </Link>
                {EXPLORE_TOPIC_LINKS.map(({ pathTag, labelKey }) => (
                  <Link
                    key={pathTag}
                    href={communityTopicPathForTag(pathTag, "latest")}
                    className={`rounded-full border border-ref-sun/35 bg-ref-sun/12 px-3 py-2 text-meta text-ref-sun/95 hover:text-ref-sun/95 hover:bg-ref-sun/14 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityFuchsiaPillFocus}`}
                  >
                    #{t(labelKey)}
                  </Link>
                ))}
              </>
            }
          />
          {feedHasNextPage ? (
            <>
              <div ref={exploreLoadSentinelRef} className="h-px w-full shrink-0" aria-hidden />
              <form
                className="mt-4 flex justify-center"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  feedFetchNextPage();
                }}
              >
                <button
                  type="submit"
                  disabled={feedIsFetchingNextPage}
                  aria-busy={feedIsFetchingNextPage ? true : undefined}
                  aria-label={feedIsFetchingNextPage ? t("common_loading") : t("community_explore_load_more")}
                  className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed ${communityCyanPillFocus}`}
                >
                  {feedIsFetchingNextPage ? t("common_loading") : t("community_explore_load_more")}
                </button>
              </form>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
