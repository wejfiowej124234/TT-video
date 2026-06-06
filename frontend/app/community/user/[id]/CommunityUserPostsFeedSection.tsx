"use client";

import type { CommunityComment, CommunityPost } from "@/lib/communityMockData";
import { CommunityFeedCard } from "@/components/community/CommunityFeedCard";
import { communityFeedCardCommentDisplayCountHonest } from "@/components/community/communityFeedMappers";

type TFn = (key: string) => string;

export function CommunityUserPostsFeedSection(props: {
  t: TFn;
  loading: boolean;
  userPosts: CommunityPost[];
  userPostsForFeed: CommunityPost[];
  postsLoadError: string | null;
  apiCommentsByPostId: Record<string, CommunityComment[]>;
  likedIds: Set<string>;
  collectedIds: Set<string>;
  isSelf: boolean;
  onPostLike: (postId: string) => void;
  onPostCollect: (postId: string) => void;
  onCommentOpen: (p: CommunityPost, trigger?: HTMLElement | null) => void;
  onDetailOpen: (p: CommunityPost, trigger?: HTMLElement | null) => void;
  onReport: ((post: CommunityPost) => void) | undefined;
  onDeletePost?: (postId: string) => void;
  deletePostBusyId?: string | null;
  onPinToTop?: (postId: string) => void;
}) {
  const {
    t,
    loading,
    userPosts,
    userPostsForFeed,
    postsLoadError,
    apiCommentsByPostId,
    likedIds,
    collectedIds,
    isSelf,
    onPostLike,
    onPostCollect,
    onCommentOpen,
    onDetailOpen,
    onReport,
    onDeletePost,
    deletePostBusyId,
    onPinToTop,
  } = props;

  return (
    <section className="space-y-4" aria-label={t("community_me_my_posts")}>
      {loading ? (
        <p className="text-center text-slate-300 py-8" role="status" aria-label={t("common_loading")}>
          {t("common_loading")}
        </p>
      ) : userPosts.length === 0 && !postsLoadError ? (
        <div className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-900/70 px-6 py-12 text-center">
          <p className="text-body text-slate-300">{t("community_empty")}</p>
        </div>
      ) : !loading && userPosts.length > 0 ? (
        userPostsForFeed.map((post) => (
          <CommunityFeedCard
            key={post.id}
            post={post}
            commentCount={communityFeedCardCommentDisplayCountHonest(post, apiCommentsByPostId)}
            t={t}
            liked={likedIds.has(post.id)}
            collected={collectedIds.has(post.id)}
            onLike={() => void onPostLike(post.id)}
            onCollect={() => void onPostCollect(post.id)}
            onCommentClick={(p, trigger) => {
              onCommentOpen(p, trigger ?? null);
            }}
            onViewFull={(p, trigger) => {
              onDetailOpen(p, trigger ?? null);
            }}
            onReport={onReport}
            showVisibilityStatusBadge={isSelf}
            onDeletePost={isSelf ? onDeletePost : undefined}
            deletePostBusyId={isSelf ? deletePostBusyId : undefined}
            onPinToTop={isSelf ? onPinToTop : undefined}
          />
        ))
      ) : null}
    </section>
  );
}
