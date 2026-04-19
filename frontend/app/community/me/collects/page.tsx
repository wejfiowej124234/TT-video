"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslation } from "@/components/LocaleProvider";
import {
  getMeCollects,
  getPostById,
  getPostComments,
  postComment as apiPostComment,
  type CommunityCommentSort,
} from "@/lib/apiClient/community";
import { mapApiPostToCommunityPost } from "@/components/community/useCommunityFeed";
import { mapApiCommentToCommunityComment } from "@/components/community/communityFeedMappers";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { CommunityFeedCard } from "@/components/community/CommunityFeedCard";
import { CommentDrawer } from "@/components/community/CommentDrawer";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useCommunityPostLikeCollect } from "@/components/community/useCommunityPostLikeCollect";
import { communityCyanPillFocus, communityFuchsiaPillFocus } from "@/lib/communityA11yFocus";

const PostDetailDrawer = dynamic(
  () => import("@/components/community/PostDetailDrawer").then((m) => ({ default: m.PostDetailDrawer })),
  { ssr: false }
);
import { useState, useCallback, useRef, useEffect, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CommunityReportDrawer } from "@/components/community/CommunityReportDrawer";
import { useCommunityPostReport } from "@/components/community/useCommunityPostReport";
import { CommunityReportSubmittedBanner } from "@/components/community/CommunityReportSubmittedBanner";

