"use client";

import { useState, useCallback, useRef, useEffect, useMemo, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import {
  postComment as apiPostComment,
  getUserPosts,
  deletePost,
  patchPostVisibility,
  getConversations,
  getPostComments,
  getMeFollowing,
  postUserFollow,
  deleteUserFollow,
  type CommunityCommentSort,
} from "@/lib/apiClient/community";
import {
  mapApiCommentToCommunityComment,
  communityStoredRolePillClassName,
  mapApiUserRoleToCommunity,
} from "@/components/community/communityFeedMappers";
import { mapApiPostToCommunityPost } from "@/components/community/useCommunityFeed";
import type { CommunityPost, CommunityComment, CommunityPostVisibility } from "@/lib/communityMockData";
import { CommunityFeedCard } from "@/components/community/CommunityFeedCard";
import { CommentDrawer } from "@/components/community/CommentDrawer";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  interpretCommunityWriteError,
  messageForCommunityActionResponse,
} from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import { useCommunityPostLikeCollect } from "@/components/community/useCommunityPostLikeCollect";
import {
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
  communityShellTabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";

const PostDetailDrawer = dynamic(
  () => import("@/components/community/PostDetailDrawer").then((m) => ({ default: m.PostDetailDrawer })),
  { ssr: false }
);
import { CommunityReportDrawer } from "@/components/community/CommunityReportDrawer";
import { useCommunityPostReport } from "@/components/community/useCommunityPostReport";
import { CommunityReportSubmittedBanner } from "@/components/community/CommunityReportSubmittedBanner";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/** GET /me/following 同步：失败时不得用 false 冒充「未关注」 */
type FollowingListFetch = "idle" | "loading" | "ready" | "error";

const USER_PROFILE_POSTS_VIS_TABS = [
  { key: "all" as const, labelKey: "community_me_posts_filter_all" },
  { key: "public" as const, labelKey: "community_me_posts_filter_public" },
  { key: "private" as const, labelKey: "community_me_posts_filter_private" },
  { key: "archived" as const, labelKey: "community_me_posts_filter_archived" },
];

/** 作者主页：帖子来自 GET /api/v1/community/users/:id/posts */
function CommunityUserPageInner() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { t } = useTranslation();
  const { isLoggedIn, isLoading: authLoading, user: meUser } = useCommunityAuth();
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoadError, setPostsLoadError] = useState<string | null>(null);
  const [postsRetryKey, setPostsRetryKey] = useState(0);
  const [postsVisFilter, setPostsVisFilter] = useState<"all" | CommunityPostVisibility>("all");
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [visibilityBusyId, setVisibilityBusyId] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [convByPeer, setConvByPeer] = useState<Record<string, string>>({});
  const [conversationsLoadError, setConversationsLoadError] = useState<string | null>(null);
  const [conversationsRetryKey, setConversationsRetryKey] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingListFetch, setFollowingListFetch] = useState<FollowingListFetch>("idle");
  const [followingLoadError, setFollowingLoadError] = useState<string | null>(null);
  const [followingRetryKey, setFollowingRetryKey] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [followToast, setFollowToast] = useState<string | null>(null);
  const followToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [apiCommentsByPostId, setApiCommentsByPostId] = useState<Record<string, CommunityComment[]>>({});
  const [commentSendFailed, setCommentSendFailed] = useState(false);
  const [commentSendErrorMessage, setCommentSendErrorMessage] = useState<string | null>(null);
  const [commentFieldMessages, setCommentFieldMessages] = useState<Record<string, string> | null>(null);
  const [commentsLoadError, setCommentsLoadError] = useState<string | null>(null);
  const [commentsRetryTick, setCommentsRetryTick] = useState(0);
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>("chronological");
  const focusReturnTargetRef = useRef<HTMLElement | null>(null);

  const userProfileReturnPath = id ? `/community/user/${id}` : "/community";
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
  } = useCommunityPostReport(
    isLoggedIn,
    () => router.push(`/auth/login?returnUrl=${encodeURIComponent(userProfileReturnPath)}`),
    t
  );

  useEffect(() => {
    setIsFollowing(false);
    setFollowingListFetch("idle");
    setFollowingLoadError(null);
  }, [id]);

  useEffect(() => {
    setPostsVisFilter("all");
  }, [id]);

  const isSelf = Boolean(isLoggedIn && meUser?.id && meUser.id === id);

  useEffect(() => {
    if (!id || !isUuid(id)) {
      setUserPosts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPostsLoadError(null);
    getUserPosts(id, {
      limit: 50,
      ...(isSelf ? { visibility: postsVisFilter } : {}),
    })
      .then((data) => {
        if (cancelled) return;
        const list = data?.posts ?? [];
        setUserPosts(list.map((p) => mapApiPostToCommunityPost(p)));
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("CommunityUserPage getUserPosts:", err);
          }
          setPostsLoadError(mapApiReadError(err, t, "community_user_posts_loadFailed"));
          setUserPosts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, postsRetryKey, postsVisFilter, t, isSelf]);

  useEffect(() => {
    if (!id || !isUuid(id) || authLoading) return;
    const meId = meUser?.id;
    if (!meId) {
      setConvByPeer({});
      setConversationsLoadError(null);
      return;
    }
    let cancelled = false;
    setConversationsLoadError(null);
    getConversations()
      .then((convData) => {
        if (cancelled) return;
        const convs = convData?.conversations ?? [];
        setConversationsLoadError(null);
        if (convs.length > 0) {
          const m: Record<string, string> = {};
          for (const c of convs) {
            const peer = c.peer_id ?? (c.user1_id === meId ? c.user2_id : c.user1_id);
            if (peer) m[peer] = c.id;
          }
          setConvByPeer(m);
        } else {
          setConvByPeer({});
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("CommunityUserPage getConversations:", err);
        }
        setConvByPeer({});
        setConversationsLoadError(mapApiReadError(err, t, "community_user_conversations_loadFailed"));
      });
    return () => {
      cancelled = true;
    };
  }, [id, meUser?.id, authLoading, conversationsRetryKey, t]);

  useEffect(() => {
    if (!id || !isUuid(id)) return;
    if (!isLoggedIn || authLoading) return;
    let cancelled = false;
    setFollowingListFetch("loading");
    setFollowingLoadError(null);
    getMeFollowing()
      .then((data) => {
        if (cancelled) return;
        const list = data.following ?? [];
        setIsFollowing(list.some((u) => u.id === id));
        setFollowingListFetch("ready");
        setFollowingLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("CommunityUserPage getMeFollowing:", err);
        }
        setFollowingLoadError(mapApiReadError(err, t, "community_user_followingList_loadFailed"));
        setFollowingListFetch("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id, isLoggedIn, authLoading, followingRetryKey, t]);

  /** B-076：帖子 `author_followed_by_me` 与 `GET …/me/following` 对读（列表失败时全量；就绪时 true 合并，防关注列表分页截断假阴性） */
  useEffect(() => {
    if (!isLoggedIn || !id || userPosts.length === 0) return;
    const p = userPosts.find((x) => x.author?.id === id);
    if (!p || typeof p.authorFollowedByMe !== "boolean") return;
    if (followingListFetch === "error") {
      setIsFollowing(p.authorFollowedByMe === true);
      return;
    }
    if (followingListFetch === "ready" && p.authorFollowedByMe === true) {
      setIsFollowing(true);
    }
  }, [followingListFetch, userPosts, id, isLoggedIn]);

  const {
    handleLike: handlePostLike,
    handleCollect: handlePostCollect,
    likedIds,
    collectedIds,
    interactionToast: profileLikeCollectToast,
  } = useCommunityPostLikeCollect(t, {
    postsForLikeSync: userPosts,
    detailPostForLikeSync: detailPost,
  });

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
          console.error("CommunityUserPage getPostComments:", err);
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

  const showFollowToast = useCallback((message: string) => {
    if (followToastTimerRef.current) clearTimeout(followToastTimerRef.current);
    setFollowToast(message);
    followToastTimerRef.current = setTimeout(() => {
      followToastTimerRef.current = null;
      setFollowToast(null);
    }, 3200);
  }, []);

  useEffect(
    () => () => {
      if (followToastTimerRef.current) clearTimeout(followToastTimerRef.current);
    },
    []
  );

  const handleFollowToggle = useCallback(async () => {
    if (!isLoggedIn || followBusy || followingListFetch !== "ready" || meUser?.id === id || !isUuid(id))
      return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showFollowToast(t("community_interaction_offline"));
      return;
    }
    setFollowBusy(true);
    try {
      if (isFollowing) {
        const res = await deleteUserFollow(id);
        const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
        if (ok) setIsFollowing(false);
        else
          showFollowToast(
            messageForCommunityActionResponse(res, t, "community_user_follow_toggleFailed")
          );
      } else {
        const res = await postUserFollow(id);
        const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
        if (ok) setIsFollowing(true);
        else
          showFollowToast(
            messageForCommunityActionResponse(res, t, "community_user_follow_toggleFailed")
          );
      }
    } catch (err) {
      showFollowToast(mapApiReadError(err, t, "community_user_follow_toggleFailed"));
    } finally {
      setFollowBusy(false);
    }
  }, [isLoggedIn, followBusy, followingListFetch, meUser?.id, id, isFollowing, showFollowToast, t]);

  const handleCommentSend = useCallback(
    async (content: string) => {
      const pid = commentPost?.id ?? detailPost?.id;
      if (!pid || !content.trim()) return;
      setCommentSendFailed(false);
      setCommentSendErrorMessage(null);
      setCommentFieldMessages(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setCommentSendErrorMessage(t("community_comment_offline"));
        setCommentSendFailed(true);
        throw new Error("comment_offline");
      }
      const selfId = meUser?.id ?? "me";
      const selfNick =
        meUser?.nickname?.trim()
          ? meUser.nickname
          : selfId !== "me"
            ? selfId.slice(0, 8)
            : t("ui_em_dash");
      const selfWallet = formatWalletOrDidShort(meUser?.default_wallet_address ?? undefined);
      try {
        const res = await apiPostComment(pid, content.trim());
        const r = res as { id?: string; status?: string; message?: string } | null;
        if (r?.id) {
          const row: CommunityComment = {
            id: r.id,
            post_id: pid,
            author: {
              id: selfId,
              nickname: selfNick,
              avatar_url: meUser?.avatar_url ?? null,
              role: mapApiUserRoleToCommunity(meUser?.role),
              ...(selfWallet ? { wallet: selfWallet } : {}),
            },
            content: content.trim(),
            created_at: new Date().toISOString(),
          };
          setApiCommentsByPostId((prev) => ({
            ...prev,
            [pid]: [...(prev[pid] ?? []), row],
          }));
          return;
        }
        if (typeof window !== "undefined") {
          console.error("CommunityUserPage postComment not ok:", res);
        }
        const { topMessage, fieldMessages } = interpretCommunityWriteError(r, t, "community_comment_send_failed");
        setCommentSendErrorMessage(topMessage);
        setCommentFieldMessages(Object.keys(fieldMessages).length > 0 ? fieldMessages : null);
        setCommentSendFailed(true);
        throw new Error("comment_post_not_ok");
      } catch (e) {
        if (e instanceof Error && e.message === "comment_offline") {
          throw e;
        }
        const apiRejected = e instanceof Error && e.message === "comment_post_not_ok";
        if (!apiRejected) {
          if (typeof window !== "undefined") {
            console.error("CommunityUserPage postComment:", e);
          }
          setCommentSendErrorMessage(mapApiReadError(e, t, "community_comment_send_failed"));
          setCommentFieldMessages(null);
          setCommentSendFailed(true);
        }
        throw e instanceof Error ? e : new Error("comment_send_failed");
      }
    },
    [
      commentPost?.id,
      detailPost?.id,
      meUser?.id,
      meUser?.nickname,
      meUser?.avatar_url,
      meUser?.role,
      meUser?.default_wallet_address,
      t,
    ]
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
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setDeleteError(t("community_interaction_offline"));
        return;
      }
      setDeleteBusyId(postId);
      try {
        const delRes = await deletePost(postId);
        if (delRes?.status !== "ok") {
          setDeleteError(messageForCommunityActionResponse(delRes, t, "community_delete_post_failed"));
          return;
        }
        setUserPosts((prev) => prev.filter((p) => p.id !== postId));
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
    const patch = (p: CommunityPost) => (p.id === postId ? { ...p, visibilityStatus: next } : p);
    setUserPosts((prev) => prev.map(patch));
    setDetailPost((d) => (d ? patch(d) : null));
    setCommentPost((c) => (c ? patch(c) : null));
  }, []);

  const handlePostVisibilityChange = useCallback(
    async (postId: string, next: CommunityPostVisibility) => {
      setVisibilityError(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setVisibilityError(t("community_interaction_offline"));
        return;
      }
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

  const msgHref =
    convByPeer[id] != null ? `/community/messages/${convByPeer[id]}` : "/community/messages";

  const authorLabel = id.slice(0, 8);
  const profileAuthor = userPosts[0]?.author;
  const displayName =
    profileAuthor?.nickname?.trim() ? profileAuthor.nickname : authorLabel;

  const detailDrawerAuthorFollow =
    !isSelf && isLoggedIn
      ? {
          followed: followingListFetch === "ready" && isFollowing,
          onToggle: () => {
            void handleFollowToggle();
          },
          disabled: followBusy || followingListFetch !== "ready",
          hidden: false,
        }
      : !isSelf
        ? {
            followed: false,
            onToggle: () => {
              router.push(`/auth/login?returnUrl=${encodeURIComponent(userProfileReturnPath)}`);
            },
            hidden: false,
          }
        : undefined;

  if (!id || !isUuid(id)) {
    return (
      <main
        className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
        aria-label={t("community_user_not_found")}
      >
        <h1 className="sr-only">{t("community_user_not_found")}</h1>
        <div className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 px-6 py-12 text-center">
          <p className="text-body text-slate-300">{t("community_user_not_found")}</p>
          <Link
            href="/community"
            className={`mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
          >
            {t("community_tab_feed")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main
        className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
        aria-label={t("community_user_main_aria")}
      >
        <header className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-slate-900/60 backdrop-blur-md px-4 py-6 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-slate-600 ring-2 ring-cyan-400/50">
                {profileAuthor?.avatar_url ? (
                  <Image
                    src={profileAuthor.avatar_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-h4 font-medium text-cyan-300">
                    {displayName.slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-h4 font-bold text-slate-100 truncate">{displayName}</h1>
                {profileAuthor?.wallet ? (
                  <p className="text-meta mt-0.5 font-mono text-cyan-300 truncate max-w-full">{profileAuthor.wallet}</p>
                ) : null}
                <p className="text-meta mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 ${communityStoredRolePillClassName(
                      profileAuthor?.role ?? "tourist"
                    )}`}
                  >
                    {t(communityStoredRoleLabelI18nKey(profileAuthor?.role))}
                  </span>
                  {!loading && userPosts.length === 0 ? (
                    <span className="text-slate-400">{t("community_user_no_posts_hint")}</span>
                  ) : null}
                </p>
                <p className="text-meta text-slate-400 mt-0.5 break-all">ID: {id}</p>
              </div>
            </div>
            {isSelf ? (
              <Link
                href="/community/me/posts"
                className={`rounded-full border border-fuchsia-400/45 bg-fuchsia-500/15 px-4 py-2.5 text-meta font-medium text-fuchsia-200 hover:text-fuchsia-100 hover:bg-fuchsia-500/25 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityFuchsiaPillFocus}`}
              >
                {t("community_user_self_grid_posts")}
              </Link>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {isLoggedIn ? (
                  <form
                    className="inline"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      void handleFollowToggle();
                    }}
                  >
                    <button
                      type="submit"
                      disabled={followBusy || followingListFetch !== "ready"}
                      aria-busy={followBusy ? true : undefined}
                      className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center disabled:opacity-60 ${communityCyanPillFocus}`}
                    >
                      {followingListFetch === "loading" || followingListFetch === "idle"
                        ? t("common_loading")
                        : followingListFetch === "error"
                          ? t("community_follow_status_unknown")
                          : isFollowing
                            ? t("community_unfollow")
                            : t("community_follow")}
                    </button>
                  </form>
                ) : (
                  <Link
                    href={`/auth/login?returnUrl=${encodeURIComponent(userProfileReturnPath)}`}
                    className={`rounded-full border border-slate-500/60 bg-slate-800/80 px-4 py-2.5 text-meta font-medium text-slate-200 hover:border-cyan-500/50 hover:text-cyan-100 motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
                  >
                    {t("community_login_to_follow")}
                  </Link>
                )}
                <Link
                  href={isLoggedIn ? msgHref : "/auth/login"}
                  className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
                >
                  {isLoggedIn ? t("community_chat") : t("community_login_to_chat")}
                </Link>
                {profileAuthor?.role === "guide" || profileAuthor?.isEscrowGuide ? (
                  <Link
                    href={marketHrefForCommunityUser(id)}
                    className={`${COMMUNITY_BOOK_GUIDE_CTA_CLASS} px-4 py-2.5`}
                  >
                    {t("community_book_guide_cta")}
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </header>

        {deleteError && (
          <div className="mb-4">
            <ApiErrorAlert message={deleteError} tone="dark" />
          </div>
        )}
        {visibilityError && (
          <div className="mb-4">
            <ApiErrorAlert message={visibilityError} tone="dark" />
          </div>
        )}

        {isLoggedIn && !isSelf && followingLoadError ? (
          <div className="mb-4 space-y-2">
            <ApiErrorAlert message={followingLoadError} tone="dark" />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setFollowingRetryKey((k) => k + 1);
              }}
            >
              <button
                type="submit"
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        ) : null}

        {isLoggedIn && conversationsLoadError ? (
          <div className="mb-4 space-y-2">
            <ApiErrorAlert message={conversationsLoadError} tone="dark" />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setConversationsRetryKey((k) => k + 1);
              }}
            >
              <button
                type="submit"
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        ) : null}

        {postsLoadError && (
          <div className="mb-4 space-y-2">
            <ApiErrorAlert message={postsLoadError} tone="dark" />
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
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        )}

        {isSelf ? (
          <nav
            className="mb-4 flex flex-wrap gap-2"
            role="tablist"
            aria-label={t("community_me_posts_filters_aria")}
          >
            {USER_PROFILE_POSTS_VIS_TABS.map(({ key, labelKey }) => (
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
        ) : null}

        <section className="space-y-4" aria-label={t("community_me_my_posts")}>
          {loading ? (
            <p className="text-center text-slate-300 py-8" role="status" aria-label={t("common_loading")}>
              {t("common_loading")}
            </p>
          ) : userPosts.length === 0 && !postsLoadError ? (
            <div className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 px-6 py-12 text-center">
              <p className="text-body text-slate-300">{t("community_empty")}</p>
            </div>
          ) : !loading && userPosts.length > 0 ? (
            userPosts.map((post) => (
              <CommunityFeedCard
                key={post.id}
                post={post}
                commentCount={post.comments}
                t={t}
                liked={likedIds.has(post.id)}
                collected={collectedIds.has(post.id)}
                onLike={() => void handlePostLike(post.id)}
                onCollect={() => void handlePostCollect(post.id)}
                onCommentClick={(p, trigger) => {
                  focusReturnTargetRef.current = trigger ?? null;
                  setCommentPost(p);
                }}
                onViewFull={(p, trigger) => {
                  focusReturnTargetRef.current = trigger ?? null;
                  setDetailPost(p);
                }}
                onReport={isSelf ? undefined : handleReport}
                showVisibilityStatusBadge={isSelf}
              />
            ))
          ) : null}
        </section>
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
          authPending={authLoading}
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
          authPending={authLoading}
          liked={likedIds.has(detailPost.id)}
          collected={collectedIds.has(detailPost.id)}
          onLike={() => void handlePostLike(detailPost.id)}
          onCollect={() => void handlePostCollect(detailPost.id)}
          commentSendError={commentSendFailed}
          commentSendErrorMessage={commentSendErrorMessage}
          commentFieldMessages={commentFieldMessages}
          onRetryComment={clearCommentSendError}
          commentsLoadError={commentsLoadError}
          onRetryCommentsLoad={() => setCommentsRetryTick((n) => n + 1)}
          commentSort={commentSort}
          onCommentSortChange={setCommentSort}
          authorFollow={detailDrawerAuthorFollow}
          onAfterTopicTagClick={() => closeWithFocusReturn(() => setDetailPost(null))}
          onReport={isSelf ? undefined : handleReport}
          meUserId={meUser?.id ?? null}
          onReportComment={(c) => handleReportComment(detailPost, c)}
          onDeletePost={isSelf ? () => confirmDeletePost(detailPost.id) : undefined}
          deletePostBusy={deleteBusyId === detailPost.id}
          onPostVisibilityChange={isSelf ? (next) => handlePostVisibilityChange(detailPost.id, next) : undefined}
          postVisibilityBusy={visibilityBusyId === detailPost.id}
        />
      )}

      {followToast ? (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {followToast}
        </div>
      ) : null}
      {profileLikeCollectToast ? (
        <div
          className="fixed left-1/2 z-[121] bottom-40 md:bottom-24 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {profileLikeCollectToast}
        </div>
      ) : null}
      {reportSuccessFollowUp ? (
        <div
          className={
            "fixed left-1/2 z-[122] -translate-x-1/2 w-[min(100vw-1.5rem,22rem)] rounded-[var(--radius-md)] border border-cyan-500/40 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-cyan-200 shadow-scifi-toast safe-area-pb " +
            (followToast || profileLikeCollectToast
              ? "bottom-56 md:bottom-40"
              : "bottom-24 md:bottom-8")
          }
          role="status"
          aria-live="polite"
        >
          <CommunityReportSubmittedBanner t={t} reportId={reportSuccessFollowUp.reportId} />
        </div>
      ) : reportNoticeBanner ? (
        <div
          className={
            "fixed left-1/2 z-[122] -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb " +
            (followToast || profileLikeCollectToast
              ? "bottom-56 md:bottom-40"
              : "bottom-24 md:bottom-8")
          }
          role="status"
          aria-live="polite"
        >
          {reportNoticeBanner}
        </div>
      ) : null}
    </>
  );
}

export default function CommunityUserPage() {
  return (
    <CommunityParamRouteSuspense mainAriaLabelKey="community_user_main_aria" horizontalPadding="px-4">
      <CommunityUserPageInner />
    </CommunityParamRouteSuspense>
  );
}
