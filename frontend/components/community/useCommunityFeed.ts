"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  useCommunityPostReport,
  type UseCommunityPostReportNotify,
} from "@/components/community/useCommunityPostReport";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { useCommunityFeedPublishSubmit } from "@/components/community/useCommunityFeedPublishSubmit";
import { useCommunityAuth, type CommunityMeUser } from "@/components/community/CommunityAuthContext";
import { useCommunityPublish } from "@/components/community/CommunityPublishContext";
import {
  type FeedTab,
  type SortBy,
} from "@/components/community/communityFeedConstants";
import {
  communityFeedHasMoreFromClientSlice,
  resolveCommunityFeedPostsToShow,
} from "@/components/community/communityFeedVisiblePosts";
import { useCommunityFeedFilters } from "@/components/community/useCommunityFeedFilters";
import { useCommunityFeedAnchorPoi } from "@/components/community/useCommunityFeedAnchorPoi";
import {
  communityFeedGeoQueryFromDiscovery,
  type CommunityFeedProximityFilter,
} from "@/components/community/communityFeedProximity";
import type { CommunityFeedGeoQuery } from "@/components/community/communityFeedGeoQuery";
import { mergeCommunityFeedLocalAndApiPosts } from "@/components/community/mergeCommunityFeedLocalAndApiPosts";
import {
  getMeFollowing,
  getMeCollects,
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
import { useCommunityDrawerCommentsQuery } from "@/components/community/useCommunityDrawerCommentsQuery";
import { useCommunityFeedPostDeepLink } from "@/components/community/useCommunityFeedPostDeepLink";
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
  normalizeCommunityTopicTagFromSearchInput,
  parseCommunityFeedSortFromQuery,
  pathnameWithFeedSort,
} from "@/lib/communityFeedSortUrl";
import {
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  communityPostTagExceedsServerUtf8Limit,
} from "@/lib/apiClient/community";
import { isShowcaseAuthorId, isShowcasePostId } from "@/lib/communityShowcase";
import {
  loadShowcaseEngagementSets,
  persistShowcaseCollectedIds,
  persistShowcaseLikedIds,
} from "@/lib/communityShowcaseEngagementStorage";
import { persistShowcaseFollowIds } from "@/lib/communityShowcaseFollowStorage";
import type { CommunityFeedInitialSnapshot } from "@/lib/community/communityFeedInitialData";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

