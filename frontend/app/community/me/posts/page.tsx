"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslation } from "@/components/LocaleProvider";
import {
  deletePost,
  getMyPosts,
  patchPostVisibility,
  getPostComments,
  postComment as apiPostComment,
  type CommunityCommentSort,
} from "@/lib/apiClient/community";
import { mapApiPostToCommunityPost } from "@/components/community/useCommunityFeed";
import { mapApiCommentToCommunityComment } from "@/components/community/communityFeedMappers";
import type { CommunityPost, CommunityComment, CommunityPostVisibility } from "@/lib/communityMockData";
import { CommentDrawer } from "@/components/community/CommentDrawer";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  interpretCommunityWriteError,
  messageForCommunityActionResponse,
} from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useCommunityPostLikeCollect } from "@/components/community/useCommunityPostLikeCollect";
import { communityCyanPillFocus, communityFuchsiaPillFocus, communityShellTabFocus } from "@/lib/communityA11yFocus";

const PostDetailDrawer = dynamic(
  () => import("@/components/community/PostDetailDrawer").then((m) => ({ default: m.PostDetailDrawer })),
  { ssr: false }
);
import { useState, useCallback, useRef, useEffect, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CommunityReportDrawer } from "@/components/community/CommunityReportDrawer";
import { useCommunityPostReport } from "@/components/community/useCommunityPostReport";
import { CommunityReportSubmittedBanner } from "@/components/community/CommunityReportSubmittedBanner";

/** 88 §3.2：我的帖子空态 — 双 CTA（发帖 / 发现）与可见性 Tab 44px 同批 */
function MePostsEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-slate-900/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={t("community_empty")}
    >
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
      <p className="text-body text-slate-200">{t("community_empty")}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_me_posts_empty_hint")}</p>
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
      </div>
    </div>
  );
}

