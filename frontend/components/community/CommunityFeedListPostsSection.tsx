import { type FormEvent, type ReactNode, type RefObject } from "react";

import type { CommunityPost } from "@/lib/communityMockData";

import { CommunityFeedCardCompact } from "@/components/community/CommunityFeedCardCompact";

import { CommunityFeedDesktopWindowVirtual } from "@/components/community/CommunityFeedDesktopWindowVirtual";

import { CommunityFeedMasonryGrid } from "@/components/community/CommunityFeedMasonryGrid";

import { CommunityFeedVideoAutoplayProvider } from "@/components/community/CommunityFeedVideoAutoplayContext";

import { buildAuthorFollowForPost } from "@/components/community/communityFeedFollowUtils";

import { communityCardLinkFocus, communityShellTabFocus } from "@/lib/communityA11yFocus";

import { TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_FEED_LAYOUT, TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";

import { communityFeedListCardCommentCountHonest } from "@/components/community/communityFeedMappers";

import { FEED_DESKTOP_VIRTUAL_MIN } from "./communityFeedListConstants";

import type { CommunityFeedListProps } from "./communityFeedListTypes";



export type CommunityFeedListPostsSectionProps = Pick<

  CommunityFeedListProps,

  | "t"

  | "feedTab"

  | "postsToShow"

  | "localCommentsByPostId"

  | "apiCommentsByPostId"

  | "likedPostIds"

  | "onLike"

  | "onViewFull"

  | "onCommentClick"

  | "onPlayVideo"

  | "onReport"

  | "topicTagHref"

  | "meUserId"

  | "followingAuthorIds"

  | "followBusyAuthorId"

  | "onAuthorFollowToggle"

  | "tagFilter"

  | "tagTopicMatchCount"

  | "setTagFilter"

  | "sortBy"

  | "hotDestinations"

  | "hasMore"

  | "feedLoadingMore"

  | "onLoadMore"

> & {

  loadSentinelRef: RefObject<HTMLDivElement | null>;

  renderDesktopPost: (post: CommunityPost) => ReactNode;

};



export function CommunityFeedListPostsSection({

  t,

  feedTab,

  postsToShow,

  localCommentsByPostId,

  apiCommentsByPostId = {},

  likedPostIds,

  onLike,

  onViewFull,

  onCommentClick,

  onPlayVideo,

  onReport,

  topicTagHref,

  meUserId,

  followingAuthorIds,

  followBusyAuthorId,

  onAuthorFollowToggle,

  tagFilter,

  tagTopicMatchCount,

  setTagFilter,

  sortBy = "latest",

  hotDestinations = [],

  hasMore,

  feedLoadingMore,

  onLoadMore,

  loadSentinelRef,

  renderDesktopPost,

}: CommunityFeedListPostsSectionProps) {

  const showPromoSlots =
    feedTab === "recommend" && sortBy === "latest" && !tagFilter && postsToShow.length > 0;

  return (

    <>

      {tagFilter && (

        <div className="flex flex-wrap items-center gap-2 mb-2 text-meta text-ref-sun/90">

          <span className="font-medium text-ref-sun">#{tagFilter}</span>

          {typeof tagTopicMatchCount === "number" ? (

            <span className="text-slate-400">

              {t("community_tag_topic_count").replace("{{count}}", String(tagTopicMatchCount))}

            </span>

          ) : null}

          <form

            className="inline"

            onSubmit={(e: FormEvent<HTMLFormElement>) => {

              e.preventDefault();

              setTagFilter(null);

            }}

          >

            <button

              type="submit"

              className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/40 text-body font-medium text-ref-sun hover:bg-ref-sun/12 ${communityShellTabFocus}`}

              aria-label={t("community_tag_clear_filter")}

            >

              ×

            </button>

          </form>

        </div>

      )}

      {feedTab === "recommend" ? (

        <CommunityFeedMasonryGrid

          t={t}

          postsToShow={postsToShow}

          localCommentsByPostId={localCommentsByPostId}

          apiCommentsByPostId={apiCommentsByPostId}

          likedPostIds={likedPostIds}

          onLike={onLike}

          onViewFull={onViewFull}

          onCommentClick={onCommentClick}

          onPlayVideo={onPlayVideo}

          onReport={onReport}

          topicTagHref={topicTagHref}

          meUserId={meUserId}

          followingAuthorIds={followingAuthorIds}

          followBusyAuthorId={followBusyAuthorId}

          onAuthorFollowToggle={onAuthorFollowToggle}

          showPromoSlots={showPromoSlots}

          hotDestinations={[...hotDestinations]}

        />

      ) : (

        <CommunityFeedVideoAutoplayProvider>

          <div className={`md:hidden ${TT_COMMUNITY_FEED_LAYOUT.mobileGrid}`}>

            {postsToShow.map((post, index) => (

              <div key={post.id} data-testid={index === 0 ? "community-feed-first-post" : undefined}>

                <CommunityFeedCardCompact

                  post={post}

                  commentCount={communityFeedListCardCommentCountHonest(
                    post,
                    apiCommentsByPostId,
                    localCommentsByPostId[post.id],
                  )}

                  t={t}

                  liked={likedPostIds?.has(post.id)}

                  onLike={onLike ? () => onLike(post.id) : undefined}

                  onViewFull={(p, trigger) => onViewFull(p, trigger)}

                  onPlayVideo={(p, trigger) => (onPlayVideo ?? onViewFull)(p, trigger)}

                  onReport={onReport}

                  topicTagHref={topicTagHref}

                  authorFollow={

                    onAuthorFollowToggle && followingAuthorIds

                      ? buildAuthorFollowForPost(post, {

                          meUserId,

                          followingAuthorIds,

                          followBusyAuthorId,

                          onAuthorFollowToggle,

                        })

                      : undefined

                  }

                />

              </div>

            ))}

          </div>

          <div className={`hidden md:block ${TT_COMMUNITY_FEED_LAYOUT.desktopStack} [content-visibility:auto]`}>

            {postsToShow.length >= FEED_DESKTOP_VIRTUAL_MIN ? (

              <CommunityFeedDesktopWindowVirtual posts={postsToShow} renderItem={renderDesktopPost} />

            ) : (

              postsToShow.map((post) => <div key={post.id}>{renderDesktopPost(post)}</div>)

            )}

          </div>

        </CommunityFeedVideoAutoplayProvider>

      )}

      {hasMore && (

        <>

          <div ref={loadSentinelRef} className="h-px w-full shrink-0" aria-hidden />

          <div className="flex justify-center py-4">

            <form

              className="inline"

              onSubmit={(e: FormEvent<HTMLFormElement>) => {

                e.preventDefault();

                if (!feedLoadingMore) onLoadMore();

              }}

            >

              <button

                type="submit"

                disabled={feedLoadingMore}

                aria-busy={feedLoadingMore ? true : undefined}

                aria-label={feedLoadingMore ? t("common_loading") : t("community_load_more")}

                className={`${TT_COMMUNITY_FEED_L5.loadMoreBtn} ${communityCardLinkFocus}`}

              >

                {feedLoadingMore ? t("common_loading") : t("community_load_more")}

              </button>

            </form>

          </div>

        </>

      )}

      {!hasMore && postsToShow.length > 0 ? (
        <p className={TT_COMMUNITY_FEED_L5.feedEndHint} role="status">
          {t("community_feed_end_hint")}
        </p>
      ) : null}

    </>

  );

}


