"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  useCommunityPostReport,
  type UseCommunityPostReportNotify,
} from "@/components/community/useCommunityPostReport";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import type { CommunityPostType, CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { useCommunityAuth, type CommunityMeUser } from "@/components/community/CommunityAuthContext";
import { useCommunityPublish } from "@/components/community/CommunityPublishContext";
import {
  FEED_PAGE_SIZE,
  TRAVEL_IMG,
  type FeedTab,
  type SortBy,
} from "@/components/community/communityFeedConstants";
import { useCommunityFeedFilters } from "@/components/community/useCommunityFeedFilters";
import {
  createPost as apiCreatePost,
  getMeFollowing,
  getMeCollects,
  getPostById,
  getPostComments as apiGetPostComments,
  postComment as apiPostComment,
  postLike,
  deleteLike,
  postCollect,
  deleteCollect,
  postUserFollow,
  deleteUserFollow,
  type CommunityCommentSort,
} from "@/lib/apiClient/community";
import { useCommunityFeedApi } from "@/components/community/useCommunityFeedApi";
import {
  mapApiCommentToCommunityComment,
  mapApiPostToCommunityPost,
  mapApiUserRoleToCommunity,
} from "@/components/community/communityFeedMappers";
import { buildAuthorFollowForPost } from "@/components/community/communityFeedFollowUtils";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  interpretCommunityWriteError,
  messageForCommunityActionResponse,
} from "@/lib/formatCommunityApiMessage";
import {
  communityTopicPathForTag as communityTopicPathForTagFromSort,
  feedSortQuerySuffix,
  parseCommunityFeedSortFromQuery,
  pathnameWithFeedSort,
} from "@/lib/communityFeedSortUrl";

function authorForSelf(u: CommunityMeUser | null, dash: string): CommunityPost["author"] {
  if (!u?.id) {
    return { id: "unknown", nickname: dash, avatar_url: null, role: "tourist" };
  }
  const walletShort = formatWalletOrDidShort(u.default_wallet_address ?? undefined);
  return {
    id: u.id,
    nickname: u.nickname?.trim() ? u.nickname : u.id.slice(0, 8),
    avatar_url: u.avatar_url ?? null,
    role: mapApiUserRoleToCommunity(u.role),
    ...(walletShort ? { wallet: walletShort } : {}),
  };
}

/** 51-F1 / 51-31-9 / 51-31-5：再导出供 me/collects、me/posts、单测使用；实现见 communityFeedMappers */
export { mapApiPostToCommunityPost, mapApiCommentToCommunityComment } from "./communityFeedMappers";