/** 31 附录 / 51-31-19：我的帖子（仅 API） */
export default function CommunityMePostsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoggedIn, isLoading: authPending, user: meUser } = useCommunityAuth();
  const [apiPosts, setApiPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoadError, setPostsLoadError] = useState<string | null>(null);
  const [postsRetryKey, setPostsRetryKey] = useState(0);
  const [postsVisFilter, setPostsVisFilter] = useState<"all" | CommunityPostVisibility>("all");
  const [visibilityBusyId, setVisibilityBusyId] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPostsLoadError(null);
    getMyPosts({ limit: 50, visibility: postsVisFilter })
      .then((data) => {
        if (cancelled) return;
        const list = data?.posts ?? [];
        setApiPosts(list.map((p) => mapApiPostToCommunityPost(p)));
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("CommunityMePosts getMyPosts:", err);
          }
          setPostsLoadError(mapApiReadError(err, t, "community_me_posts_loadFailed"));
          setApiPosts([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postsRetryKey, postsVisFilter, t]);

  const myPosts = apiPosts;

  const {
    handleLike,
    handleCollect,
    likedIds,
    collectedIds,
    interactionToast: mePostsInteractionToast,
  } = useCommunityPostLikeCollect(t, {
    postsForLikeSync: myPosts,
    detailPostForLikeSync: detailPost,
  });

  const [apiCommentsByPostId, setApiCommentsByPostId] = useState<Record<string, CommunityComment[]>>({});
  const [commentSendFailed, setCommentSendFailed] = useState(false);
  const [commentSendErrorMessage, setCommentSendErrorMessage] = useState<string | null>(null);
  const [commentFieldMessages, setCommentFieldMessages] = useState<Record<string, string> | null>(null);
  const [commentsLoadError, setCommentsLoadError] = useState<string | null>(null);
  const [commentsRetryTick, setCommentsRetryTick] = useState(0);
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>("chronological");
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
  } = useCommunityPostReport(isLoggedIn, () => router.push("/auth/login?returnUrl=/community/me/posts"), t);

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
          console.error("CommunityMePosts getPostComments:", err);
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
          console.error("CommunityMePosts postComment not ok:", res);
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
            console.error("CommunityMePosts postComment:", e);
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

  const performDeletePost = useCallback(
    async (postId: string) => {
      setDeleteError(null);
      setDeleteBusyId(postId);
      try {
        const delRes = await deletePost(postId);
        if (delRes?.status !== "ok") {
          setDeleteError(messageForCommunityActionResponse(delRes, t, "community_delete_post_failed"));
          return;
        }
        setApiPosts((prev) => prev.filter((p) => p.id !== postId));
        setDetailPost((d) => (d?.id === postId ? null : d));
        setCommentPost((c) => (c?.id === postId ? null : c));
        setApiCommentsByPostId((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      } finally {
        setDeleteBusyId(null);
      }
    },
    [t]
  );

  const confirmDeletePost = useCallback(
    (postId: string) => {
      if (!window.confirm(t("community_delete_post_confirm"))) return;
      void performDeletePost(postId);
    },
    [t, performDeletePost]
  );

  const applyVisibilityLocal = useCallback((postId: string, next: CommunityPostVisibility) => {
    const patch = (p: CommunityPost) =>
      p.id === postId ? { ...p, visibilityStatus: next } : p;
    setApiPosts((prev) => prev.map(patch));
    setDetailPost((d) => (d ? patch(d) : null));
    setCommentPost((c) => (c ? patch(c) : null));
  }, []);

  const handlePostVisibilityChange = useCallback(
    async (postId: string, next: CommunityPostVisibility) => {
      setVisibilityError(null);
      setVisibilityBusyId(postId);
      try {
        const visRes = await patchPostVisibility(postId, next);
        if (visRes?.status !== "ok") {
          setVisibilityError(
            messageForCommunityActionResponse(visRes, t, "community_post_visibility_change_failed")
          );
          return;
        }
        applyVisibilityLocal(postId, next);
      } finally {
        setVisibilityBusyId(null);
      }
    },
    [t, applyVisibilityLocal]
  );

  const visTabs: { key: typeof postsVisFilter; labelKey: string }[] = [
    { key: "all", labelKey: "community_me_posts_filter_all" },
    { key: "public", labelKey: "community_me_posts_filter_public" },
    { key: "private", labelKey: "community_me_posts_filter_private" },
    { key: "archived", labelKey: "community_me_posts_filter_archived" },
  ];

  return (
    <>
      <main className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb" aria-label={t("community_me_my_posts")}>
        <header className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-slate-900/60 backdrop-blur-md px-4 py-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-h4 font-bold text-cyan-200">{t("community_me_my_posts")}</h1>
            <Link
              href="/community/me"
              className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityCyanPillFocus}`}
            >
              {t("community_tab_me")}
            </Link>
          </div>
        </header>

        {deleteError && (
          <div className="mb-4">
            <ApiErrorAlert message={deleteError} />
          </div>
        )}
        {visibilityError && (
          <div className="mb-4">
            <ApiErrorAlert message={visibilityError} />
          </div>
        )}

        <nav
          className="mb-4 flex flex-wrap gap-2"
          role="tablist"
          aria-label={t("community_me_posts_filters_aria")}
        >
          {visTabs.map(({ key, labelKey }) => (
            <form
              key={key}
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setPostsVisFilter(key);
              }}
            >
              <button
                type="submit"
                role="tab"
                aria-selected={postsVisFilter === key}
                className={`rounded-full border px-3 py-2 text-meta font-medium motion-sub min-h-[44px] inline-flex items-center justify-center ${communityShellTabFocus} ${
                  postsVisFilter === key
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                    : "border-slate-500/60 bg-slate-800/60 text-slate-300 hover:border-cyan-500/40"
                }`}
              >
                {t(labelKey)}
              </button>
            </form>
          ))}
        </nav>

        {postsLoadError && (
          <div className="mb-4 space-y-2">
            <ApiErrorAlert message={postsLoadError} />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setPostsRetryKey((k) => k + 1);
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
          ) : myPosts.length === 0 && !postsLoadError ? (
            <MePostsEmptyPanel t={t} />
          ) : !loading && myPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {myPosts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square relative rounded-[var(--radius-md)] overflow-hidden border border-cyan-500/30 group"
                >
                  <form
                    className="absolute inset-0"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      setDetailPost(post);
                    }}
                  >
                    <button
                      type="submit"
                      className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset"
                      aria-label={t("community_view_full")}
                    >
                      <Image src={post.media_urls?.[0] ?? post.media_url} alt="" fill className="object-cover" sizes="(max-width:768px) 33vw, 200px" loading="lazy" />
                    </button>
                  </form>
                  <form
                    className="absolute top-0.5 right-0.5 z-10"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      confirmDeletePost(post.id);
                    }}
                  >
                    <button
                      type="submit"
                      disabled={deleteBusyId === post.id}
                      aria-busy={deleteBusyId === post.id ? true : undefined}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-danger/50 bg-slate-950/80 text-danger/95 hover:bg-danger/25 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/60 disabled:opacity-50"
                      aria-label={t("community_delete_post")}
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </form>
                  {post.is_video && (
                    <span className="absolute right-1 bottom-1 rounded-[var(--radius-sm)] bg-black/60 p-0.5 pointer-events-none" aria-hidden>
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  )}
                  {(post.visibilityStatus ?? "public") === "private" ? (
                    <span className="absolute left-1 bottom-1 rounded-[var(--radius-sm)] bg-slate-950/85 px-1.5 py-0.5 text-micro font-medium text-warning/95 pointer-events-none">
                      {t("community_me_posts_badge_private")}
                    </span>
                  ) : (post.visibilityStatus ?? "public") === "archived" ? (
                    <span className="absolute left-1 bottom-1 rounded-[var(--radius-sm)] bg-slate-950/85 px-1.5 py-0.5 text-micro font-medium text-slate-300 pointer-events-none">
                      {t("community_me_posts_badge_archived")}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </main>

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
          onDeletePost={() => confirmDeletePost(detailPost.id)}
          deletePostBusy={deleteBusyId === detailPost.id}
          onPostVisibilityChange={(next) => handlePostVisibilityChange(detailPost.id, next)}
          postVisibilityBusy={visibilityBusyId === detailPost.id}
        />
      )}
      {mePostsInteractionToast ? (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {mePostsInteractionToast}
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