/** 88 §3.2：我的收藏空态 — 与举报/消息页结构化空态同口径 */
function MeCollectsEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-slate-900/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={t("community_collects_empty")}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-300"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">{t("community_collects_empty")}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_me_collects_empty_hint")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link
          href="/community"
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityCyanPillFocus}`}
        >
          {t("community_tab_feed")}
        </Link>
        <Link
          href="/community/explore"
          className={`rounded-full border border-fuchsia-400/45 bg-fuchsia-500/15 px-4 py-2 text-meta font-medium text-fuchsia-100 hover:bg-fuchsia-500/25 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityFuchsiaPillFocus}`}
        >
          {t("community_explore_title")}
        </Link>
      </div>
    </div>
  );
}

/** 31 附录 / 51-31-19：我的收藏（仅 API） */
export default function CommunityMeCollectsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoggedIn, isLoading: authPending, user: meUser } = useCommunityAuth();
  const [apiPosts, setApiPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoadError, setListLoadError] = useState<string | null>(null);
  const [collectsRetryKey, setCollectsRetryKey] = useState(0);
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListLoadError(null);
    getMeCollects()
      .then((data) => {
        if (cancelled) return;
        const ids = (data.collects ?? [])
          .map((c) => c.post_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0);
        if (ids.length === 0) {
          setApiPosts([]);
          setLoading(false);
          return;
        }
        return Promise.all(ids.map((postId) => getPostById(postId)))
          .then((results) => {
            if (cancelled) return;
            const posts: CommunityPost[] = [];
            results.forEach((r) => {
              const p = r.post;
              if (p) posts.push(mapApiPostToCommunityPost({ ...p, like_count: p.like_count }));
            });
            setApiPosts(posts);
          })
          .catch((err) => {
            if (!cancelled) {
              if (typeof window !== "undefined") {
                console.error("CommunityMeCollects getPostById batch:", err);
              }
              setListLoadError(mapApiReadError(err, t, "community_me_collects_loadFailed"));
              setApiPosts([]);
            }
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("CommunityMeCollects getMeCollects:", err);
          }
          setListLoadError(mapApiReadError(err, t, "community_me_collects_loadFailed"));
          setApiPosts([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [collectsRetryKey, t]);

  const collectedPosts = apiPosts;
  const collectedIdList = useMemo(() => collectedPosts.map((p) => p.id), [collectedPosts]);

  const { handleLike, handleCollect, likedIds, collectedIds, interactionToast } = useCommunityPostLikeCollect(
    t,
    {
      initialCollectedIds: collectedIdList,
      postsForLikeSync: collectedPosts,
      detailPostForLikeSync: detailPost,
      onCollectResolved: (postId, nowCollected) => {
        if (!nowCollected) {
          setApiPosts((prev) => prev.filter((p) => p.id !== postId));
        }
      },
    }
  );

  const [apiCommentsByPostId, setApiCommentsByPostId] = useState<Record<string, CommunityComment[]>>({});
  const [commentSendFailed, setCommentSendFailed] = useState(false);
  const [commentSendErrorMessage, setCommentSendErrorMessage] = useState<string | null>(null);
  const [commentFieldMessages, setCommentFieldMessages] = useState<Record<string, string> | null>(null);
  const [commentsLoadError, setCommentsLoadError] = useState<string | null>(null);
  const [commentsRetryTick, setCommentsRetryTick] = useState(0);
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>("chronological");
  const focusReturnTargetRef = useRef<HTMLElement | null>(null);

  const {
    reportContext,
    handleReport,
    handleReportComment,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    reportNoticeBanner,
    reportSuccessFollowUp,
  } = useCommunityPostReport(isLoggedIn, () => router.push("/auth/login?returnUrl=/community/me/collects"), t);

  const postIdOpen = commentPost?.id ?? detailPost?.id;
  useEffect(() => {
    if (!postIdOpen) return;
    let cancelled = false;
    setCommentsLoadError(null);
    getPostComments(postIdOpen, { sort: commentSort })
      .then((data) => {
        if (cancelled) return;
        if (data?.status === "ok" && Array.isArray(data.comments)) {
          setApiCommentsByPostId((prev) => ({
            ...prev,
            [postIdOpen]: data.comments!.map((c) => mapApiCommentToCommunityComment(c)),
          }));
          setCommentsLoadError(null);
        } else {
          setApiCommentsByPostId((prev) => ({ ...prev, [postIdOpen]: [] }));
          setCommentsLoadError(t("community_comments_loadFailed"));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("CommunityMeCollects getPostComments:", err);
        }
        setApiCommentsByPostId((prev) => ({ ...prev, [postIdOpen]: [] }));
        setCommentsLoadError(mapApiReadError(err, t, "community_comments_loadFailed"));
      });
    return () => {
      cancelled = true;
    };
  }, [postIdOpen, commentsRetryTick, commentSort, t]);

  useEffect(() => {
    setCommentSendFailed(false);
    setCommentSendErrorMessage(null);
    setCommentFieldMessages(null);
  }, [postIdOpen]);

  const clearCommentSendError = useCallback(() => {
    setCommentSendFailed(false);
    setCommentSendErrorMessage(null);
    setCommentFieldMessages(null);
  }, []);

  const commentsForPost = useMemo(() => {
    if (!commentPost) return [];
    return apiCommentsByPostId[commentPost.id] ?? [];
  }, [commentPost, apiCommentsByPostId]);

  const commentsForDetail = useMemo(() => {
    if (!detailPost) return [];
    return apiCommentsByPostId[detailPost.id] ?? [];
  }, [detailPost, apiCommentsByPostId]);

  const handleCommentSend = useCallback(
    async (content: string) => {
      const pid = commentPost?.id ?? detailPost?.id;
      if (!pid || !content.trim()) return;
      setCommentSendFailed(false);
      setCommentSendErrorMessage(null);
      setCommentFieldMessages(null);
      try {
        const res = await apiPostComment(pid, content.trim());
        const r = res as { id?: string; status?: string; message?: string } | null;
        if (r?.id) {
          const row: CommunityComment = {
            id: r.id,
            post_id: pid,
            author: { id: "me", nickname: t("ui_em_dash"), avatar_url: null, role: "tourist" },
            content: content.trim(),
            created_at: new Date().toISOString(),
          };
          setApiCommentsByPostId((prev) => ({ ...prev, [pid]: [...(prev[pid] ?? []), row] }));
          return;
        }
        if (typeof window !== "undefined") {
          console.error("CommunityMeCollects postComment not ok:", res);
        }
        const { topMessage, fieldMessages } = interpretCommunityWriteError(r, t, "community_comment_send_failed");
        setCommentSendErrorMessage(topMessage);
        setCommentFieldMessages(Object.keys(fieldMessages).length > 0 ? fieldMessages : null);
        setCommentSendFailed(true);
        throw new Error("comment_post_not_ok");
      } catch (e) {
        const apiRejected = e instanceof Error && e.message === "comment_post_not_ok";
        if (!apiRejected) {
          if (typeof window !== "undefined") {
            console.error("CommunityMeCollects postComment:", e);
          }
          setCommentSendErrorMessage(mapApiReadError(e, t, "community_comment_send_failed"));
          setCommentFieldMessages(null);
          setCommentSendFailed(true);
        }
        throw e instanceof Error ? e : new Error("comment_send_failed");
      }
    },
    [commentPost?.id, detailPost?.id, t]
  );
  const closeWithFocusReturn = useCallback((clear: () => void) => {
    const prev = focusReturnTargetRef.current;
    focusReturnTargetRef.current = null;
    clear();
    requestAnimationFrame(() => prev?.focus());
  }, []);

  return (
    <>
      <main className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb" aria-label={t("community_me_my_collects")}>
        <header className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-slate-900/60 backdrop-blur-md px-4 py-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-h4 font-bold text-cyan-200">{t("community_me_my_collects")}</h1>
            <Link
              href="/community/me"
              className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityCyanPillFocus}`}
            >
              {t("me_title")}
            </Link>
          </div>
        </header>

        {listLoadError && (
          <div className="mb-4 space-y-2">
            <ApiErrorAlert message={listLoadError} />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setCollectsRetryKey((k) => k + 1);
              }}
            >
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <section className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 px-6 py-12 text-center">
              <p className="text-body text-slate-300" role="status" aria-label={t("common_loading")}>{t("common_loading")}</p>
            </section>
          ) : collectedPosts.length === 0 && !listLoadError ? (
            <MeCollectsEmptyPanel t={t} />
          ) : !loading && collectedPosts.length > 0 ? (
            collectedPosts.map((post) => (
              <CommunityFeedCard
                key={post.id}
                post={post}
                commentCount={post.comments}
                t={t}
                liked={likedIds.has(post.id)}
                collected={collectedIds.has(post.id)}
                onLike={() => void handleLike(post.id)}
                onCollect={() => void handleCollect(post.id)}
                onCommentClick={(p, trigger) => {
                  focusReturnTargetRef.current = trigger ?? null;
                  setCommentPost(p);
                }}
                onViewFull={(p, trigger) => {
                  focusReturnTargetRef.current = trigger ?? null;
                  setDetailPost(p);
                }}
                onReport={handleReport}
              />
            ))
          ) : null}
        </div>
      </main>

      {reportContext && (
        <CommunityReportDrawer
          context={reportContext}
          onClose={closeReportDrawer}
          onSubmit={handleReportSubmit}
          t={t}
          reportSendFailed={reportSendFailed}
          reportErrorMessage={reportErrorMessage}
          reportFieldMessages={reportFieldMessages}
          onClearReportError={clearReportSendError}
        />
      )}

      {commentPost && (
        <CommentDrawer
          post={commentPost}
          comments={commentsForPost}
          onClose={() => closeWithFocusReturn(() => setCommentPost(null))}
          onSend={handleCommentSend}
          t={t}
          isLoggedIn={isLoggedIn}
          authPending={authPending}
          meUserId={meUser?.id ?? null}
          onReportComment={(c) => handleReportComment(commentPost, c)}
          commentSendError={commentSendFailed}
          commentSendErrorMessage={commentSendErrorMessage}
          commentFieldMessages={commentFieldMessages}
          onRetryComment={clearCommentSendError}
          commentsLoadError={commentsLoadError}
          onRetryCommentsLoad={() => setCommentsRetryTick((n) => n + 1)}
          commentSort={commentSort}
          onCommentSortChange={setCommentSort}
        />
      )}
      {detailPost && (
        <PostDetailDrawer
          post={detailPost}
          comments={commentsForDetail}
          onClose={() => closeWithFocusReturn(() => setDetailPost(null))}
          onCommentSend={handleCommentSend}
          t={t}
          isLoggedIn={isLoggedIn}
          authPending={authPending}
          liked={likedIds.has(detailPost.id)}
          collected={collectedIds.has(detailPost.id)}
          onLike={() => void handleLike(detailPost.id)}
          onCollect={() => void handleCollect(detailPost.id)}
          onReport={handleReport}
          meUserId={meUser?.id ?? null}
          onReportComment={(c) => handleReportComment(detailPost, c)}
          commentSendError={commentSendFailed}
          commentSendErrorMessage={commentSendErrorMessage}
          commentFieldMessages={commentFieldMessages}
          onRetryComment={clearCommentSendError}
          commentsLoadError={commentsLoadError}
          onRetryCommentsLoad={() => setCommentsRetryTick((n) => n + 1)}
          commentSort={commentSort}
          onCommentSortChange={setCommentSort}
          onAfterTopicTagClick={() => closeWithFocusReturn(() => setDetailPost(null))}
        />
      )}
      {interactionToast ? (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {interactionToast}
        </div>
      ) : reportSuccessFollowUp ? (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 w-[min(100vw-1.5rem,22rem)] rounded-[var(--radius-md)] border border-cyan-500/40 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-cyan-200 shadow-scifi-toast safe-area-pb"
          role="status"
          aria-live="polite"
        >
          <CommunityReportSubmittedBanner t={t} reportId={reportSuccessFollowUp.reportId} />
        </div>
      ) : reportNoticeBanner ? (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {reportNoticeBanner}
        </div>
      ) : null}
    </>
  );
}