/** 社区 Feed 页：状态、筛选、分页、评论/发帖/详情/视频/登录弹层逻辑（43 阶段拆出） */
export function useCommunityFeed() {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const { isLoggedIn, isLoading: authLoading, user: communityUser } = useCommunityAuth();
  const publishContext = useCommunityPublish();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [localPosts, setLocalPosts] = useState<CommunityPost[]>([]);
  const [videoPost, setVideoPost] = useState<CommunityPost | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  /** 非 i18n key 的 Toast 正文（如关注失败时展示 API 映射文案） */
  const [toastBodyOverride, setToastBodyOverride] = useState<string | null>(null);
  /** 31 §3.2：发帖成功时副文案（如「去我的帖子」引导） */
  const [toastHint, setToastHint] = useState<string | null>(null);
  const [commentSendFailed, setCommentSendFailed] = useState(false);
  const [commentSendErrorMessage, setCommentSendErrorMessage] = useState<string | null>(null);
  /** 后端 `errors` 映射后的字段文案（31 §二：输入旁 + aria） */
  const [commentFieldMessages, setCommentFieldMessages] = useState<Record<string, string> | null>(null);
  const [commentsLoadError, setCommentsLoadError] = useState<string | null>(null);
  const [commentsRetryTick, setCommentsRetryTick] = useState(0);
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>("chronological");
  const [publishSendFailed, setPublishSendFailed] = useState(false);
  const [publishErrorMessage, setPublishErrorMessage] = useState<string | null>(null);
  const [publishFieldMessages, setPublishFieldMessages] = useState<Record<string, string> | null>(null);
  /** B-055：`?post=` / `GET …/posts/:id` 解析中；失败或 `post: null` 时由 `postDeepLinkAlert` 展示中性说明 */
  const [postDeepLinkBusy, setPostDeepLinkBusy] = useState(false);
  const [postDeepLinkAlert, setPostDeepLinkAlert] = useState<
    null | { kind: "unavailable" } | { kind: "load_failed"; message: string }
  >(null);
  const [postDeepLinkLastId, setPostDeepLinkLastId] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<FeedTab>("recommend");
  /** B-077 / TT-COMMUNITY-TOPIC-SORT-URL-001：`sort=` 为单一真相源；与 `GET …/feed` `mode` 同源 */
  const sortBy: SortBy = useMemo(
    () => parseCommunityFeedSortFromQuery(searchParams.get("sort")),
    [searchParams],
  );

  const setSortBy = useCallback(
    (s: SortBy) => {
      if (typeof window === "undefined") return;
      const path = pathname ?? window.location.pathname;
      const next = pathnameWithFeedSort(path, window.location.search, s);
      router.replace(next, { scroll: false });
    },
    [router, pathname],
  );

  /** 与 `setTagFilter` 同源，话题页 `<Link href>` 保留 `sort=hot` */
  const hrefTopicPathForTag = useCallback(
    (tag: string) => communityTopicPathForTagFromSort(tag, sortBy),
    [sortBy],
  );

  const feedApiMode = feedTab === "following" ? "follow" : sortBy === "hot" ? "hot" : "latest";
  /** 与 URL 话题一致，供 Feed API 服务端筛选（先于 filter hook 的 tag 状态同步） */
  const feedTagFromUrl = useMemo(() => {
    let fromPath: string | null = null;
    const p = pathname ?? "";
    const m = p.match(/^\/community\/topic\/(.+)$/);
    if (m?.[1]) {
      try {
        fromPath = decodeURIComponent(m[1]);
      } catch {
        fromPath = m[1];
      }
    }
    const raw = fromPath ?? searchParams.get("tag");
    const trimmed = raw?.trim() || null;
    if (!trimmed) return null;
    if (trimmed.length > 64) return null;
    return trimmed;
  }, [pathname, searchParams]);
  const feedApi = useCommunityFeedApi(feedApiMode, feedTagFromUrl);
  const {
    apiPosts,
    setApiPosts,
    feedNextCursor,
    setFeedNextCursor,
    feedLoading,
    setFeedLoading,
    feedError,
    setFeedError,
    feedFromApi,
    refetchFeed: feedApiRefetch,
    loadMore: feedApiLoadMore,
  } = feedApi;
  const [localCommentsByPostId, setLocalCommentsByPostId] = useState<Record<string, CommunityComment[]>>({});
  const [apiCommentsByPostId, setApiCommentsByPostId] = useState<Record<string, CommunityComment[]>>({});
  const [feedPage, setFeedPage] = useState(1);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [focusReturnTarget, setFocusReturnTarget] = useState<HTMLElement | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followBusyAuthorId, setFollowBusyAuthorId] = useState<string | null>(null);
  const followingAuthorIdSet = useMemo(() => new Set(followingIds), [followingIds]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [collectedPostIds, setCollectedPostIds] = useState<Set<string>>(new Set());
  /** `getMeCollects` 失败时不得清空 Set 冒充「未收藏」；用文案提示并重试 */
  const [meCollectsLoadError, setMeCollectsLoadError] = useState<string | null>(null);
  const [meCollectsRetryTick, setMeCollectsRetryTick] = useState(0);

  const allPosts = useMemo(() => [...localPosts, ...apiPosts], [localPosts, apiPosts]);
  const filterApi = useCommunityFeedFilters({
    allPosts,
    followingIds,
    feedTab,
    setFeedTab,
    sortBy,
    setSortBy,
    preserveApiFeedOrder: feedFromApi,
  });
  const {
    searchFilteredPosts,
    clearFilters: clearFiltersFromHook,
    setTagFilter: setTagFilterState,
    setDestinationFilter: setDestinationFilterFromUrl,
  } = filterApi;

  const pullYRef = useRef(0);
  pullYRef.current = pullY;
  const feedLoadingRef = useRef(false);
  feedLoadingRef.current = feedLoading;
  const pullStartYRef = useRef<number | null>(null);
  const refreshFeedRef = useRef<() => void>(() => {});
  const focusReturnTargetRef = useRef<HTMLElement | null>(null);
  const videoBackButtonRef = useRef<HTMLButtonElement>(null);
  const loginBackButtonRef = useRef<HTMLButtonElement>(null);
  /** §3.2：触底与按钮共用 loadMore，防止游标请求重叠 */
  const loadMoreInFlightRef = useRef(false);

  const scheduleToastClear = useCallback((ms: number) => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      setToast(null);
      setToastHint(null);
      setToastBodyOverride(null);
    }, ms);
  }, []);

  const [reportSuccessId, setReportSuccessId] = useState<string | null>(null);

  const reportNotify = useMemo<UseCommunityPostReportNotify>(
    () => ({
      onSubmitted: (reportId) => {
        setToastBodyOverride(null);
        setToastHint(null);
        setReportSuccessId(reportId);
        setToast("community_report_submitted");
        scheduleToastClear(4200);
        window.setTimeout(() => setReportSuccessId(null), 4200);
      },
      onInvalidTargetId: () => {
        setToastBodyOverride(null);
        setToastHint(null);
        setToast("community_report_invalid_target_id");
        scheduleToastClear(3200);
      },
    }),
    [scheduleToastClear]
  );

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
  } = useCommunityPostReport(isLoggedIn, () => setShowLoginModal(true), t, reportNotify);

  const setFocusReturn = useCallback((el: HTMLElement | null) => {
    setFocusReturnTarget(el);
    focusReturnTargetRef.current = el;
  }, []);

  useEffect(() => {
    if (!videoPost) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    videoBackButtonRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
    };
  }, [videoPost]);

  useEffect(() => {
    if (!showLoginModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    loginBackButtonRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showLoginModal]);

  const postsToShow = useMemo(
    () => searchFilteredPosts.slice(0, feedPage * FEED_PAGE_SIZE),
    [searchFilteredPosts, feedPage]
  );
  const hasMoreFromApi = feedNextCursor != null;
  const hasMoreFromClient = feedPage * FEED_PAGE_SIZE < searchFilteredPosts.length;
  const hasMore = hasMoreFromApi || hasMoreFromClient;

  const retryMeCollectsLoad = useCallback(() => {
    setMeCollectsRetryTick((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setFollowingIds([]);
      setCollectedPostIds(new Set());
      setMeCollectsLoadError(null);
      return;
    }
    let cancelled = false;
    getMeCollects()
      .then((data) => {
        if (cancelled) return;
        setMeCollectsLoadError(null);
        const list = data.collects ?? [];
        setCollectedPostIds(new Set(list.map((c) => c.post_id).filter(Boolean) as string[]));
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("useCommunityFeed getMeCollects:", err);
          }
          setMeCollectsLoadError(mapApiReadError(err, t, "community_me_collects_loadFailed"));
        }
      });
    getMeFollowing()
      .then((data) => {
        if (cancelled) return;
        const list = data.following ?? [];
        setFollowingIds(list.map((u) => u.id).filter(Boolean) as string[]);
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("useCommunityFeed getMeFollowing:", err);
          }
          setFollowingIds([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, meCollectsRetryTick, t]);

  /** Feed 行携带 `liked_by_me` 时与本地点赞 Set 对齐（刷新/翻页后心形状态正确） */
  useEffect(() => {
    if (!isLoggedIn || !feedFromApi) return;
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      for (const p of apiPosts) {
        if (p.likedByMe === true) next.add(p.id);
        else if (p.likedByMe === false) next.delete(p.id);
      }
      return next;
    });
  }, [apiPosts, isLoggedIn, feedFromApi]);

  /** `?post=` 拉详情等：详情 JSON 含 `liked_by_me` 时同步 */
  useEffect(() => {
    if (!detailPost) return;
    const lm = detailPost.likedByMe;
    if (lm !== true && lm !== false) return;
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (lm) next.add(detailPost.id);
      else next.delete(detailPost.id);
      return next;
    });
  }, [detailPost?.id, detailPost?.likedByMe]);

  /** Feed 行携带 `collected_by_me` 时与本地收藏 Set 对齐（与 `getMeCollects` 100 条上限互补） */
  useEffect(() => {
    if (!isLoggedIn || !feedFromApi) return;
    setCollectedPostIds((prev) => {
      const next = new Set(prev);
      for (const p of apiPosts) {
        if (p.collectedByMe === true) next.add(p.id);
        else if (p.collectedByMe === false) next.delete(p.id);
      }
      return next;
    });
  }, [apiPosts, isLoggedIn, feedFromApi]);

  useEffect(() => {
    if (!detailPost) return;
    const cm = detailPost.collectedByMe;
    if (cm !== true && cm !== false) return;
    setCollectedPostIds((prev) => {
      const next = new Set(prev);
      if (cm) next.add(detailPost.id);
      else next.delete(detailPost.id);
      return next;
    });
  }, [detailPost?.id, detailPost?.collectedByMe]);

  /** B-076：详情 API `author_followed_by_me` 与 `followingIds`（me/following）对读，避免深链竞态 */
  useEffect(() => {
    if (!isLoggedIn || !detailPost) return;
    const aid = detailPost.author?.id?.trim();
    if (!aid || aid === communityUser?.id) return;
    const f = detailPost.authorFollowedByMe;
    if (f !== true && f !== false) return;
    setFollowingIds((prev) => {
      const s = new Set(prev);
      if (f === true) {
        if (s.has(aid)) return prev;
        s.add(aid);
        return [...s];
      }
      if (!s.has(aid)) return prev;
      s.delete(aid);
      return [...s];
    });
  }, [
    isLoggedIn,
    detailPost?.id,
    detailPost?.author?.id,
    detailPost?.authorFollowedByMe,
    communityUser?.id,
  ]);

  /** B-076：Feed 行 `author_followed_by_me` 并入 following 集合（与 me/following 互补） */
  useEffect(() => {
    if (!isLoggedIn || !feedFromApi) return;
    setFollowingIds((prev) => {
      const s = new Set(prev);
      let changed = false;
      for (const p of apiPosts) {
        const aid = p.author?.id?.trim();
        if (!aid || aid === communityUser?.id) continue;
        const f = p.authorFollowedByMe;
        if (f === true) {
          if (!s.has(aid)) {
            s.add(aid);
            changed = true;
          }
        } else if (f === false) {
          if (s.has(aid)) {
            s.delete(aid);
            changed = true;
          }
        }
      }
      return changed ? [...s] : prev;
    });
  }, [apiPosts, isLoggedIn, feedFromApi, communityUser?.id]);

  useEffect(() => {
    setFeedPage(1);
  }, [
    filterApi.searchQuery,
    filterApi.feedTab,
    filterApi.typeFilter,
    filterApi.sortBy,
    filterApi.destinationFilter,
    filterApi.regionFilter,
    filterApi.tagFilter,
    feedTagFromUrl,
  ]);

  /** 31 §2.1：`/community/topic/[tag]` 与 `?tag=` 与话题筛选同步（仅以 URL 为准） */
  useEffect(() => {
    let fromPath: string | null = null;
    const p = pathname ?? "";
    const m = p.match(/^\/community\/topic\/(.+)$/);
    if (m?.[1]) {
      try {
        fromPath = decodeURIComponent(m[1]);
      } catch {
        fromPath = m[1];
      }
    }
    const raw = fromPath ?? searchParams.get("tag");
    const next = raw?.trim() || null;
    setTagFilterState((prev) => (prev === next ? prev : next));
  }, [searchParams, pathname, setTagFilterState]);

  /** 31 §2.1 Explore：`/community?destination=` 与目的地筛选同步 */
  useEffect(() => {
    const raw = searchParams.get("destination")?.trim();
    if (!raw) return;
    let dec = raw;
    try {
      dec = decodeURIComponent(raw);
    } catch {
      /* keep raw */
    }
    setDestinationFilterFromUrl(dec);
  }, [searchParams, setDestinationFilterFromUrl]);

  /** 只改 URL；主 Feed 下话题走 `/community/topic/…` 便于分享；`?tag=` 仍兼容；**保留 `sort=`**（B-077） */
  const setTagFilter = useCallback(
    (v: string | null) => {
      const trimmed = v?.trim() || null;
      if (typeof window === "undefined") return;
      const path = pathname ?? "";
      const sortQs = feedSortQuerySuffix(sortBy);
      if (trimmed) {
        const enc = encodeURIComponent(trimmed);
        if (path.startsWith("/community/topic/")) {
          router.replace(`/community/topic/${enc}${sortQs}`, { scroll: false });
          return;
        }
        if (path === "/community" || path === "/community/feed") {
          router.replace(`/community/topic/${enc}${sortQs}`, { scroll: false });
          return;
        }
        const u = new URL(window.location.href);
        u.searchParams.set("tag", trimmed);
        if (sortBy !== "hot") u.searchParams.delete("sort");
        else u.searchParams.set("sort", "hot");
        const qs = u.search ? u.search : "";
        router.replace(`${u.pathname}${qs}`, { scroll: false });
        return;
      }
      if (path.startsWith("/community/topic/")) {
        router.replace(`/community${sortQs}`, { scroll: false });
        return;
      }
      const u = new URL(window.location.href);
      u.searchParams.delete("tag");
      if (sortBy !== "hot") u.searchParams.delete("sort");
      else u.searchParams.set("sort", "hot");
      const qs = u.search ? u.search : "";
      router.replace(`${u.pathname}${qs}`, { scroll: false });
    },
    [router, pathname, sortBy]
  );

  useEffect(() => {
    if (searchParams.get("publish") !== "1") return;
    if (authLoading) return;
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.searchParams.delete("publish");
      window.history.replaceState({}, "", `${u.pathname}${u.search || ""}`);
    }
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setPublishSendFailed(false);
    setPublishErrorMessage(null);
    setPublishOpen(true);
  }, [searchParams, authLoading, isLoggedIn]);

  const dismissPostDeepLinkIssue = useCallback(() => {
    setPostDeepLinkAlert(null);
    setPostDeepLinkLastId(null);
  }, []);

  const retryPostDeepLinkFetch = useCallback(() => {
    const id = postDeepLinkLastId?.trim();
    if (!id) return;
    setPostDeepLinkAlert(null);
    setPostDeepLinkBusy(true);
    void (async () => {
      try {
        const res = await getPostById(id);
        const row = res.post;
        if (res.status === "ok" && row?.id) {
          setDetailPost(mapApiPostToCommunityPost(row));
          setPostDeepLinkLastId(null);
          setPostDeepLinkAlert(null);
        } else {
          setPostDeepLinkAlert({ kind: "unavailable" });
        }
      } catch (e) {
        setPostDeepLinkAlert({
          kind: "load_failed",
          message: mapApiReadError(e, t, "community_postDeepLink_loadFailed"),
        });
      } finally {
        setPostDeepLinkBusy(false);
      }
    })();
  }, [postDeepLinkLastId, t]);

  /** 31 §2.2：分享链接 `?post=` — 列表命中直接打开；否则按 id 拉详情；失败 / `post: null` 中性说明（B-055） */
  useEffect(() => {
    const raw = searchParams.get("post")?.trim();
    if (!raw || typeof window === "undefined") {
      setPostDeepLinkBusy(false);
      return;
    }

    const stripPostParam = () => {
      const u = new URL(window.location.href);
      if (!u.searchParams.has("post")) return;
      u.searchParams.delete("post");
      window.history.replaceState({}, "", `${u.pathname}${u.search || ""}`);
    };

    const found =
      allPosts.find((p) => p.id === raw) ?? searchFilteredPosts.find((p) => p.id === raw);
    if (found) {
      setDetailPost(found);
      stripPostParam();
      setPostDeepLinkBusy(false);
      setPostDeepLinkAlert(null);
      setPostDeepLinkLastId(null);
      return;
    }

    setPostDeepLinkAlert(null);
    setPostDeepLinkLastId(raw);
    setPostDeepLinkBusy(true);

    let cancelled = false;
    void (async () => {
      try {
        const res = await getPostById(raw);
        if (cancelled) return;
        const row = res.post;
        if (res.status === "ok" && row?.id) {
          setDetailPost(mapApiPostToCommunityPost(row));
          setPostDeepLinkAlert(null);
          setPostDeepLinkLastId(null);
        } else {
          setPostDeepLinkAlert({ kind: "unavailable" });
        }
      } catch (e) {
        if (cancelled) return;
        setPostDeepLinkAlert({
          kind: "load_failed",
          message: mapApiReadError(e, t, "community_postDeepLink_loadFailed"),
        });
      } finally {
        if (!cancelled) {
          stripPostParam();
          setPostDeepLinkBusy(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, allPosts, searchFilteredPosts, t]);

  const registerOpenPublish = publishContext?.registerOpenPublish;
  useEffect(() => {
    if (!registerOpenPublish) return;
    const unregister = registerOpenPublish((trigger?: HTMLElement | null) => {
      if (trigger) setFocusReturn(trigger);
      if (authLoading) return;
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      setPublishSendFailed(false);
      setPublishErrorMessage(null);
      setPublishOpen(true);
    });
    return () => unregister();
  }, [registerOpenPublish, setFocusReturn, authLoading, isLoggedIn]);

  useEffect(() => {
    if (!videoPost) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const prev = focusReturnTargetRef.current;
      setFocusReturn(null);
      setVideoPost(null);
      requestAnimationFrame(() => prev?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videoPost, setFocusReturn]);

  useEffect(() => {
    if (!showLoginModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLoginModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLoginModal]);

  useEffect(() => {
    const postId = commentPost?.id ?? detailPost?.id;
    if (!postId) return;
    let cancelled = false;
    setCommentsLoadError(null);
    apiGetPostComments(postId, { sort: commentSort })
      .then((data) => {
        if (cancelled) return;
        if (data?.status === "ok" && Array.isArray(data.comments)) {
          setApiCommentsByPostId((prev) => ({
            ...prev,
            [postId]: data.comments!.map(mapApiCommentToCommunityComment),
          }));
          setCommentsLoadError(null);
        } else {
          setApiCommentsByPostId((prev) => ({ ...prev, [postId]: [] }));
        setCommentsLoadError(t("community_comments_loadFailed"));
      }
    })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("useCommunityFeed apiGetPostComments:", err);
        }
        setApiCommentsByPostId((prev) => ({ ...prev, [postId]: [] }));
        setCommentsLoadError(mapApiReadError(err, t, "community_comments_loadFailed"));
      });
    return () => {
      cancelled = true;
    };
  }, [commentPost?.id, detailPost?.id, commentsRetryTick, commentSort, t]);

  const retryCommentsLoad = useCallback(() => {
    setCommentsRetryTick((n) => n + 1);
  }, []);

  const commentsForPost = useMemo(() => {
    if (!commentPost) return [];
    const api = apiCommentsByPostId[commentPost.id] ?? [];
    const local = localCommentsByPostId[commentPost.id] ?? [];
    const locals = local.filter((l) => !api.some((a) => a.id === l.id));
    /** 保留 API 返回顺序（含 sort=latest|hot）；本地乐观评论附在末尾 */
    return [...api, ...locals];
  }, [commentPost, localCommentsByPostId, apiCommentsByPostId]);

  const commentsForDetail = useMemo(() => {
    if (!detailPost) return [];
    const api = apiCommentsByPostId[detailPost.id] ?? [];
    const local = localCommentsByPostId[detailPost.id] ?? [];
    const locals = local.filter((l) => !api.some((a) => a.id === l.id));
    return [...api, ...locals];
  }, [detailPost, localCommentsByPostId, apiCommentsByPostId]);

  const commentDrawerContextPostId = commentPost?.id ?? detailPost?.id;
  useEffect(() => {
    setCommentSendFailed(false);
    setCommentSendErrorMessage(null);
    setCommentFieldMessages(null);
  }, [commentDrawerContextPostId]);

  const clearCommentSendError = useCallback(() => {
    setCommentSendFailed(false);
    setCommentSendErrorMessage(null);
    setCommentFieldMessages(null);
  }, []);

  const handleCommentSend = useCallback(
    async (postId: string, content: string, parentId?: string) => {
      setCommentSendFailed(false);
      setCommentSendErrorMessage(null);
      setCommentFieldMessages(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setCommentSendErrorMessage(t("community_comment_offline"));
        setCommentSendFailed(true);
        throw new Error("comment_offline");
      }
      const newComment: CommunityComment = {
        id: `comment-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        post_id: postId,
        author: authorForSelf(communityUser, dash),
        content,
        parent_id: parentId,
        created_at: new Date().toISOString(),
      };
      setLocalCommentsByPostId((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), newComment],
      }));
      const rollback = () =>
        setLocalCommentsByPostId((prev) => ({
          ...prev,
          [postId]: (prev[postId] ?? []).filter((c) => c.id !== newComment.id),
        }));
      try {
        const res = await apiPostComment(postId, content, parentId);
        const r = res as { id?: string; status?: string; message?: string } | null;
        if (r?.id) {
          setLocalCommentsByPostId((prev) => ({
            ...prev,
            [postId]: (prev[postId] ?? []).map((c) =>
              c.id === newComment.id ? { ...c, id: r.id! } : c
            ),
          }));
          return;
        }
        if (typeof window !== "undefined") {
          console.error("handleCommentSend postComment not ok:", res);
        }
        const { topMessage, fieldMessages } = interpretCommunityWriteError(r, t, "community_comment_send_failed");
        rollback();
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
            console.error("handleCommentSend:", e);
          }
          rollback();
          setCommentSendErrorMessage(mapApiReadError(e, t, "community_comment_send_failed"));
          setCommentFieldMessages(null);
          setCommentSendFailed(true);
        }
        throw e instanceof Error ? e : new Error("comment_send_failed");
      }
    },
    [communityUser, t, dash]
  );

  const clearPublishSendError = useCallback(() => {
    setPublishSendFailed(false);
    setPublishErrorMessage(null);
    setPublishFieldMessages(null);
  }, []);

  const handlePublishSubmit = useCallback(
    async (payload: { type: CommunityPostType; content: string; mediaUrls?: string[]; coverUrl?: string }) => {
      setPublishSendFailed(false);
      setPublishErrorMessage(null);
      setPublishFieldMessages(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setPublishErrorMessage(t("community_publish_offline"));
        setPublishSendFailed(true);
        throw new Error("publish_offline");
      }
      const urls =
        payload.type === "text"
          ? []
          : payload.mediaUrls?.length
            ? payload.mediaUrls
            : [TRAVEL_IMG];
      const coverOpt = payload.coverUrl?.trim();
      const newPost: CommunityPost = {
        id: `post-local-${Date.now()}`,
        type: payload.type,
        content: payload.content,
        media_url: urls[0] ?? "",
        media_urls: urls.length > 1 ? urls : undefined,
        is_video: payload.type === "video",
        ...(coverOpt ? { cover_url: coverOpt } : {}),
        tags: [],
        author: authorForSelf(communityUser, dash),
        likes: 0,
        comments: 0,
        collects: 0,
        created_at: new Date().toISOString(),
      };
      setLocalPosts((prev) => [newPost, ...prev]);
      try {
        const res = await apiCreatePost({
          body: payload.content,
          post_type: payload.type,
          media_urls: payload.type === "text" ? [] : urls,
          ...(coverOpt ? { cover_url: coverOpt } : {}),
        });
        if (res?.status === "ok" && res.id) {
          setLocalPosts((prev) =>
            prev.map((p) => (p.id === newPost.id ? { ...p, id: res.id! } : p))
          );
          feedApiRefetch();
          setToastBodyOverride(null);
          setToast("community_publish_success");
          setToastHint("community_publish_success_hint");
          scheduleToastClear(3400);
          return;
        }
        if (typeof window !== "undefined") {
          console.error("handlePublishSubmit createPost not ok:", res);
        }
        setLocalPosts((prev) => prev.filter((p) => p.id !== newPost.id));
        const { topMessage, fieldMessages } = interpretCommunityWriteError(res, t, "community_publish_failed");
        setPublishErrorMessage(topMessage);
        setPublishFieldMessages(Object.keys(fieldMessages).length > 0 ? fieldMessages : null);
        setPublishSendFailed(true);
        throw new Error("publish_post_not_ok");
      } catch (e) {
        if (e instanceof Error && e.message === "publish_post_not_ok") {
          throw e;
        }
        if (e instanceof Error && e.message === "publish_offline") {
          throw e;
        }
        if (typeof window !== "undefined") {
          console.error("handlePublishSubmit:", e);
        }
        setLocalPosts((prev) => prev.filter((p) => p.id !== newPost.id));
        setPublishErrorMessage(null);
        setPublishFieldMessages(null);
        setPublishSendFailed(true);
        throw e instanceof Error ? e : new Error("publish_failed");
      }
    },
    [feedApiRefetch, communityUser, scheduleToastClear, t, dash]
  );

  const followBusyRef = useRef(false);
  const handleAuthorFollowToggle = useCallback(
    async (authorId: string) => {
      const id = authorId.trim();
      if (!id || id === communityUser?.id) return;
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setToastHint(null);
        setToastBodyOverride(null);
        setToast("community_interaction_offline");
        scheduleToastClear(2600);
        return;
      }
      if (followBusyRef.current) return;
      followBusyRef.current = true;
      setFollowBusyAuthorId(id);
      const wasFollowing = followingAuthorIdSet.has(id);
      try {
        if (wasFollowing) {
          const res = await deleteUserFollow(id);
          if (res && typeof res === "object" && (res as { status?: string }).status === "ok") {
            setFollowingIds((prev) => prev.filter((x) => x !== id));
          } else {
            setToastHint(null);
            setToastBodyOverride(
              messageForCommunityActionResponse(res, t, "community_user_follow_toggleFailed")
            );
            setToast("community_user_follow_toggleFailed");
            scheduleToastClear(3200);
          }
        } else {
          const res = await postUserFollow(id);
          if (res && typeof res === "object" && (res as { status?: string }).status === "ok") {
            setFollowingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
          } else {
            setToastHint(null);
            setToastBodyOverride(
              messageForCommunityActionResponse(res, t, "community_user_follow_toggleFailed")
            );
            setToast("community_user_follow_toggleFailed");
            scheduleToastClear(3200);
          }
        }
      } catch (err) {
        setToastHint(null);
        setToastBodyOverride(mapApiReadError(err, t, "community_user_follow_toggleFailed"));
        setToast("community_user_follow_toggleFailed");
        scheduleToastClear(3200);
      } finally {
        followBusyRef.current = false;
        setFollowBusyAuthorId(null);
      }
    },
    [isLoggedIn, communityUser?.id, followingAuthorIdSet, scheduleToastClear, t]
  );

  const detailPostAuthorFollow = useMemo(
    () =>
      detailPost
        ? buildAuthorFollowForPost(detailPost, {
            meUserId: communityUser?.id ?? null,
            followingAuthorIds: followingAuthorIdSet,
            followBusyAuthorId,
            onAuthorFollowToggle: handleAuthorFollowToggle,
          })
        : undefined,
    [detailPost, communityUser?.id, followingAuthorIdSet, followBusyAuthorId, handleAuthorFollowToggle]
  );

  const likedPostIdsRef = useRef(likedPostIds);
  likedPostIdsRef.current = likedPostIds;
  const collectedPostIdsRef = useRef(collectedPostIds);
  collectedPostIdsRef.current = collectedPostIds;

  const handleLike = useCallback(async (postId: string) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setToastHint(null);
      setToastBodyOverride(null);
      setToast("community_interaction_offline");
      scheduleToastClear(2600);
      return;
    }
    const next = !likedPostIdsRef.current.has(postId);
    setLikedPostIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(postId);
      else s.delete(postId);
      return s;
    });
    const rollbackLike = () =>
      setLikedPostIds((prev) => {
        const s = new Set(prev);
        if (next) s.delete(postId);
        else s.add(postId);
        return s;
      });
    try {
      const res = next ? await postLike(postId) : await deleteLike(postId);
      if (!res || (res as { status?: string }).status !== "ok") {
        if (typeof window !== "undefined") {
          console.error("useCommunityFeed handleLike:", postId, res);
        }
        rollbackLike();
        setToastHint(null);
        setToastBodyOverride(messageForCommunityActionResponse(res, t, "community_like_failed"));
        setToast("community_like_failed");
        scheduleToastClear(3200);
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        console.error("useCommunityFeed handleLike:", postId, e);
      }
      rollbackLike();
      setToastHint(null);
      setToastBodyOverride(mapApiReadError(e, t, "community_like_failed"));
      setToast("community_like_failed");
      scheduleToastClear(3200);
    }
  }, [scheduleToastClear, t]);

  const handleCollect = useCallback(async (postId: string) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setToastHint(null);
      setToastBodyOverride(null);
      setToast("community_interaction_offline");
      scheduleToastClear(2600);
      return;
    }
    const next = !collectedPostIdsRef.current.has(postId);
    setCollectedPostIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(postId);
      else s.delete(postId);
      return s;
    });
    const rollbackCollect = () =>
      setCollectedPostIds((prev) => {
        const s = new Set(prev);
        if (next) s.delete(postId);
        else s.add(postId);
        return s;
      });
    try {
      const res = next ? await postCollect(postId) : await deleteCollect(postId);
      if (!res || (res as { status?: string }).status !== "ok") {
        if (typeof window !== "undefined") {
          console.error("useCommunityFeed handleCollect:", postId, res);
        }
        rollbackCollect();
        setToastHint(null);
        setToastBodyOverride(messageForCommunityActionResponse(res, t, "community_collect_failed"));
        setToast("community_collect_failed");
        scheduleToastClear(3200);
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        console.error("useCommunityFeed handleCollect:", postId, e);
      }
      rollbackCollect();
      setToastHint(null);
      setToastBodyOverride(mapApiReadError(e, t, "community_collect_failed"));
      setToast("community_collect_failed");
      scheduleToastClear(3200);
    }
  }, [scheduleToastClear, t]);

  const refreshFeed = useCallback(() => {
    setFeedError(null);
    setFeedPage(1);
    feedApiRefetch();
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [feedApiRefetch, setFeedError]);

  /** 51-31-10：加载更多——API 游标分页或客户端分页；51-31-B2 带 mode 保持当前 tab */
  const handleLoadMore = useCallback(() => {
    if (loadMoreInFlightRef.current) return;
    if (!hasMore) return;
    if (
      feedNextCursor &&
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      setToastHint(null);
      setToastBodyOverride(null);
      setToast("community_interaction_offline");
      scheduleToastClear(2600);
      return;
    }
    loadMoreInFlightRef.current = true;
    if (feedNextCursor) {
      setFeedLoadingMore(true);
      feedApiLoadMore(feedNextCursor)
        .catch((err) => {
          setToastHint(null);
          setToastBodyOverride(mapApiReadError(err, t, "community_feed_load_more_failed"));
          setToast("community_feed_load_more_failed");
          scheduleToastClear(2200);
        })
        .finally(() => {
          setFeedLoadingMore(false);
          loadMoreInFlightRef.current = false;
        });
    } else {
      setFeedLoadingMore(true);
      setFeedPage((p) => p + 1);
      window.setTimeout(() => {
        setFeedLoadingMore(false);
        loadMoreInFlightRef.current = false;
      }, 350);
    }
  }, [hasMore, feedNextCursor, feedApiLoadMore, scheduleToastClear, t]);

  useEffect(() => {
    refreshFeedRef.current = refreshFeed;
  }, [refreshFeed]);

  // 51-31-14：移动端下拉刷新（仅当页面在顶部时生效）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const PULL_THRESHOLD = 50;
    const RESISTANCE = 0.5;
    const handleStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && e.touches[0]) pullStartYRef.current = e.touches[0].clientY;
    };
    const handleMove = (e: TouchEvent) => {
      if (pullStartYRef.current === null || !e.touches[0]) return;
      if (window.scrollY > 0) {
        pullStartYRef.current = null;
        setPullY(0);
        return;
      }
      const dy = (e.touches[0].clientY - pullStartYRef.current) * RESISTANCE;
      if (dy > 0) setPullY(Math.min(dy, 80));
    };
    const handleEnd = () => {
      if (pullYRef.current >= PULL_THRESHOLD && !feedLoadingRef.current) refreshFeedRef.current();
      setPullY(0);
      pullStartYRef.current = null;
    };
    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, []);

  const clearFilters = useCallback(() => {
    if (typeof window !== "undefined") {
      const path = pathname ?? "";
      if (path.startsWith("/community/topic/")) {
        router.replace("/community", { scroll: false });
      } else {
        const u = new URL(window.location.href);
        let changed = false;
        if (u.searchParams.has("tag")) {
          u.searchParams.delete("tag");
          changed = true;
        }
        if (u.searchParams.has("destination")) {
          u.searchParams.delete("destination");
          changed = true;
        }
        if (changed) {
          const qs = u.search ? u.search : "";
          router.replace(`${u.pathname}${qs}`, { scroll: false });
        }
      }
    }
    clearFiltersFromHook();
  }, [clearFiltersFromHook, router, pathname]);

  const openPublish = useCallback(
    (trigger?: HTMLElement | null) => {
      if (trigger) setFocusReturn(trigger);
      if (isLoggedIn) {
        setPublishSendFailed(false);
        setPublishErrorMessage(null);
        setPublishOpen(true);
      } else setShowLoginModal(true);
    },
    [isLoggedIn, setFocusReturn]
  );

  const closeCommentDrawer = useCallback(() => {
    const prev = focusReturnTargetRef.current;
    setFocusReturn(null);
    setCommentPost(null);
    requestAnimationFrame(() => prev?.focus());
  }, [setFocusReturn]);

  const closeDetailDrawer = useCallback(() => {
    const prev = focusReturnTargetRef.current;
    setFocusReturn(null);
    setDetailPost(null);
    requestAnimationFrame(() => prev?.focus());
  }, [setFocusReturn]);

  const closePublishDrawer = useCallback(() => {
    const prev = focusReturnTargetRef.current;
    setFocusReturn(null);
    setPublishOpen(false);
    setPublishSendFailed(false);
    setPublishErrorMessage(null);
    requestAnimationFrame(() => prev?.focus());
  }, [setFocusReturn]);

  const closeVideoOverlay = useCallback(() => {
    const prev = focusReturnTargetRef.current;
    setFocusReturn(null);
    setVideoPost(null);
    requestAnimationFrame(() => prev?.focus());
  }, [setFocusReturn]);

  return {
    t,
    isLoggedIn,
    authLoading,
    ...filterApi,
    hrefTopicPathForTag,
    setTagFilter,
    clearFilters,
    feedError,
    refreshFeed,
    pullY,
    feedLoading,
    searchFilteredPosts,
    postsToShow,
    localCommentsByPostId,
    hasMore,
    feedLoadingMore,
    handleLoadMore,
    setFeedPage,
    setFeedLoadingMore,
    setFocusReturn,
    setDetailPost,
    setCommentPost,
    setVideoPost,
    openPublish,
    handleReport,
    handleReportComment,
    handleReportSubmit,
    reportContext,
    closeReportDrawer,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    reportSuccessId,
    handleLike,
    handleCollect,
    handleAuthorFollowToggle,
    meUserId: communityUser?.id ?? null,
    followingAuthorIdSet,
    followBusyAuthorId,
    likedPostIds,
    collectedPostIds,
    meCollectsLoadError,
    retryMeCollectsLoad,
    handleCommentSend,
    handlePublishSubmit,
    publishSendFailed,
    publishErrorMessage,
    publishFieldMessages,
    clearPublishSendError,
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    commentsLoadError,
    retryCommentsLoad,
    commentSort,
    setCommentSort,
    commentPost,
    commentsForPost,
    detailPost,
    commentsForDetail,
    detailPostAuthorFollow,
    showLoginModal,
    setShowLoginModal,
    publishOpen,
    toast,
    toastBodyOverride,
    toastHint,
    videoPost,
    focusReturnTargetRef,
    videoBackButtonRef,
    loginBackButtonRef,
    closeCommentDrawer,
    closeDetailDrawer,
    closePublishDrawer,
    closeVideoOverlay,
    postDeepLinkBusy,
    postDeepLinkAlert,
    dismissPostDeepLinkIssue,
    retryPostDeepLinkFetch,
  };
}