function authorForSelf(u: CommunityMeUser | null, guestLabel: string): CommunityPost["author"] {
  if (!u?.id) {
    return { id: "local-guest", nickname: guestLabel, avatar_url: null, role: "traveler" };
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
export function useCommunityFeed(options?: { initialSnapshot?: CommunityFeedInitialSnapshot | null }) {
  const initialSnapshot = options?.initialSnapshot ?? null;
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const { isLoggedIn, isLoading: authLoading, user: communityUser } = useCommunityAuth();
  const publishContext = useCommunityPublish();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  /** Feed 评论入口：打开详情并滚至评论区（P1-03 统一路径） */
  const [detailFocusComments, setDetailFocusComments] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [localPosts, setLocalPosts] = useState<CommunityPost[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  /** 非 i18n key 的 Toast 正文（如关注失败时展示 API 映射文案） */
  const [toastBodyOverride, setToastBodyOverride] = useState<string | null>(null);
  /** 31 §3.2：发帖成功时副文案（如「去我的帖子」引导） */
  const [toastHint, setToastHint] = useState<string | null>(null);
  const [commentSendFailed, setCommentSendFailed] = useState(false);
  const [commentSendErrorMessage, setCommentSendErrorMessage] = useState<string | null>(null);
  /** 后端 `errors` 映射后的字段文案（31 §二：输入旁 + aria） */
  const [commentFieldMessages, setCommentFieldMessages] = useState<Record<string, string> | null>(null);
  const [commentsRetryTick, setCommentsRetryTick] = useState(0);
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>("chronological");
  const activeCommentPostId = commentPost?.id ?? detailPost?.id ?? null;
  const {
    apiCommentsByPostId,
    commentsLoadError,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
  } = useCommunityDrawerCommentsQuery({
    postIdOpen: activeCommentPostId,
    commentSort,
    commentsRetryTick,
    t,
    logContext: "useCommunityFeed",
  });
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

  const { anchorPoiId, setAnchorPoiId, gpsCoords, anchorRevision } = useCommunityFeedAnchorPoi();
  const [proximityFilter, setProximityFilter] = useState<CommunityFeedProximityFilter>("none");

  const feedGeoQuery = useMemo(
    () => communityFeedGeoQueryFromDiscovery(anchorPoiId, proximityFilter, gpsCoords),
    [anchorPoiId, proximityFilter, gpsCoords],
  );

  const feedInitialSnapshot = useMemo(() => {
    if (!initialSnapshot) return null;
    if (feedTagFromUrl) return null;
    if (feedApiMode !== initialSnapshot.mode) return null;
    if (anchorPoiId || proximityFilter !== "none") return null;
    return initialSnapshot;
  }, [initialSnapshot, feedTagFromUrl, feedApiMode, anchorPoiId, proximityFilter]);

  const [searchQuery, setSearchQuery] = useState("");
  const feedApiTextQRaw = useMemo(() => {
    const tagFromInput = normalizeCommunityTopicTagFromSearchInput(searchQuery);
    if (tagFromInput || feedTagFromUrl) return "";
    const q = searchQuery.trim();
    return q.length >= 2 ? q : "";
  }, [searchQuery, feedTagFromUrl]);
  const feedApiTextQ = useDebouncedValue(feedApiTextQRaw, 300);
  const serverFeedTextSearch = feedApiTextQ.length > 0;

  const feedApi = useCommunityFeedApi(feedApiMode, feedTagFromUrl, feedGeoQuery, anchorRevision, {
    initialSnapshot: feedInitialSnapshot,
    textQ: serverFeedTextSearch ? feedApiTextQ : null,
  });
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
  const serverProximityFilterApplied =
    feedFromApi && proximityFilter !== "none" && feedGeoQuery.max_distance_m != null;
  const [localCommentsByPostId, setLocalCommentsByPostId] = useState<Record<string, CommunityComment[]>>({});
  const [feedPage, setFeedPage] = useState(1);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [focusReturnTarget, setFocusReturnTarget] = useState<HTMLElement | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followBusyAuthorId, setFollowBusyAuthorId] = useState<string | null>(null);
  const followingAuthorIdSet = useMemo(() => new Set(followingIds), [followingIds]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [collectedPostIds, setCollectedPostIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const { liked, collected } = loadShowcaseEngagementSets();
    if (liked.size === 0 && collected.size === 0) return;
    setLikedPostIds((prev) => new Set([...prev, ...liked]));
    setCollectedPostIds((prev) => new Set([...prev, ...collected]));
  }, []);
  /** `getMeCollects` 失败时不得清空 Set 冒充「未收藏」；用文案提示并重试 */
  const [meCollectsLoadError, setMeCollectsLoadError] = useState<string | null>(null);
  const [meCollectsRetryTick, setMeCollectsRetryTick] = useState(0);

  /** 发布后 local 与 refetch 的 api 可能同 id；api 为准，local 仅保留尚未入 api 的乐观项。 */
  const allPosts = useMemo(
    () => mergeCommunityFeedLocalAndApiPosts(localPosts, apiPosts),
    [localPosts, apiPosts],
  );
  const filterApi = useCommunityFeedFilters({
    allPosts,
    followingIds,
    feedTab,
    setFeedTab,
    sortBy,
    setSortBy,
    preserveApiFeedOrder: feedFromApi,
    anchorPoiId,
    gpsCoords,
    proximityFilter,
    setProximityFilter,
    serverProximityFilterApplied,
    skipFollowingAuthorFilter: feedFromApi && feedTab === "following",
    skipClientTextSearch: serverFeedTextSearch,
    searchQuery,
    setSearchQuery,
  });
  const {
    searchFilteredPosts,
    clearFilters: clearFiltersFromHook,
    setTagFilter: setTagFilterState,
    setDestinationFilter: setDestinationFilterFromUrl,
  } = filterApi;

  const { dismissPostDeepLinkIssue, retryPostDeepLinkFetch } = useCommunityFeedPostDeepLink({
    searchParams,
    allPosts,
    searchFilteredPosts,
    postDeepLinkLastId,
    t,
    setDetailPost,
    setPostDeepLinkBusy,
    setPostDeepLinkAlert,
    setPostDeepLinkLastId,
  });

  const pullYRef = useRef(0);
  pullYRef.current = pullY;
  const feedLoadingRef = useRef(false);
  feedLoadingRef.current = feedLoading;
  const pullStartYRef = useRef<number | null>(null);
  const refreshFeedRef = useRef<() => void>(() => {});
  const focusReturnTargetRef = useRef<HTMLElement | null>(null);
  /** `?publish=1` 在 `authLoading` 期间保留意图（与 `useCommunityFeedPublishQueryAndRegister` 同源）。 */
  const pendingPublishFromQueryRef = useRef(false);
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

  const { handlePublishSubmit, clearPublishSendError } = useCommunityFeedPublishSubmit({
    t,
    dash,
    communityUser,
    feedApiRefetch,
    setLocalPosts,
    setPublishSendFailed,
    setPublishErrorMessage,
    setPublishFieldMessages,
    setToast,
    setToastBodyOverride,
    setToastHint,
    scheduleToastClear,
    onPublishSuccess: (payload) => {
      if (payload.type === "video") setSortBy("latest");
    },
  });

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
    if (!showLoginModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    loginBackButtonRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showLoginModal]);

  const postsToShow = useMemo(
    () =>
      resolveCommunityFeedPostsToShow({
        searchFilteredPosts,
        feedPage,
        feedFromApi,
        feedNextCursor,
      }),
    [searchFilteredPosts, feedPage, feedFromApi, feedNextCursor],
  );
  const hasMoreFromApi = feedNextCursor != null;
  const hasMoreFromClient = communityFeedHasMoreFromClientSlice({
    searchFilteredPosts,
    feedPage,
    feedNextCursor,
  });
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
      let changed = false;
      for (const p of apiPosts) {
        if (p.likedByMe === true) {
          if (!next.has(p.id)) {
            next.add(p.id);
            changed = true;
          }
        } else if (p.likedByMe === false && next.has(p.id)) {
          next.delete(p.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [apiPosts, isLoggedIn, feedFromApi]);

  /** `?post=` 拉详情等：详情 JSON 含 `liked_by_me` 时同步 */
  useEffect(() => {
    if (!detailPost) return;
    const lm = detailPost.likedByMe;
    if (lm !== true && lm !== false) return;
    setLikedPostIds((prev) => {
      const has = prev.has(detailPost.id);
      if (lm && has) return prev;
      if (!lm && !has) return prev;
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
      let changed = false;
      for (const p of apiPosts) {
        if (p.collectedByMe === true) {
          if (!next.has(p.id)) {
            next.add(p.id);
            changed = true;
          }
        } else if (p.collectedByMe === false && next.has(p.id)) {
          next.delete(p.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [apiPosts, isLoggedIn, feedFromApi]);

  useEffect(() => {
    if (!detailPost) return;
    const cm = detailPost.collectedByMe;
    if (cm !== true && cm !== false) return;
    setCollectedPostIds((prev) => {
      const has = prev.has(detailPost.id);
      if (cm && has) return prev;
      if (!cm && !has) return prev;
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

  /** 搜索框 Enter：将输入作为 `GET …/feed` `tag`（与 `/community/topic/…` 同源） */
  const applySearchAsTopicTag = useCallback(() => {
    const tag = normalizeCommunityTopicTagFromSearchInput(searchQuery);
    if (!tag) return;
    if (communityPostTagExceedsServerUtf8Limit(tag)) {
      setToastHint(null);
      setToastBodyOverride(
        t("community_search_server_tag_skipped_too_long", { n: COMMUNITY_FEED_TAG_QUERY_MAX_LEN }),
      );
      setToast("community_notice");
      scheduleToastClear(4200);
      return;
    }
    setSearchQuery("");
    setTagFilter(tag);
  }, [searchQuery, setSearchQuery, setTagFilter, scheduleToastClear, t, setToastHint, setToastBodyOverride, setToast]);

  useEffect(() => {
    let hasPublishParam = searchParams.get("publish") === "1";
    if (!hasPublishParam && typeof window !== "undefined") {
      try {
        hasPublishParam = new URL(window.location.href).searchParams.get("publish") === "1";
      } catch {
        /* ignore */
      }
    }

    if (!hasPublishParam) {
      pendingPublishFromQueryRef.current = false;
      return;
    }
    if (authLoading) {
      pendingPublishFromQueryRef.current = true;
      return;
    }

    pendingPublishFromQueryRef.current = false;

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setShowLoginModal(false);
    setPublishSendFailed(false);
    setPublishErrorMessage(null);
    setPublishOpen(true);
  }, [searchParams, authLoading, isLoggedIn]);

  useEffect(() => {
    if (authLoading) return;
    if (!pendingPublishFromQueryRef.current) return;

    let hasPublishParam = searchParams.get("publish") === "1";
    if (!hasPublishParam && typeof window !== "undefined") {
      try {
        hasPublishParam = new URL(window.location.href).searchParams.get("publish") === "1";
      } catch {
        /* ignore */
      }
    }
    if (!hasPublishParam) {
      pendingPublishFromQueryRef.current = false;
      return;
    }

    pendingPublishFromQueryRef.current = false;

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setShowLoginModal(false);
    setPublishSendFailed(false);
    setPublishErrorMessage(null);
    setPublishOpen(true);
  }, [authLoading, isLoggedIn, searchParams]);

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
    if (!showLoginModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLoginModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLoginModal]);

  useEffect(() => {
    setCommentSendFailed(false);
    setCommentSendErrorMessage(null);
    setCommentFieldMessages(null);
  }, [commentPost?.id, detailPost?.id]);

  const mergeCommentsForPost = useCallback(
    (postId: string) => {
      const api = apiCommentsByPostId[postId] ?? [];
      const local = localCommentsByPostId[postId] ?? [];
      const locals = local.filter((l) => !api.some((a) => a.id === l.id));
      return [...api, ...locals];
    },
    [apiCommentsByPostId, localCommentsByPostId],
  );

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
        author: authorForSelf(communityUser, t("community_comment_guest_author")),
        content,
        parent_id: parentId,
        created_at: new Date().toISOString(),
      };
      setLocalCommentsByPostId((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), newComment],
      }));
      if (isShowcasePostId(postId)) {
        setToastBodyOverride(null);
        setToastHint(null);
        setToast("community_showcase_comment_toast");
        scheduleToastClear(3200);
        return;
      }
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
          setToastBodyOverride(null);
          setToastHint(null);
          setToast("community_comment_send_success");
          scheduleToastClear(2600);
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
    [communityUser, t, dash, scheduleToastClear, setToast, setToastBodyOverride, setToastHint]
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
      if (isShowcaseAuthorId(id)) {
        setFollowingIds((prev) => {
          const next = wasFollowing ? prev.filter((x) => x !== id) : prev.includes(id) ? prev : [...prev, id];
          persistShowcaseFollowIds(new Set(next.filter(isShowcaseAuthorId)));
          return next;
        });
        followBusyRef.current = false;
        setFollowBusyAuthorId(null);
        return;
      }
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
      if (isShowcasePostId(postId)) persistShowcaseLikedIds(s);
      return s;
    });
    if (isShowcasePostId(postId)) return;
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
      if (isShowcasePostId(postId)) persistShowcaseCollectedIds(s);
      return s;
    });
    if (isShowcasePostId(postId)) return;
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
    setDetailFocusComments(false);
    setDetailPost(null);
    requestAnimationFrame(() => prev?.focus());
  }, [setFocusReturn]);

  const openPostDetail = useCallback(
    (p: CommunityPost, trigger?: HTMLElement | null, focusComments = false) => {
      setFocusReturn(trigger ?? null);
      setDetailFocusComments(focusComments);
      setCommentPost(null);
      setDetailPost(p);
    },
    [setFocusReturn],
  );

  const closePublishDrawer = useCallback(() => {
    const prev = focusReturnTargetRef.current;
    setFocusReturn(null);
    setPublishOpen(false);
    setPublishSendFailed(false);
    setPublishErrorMessage(null);
    requestAnimationFrame(() => prev?.focus());
  }, [setFocusReturn]);

  const feedSearchMode = serverFeedTextSearch ? ("api-text-q-v1" as const) : ("client-filter-topic-v1" as const);

  return {
    t,
    isLoggedIn,
    authLoading,
    feedSearchMode,
    ...filterApi,
    anchorPoiId,
    setAnchorPoiId,
    proximityFilter,
    setProximityFilter,
    hrefTopicPathForTag,
    setTagFilter,
    clearFilters,
    applySearchAsTopicTag,
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
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
    commentPost,
    commentsForPost,
    detailPost,
    commentsForDetail,
    detailFocusComments,
    setDetailFocusComments,
    openPostDetail,
    detailPostAuthorFollow,
    showLoginModal,
    setShowLoginModal,
    publishOpen,
    toast,
    toastBodyOverride,
    toastHint,
    mergeCommentsForPost,
    apiCommentsByPostId,
    focusReturnTargetRef,
    loginBackButtonRef,
    closeCommentDrawer,
    closeDetailDrawer,
    closePublishDrawer,
    postDeepLinkBusy,
    postDeepLinkAlert,
    dismissPostDeepLinkIssue,
    retryPostDeepLinkFetch,
  };
}
