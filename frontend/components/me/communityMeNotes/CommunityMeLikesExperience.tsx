"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { getMeLikes, getPostById } from "@/lib/apiClient/community";
import { mapApiPostToCommunityPost } from "@/components/community/useCommunityFeed";
import type { CommunityPost } from "@/lib/communityPostTypes";
import { useCommunityPostLikeCollect } from "@/components/community/useCommunityPostLikeCollect";
import { communityCyanPillFocus, communityFuchsiaPillFocus } from "@/lib/communityA11yFocus";
import { useState, useEffect, useMemo, useCallback } from "react";
import { applyPinOrder } from "@/lib/communityMeNotesPinOrder";
import CommunityMeDataStateSurface from "@/components/me/CommunityMeDataStateSurface";
import { CommunityMeDrawerGridLoadingSkeleton } from "@/components/me/communityMeNotes/CommunityMeDrawerGridLoadingSkeleton";
import { CommunityMeNotesPostThumbGrid } from "@/components/me/communityMeNotes/CommunityMeNotesPostThumbGrid";
import { dataStateInvalid, dataStateSuccess, deriveListDataState } from "@/lib/dataState";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { communityMeLoginReturnUrl } from "@/lib/communityMeContentNav";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { allSettledInChunks, COMMUNITY_ME_POST_DETAIL_FETCH_CONCURRENCY } from "@/lib/allSettledInChunks";
import { parseMeLikesListEnvelope } from "@/lib/communityMeDrawerListContracts";
import { COMMUNITY_ME_DRAWER_LIST_ID_CAP } from "@/lib/communityMeDrawerListCaps";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";

/** 88 §3.2：赞过列表空态 */
function MeLikesEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-ink-800/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={t("community_me_likes_empty")}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-200"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">{t("community_me_likes_empty")}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_me_likes_empty_hint")}</p>
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

const drawerShellClass = "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

export type CommunityMeLikesExperienceProps = {
  /** 从个人中心玻璃弹层打开时传入：进入帖子深链后关闭弹层 */
  onLeaveDrawer?: () => void;
};

/**
 * 赞过：仅用于个人中心弹层；点击缩略图进入帖子（`/community/post/:id` → Feed 深链）。
 * 无独立列表页（与「我的收藏」同构）。
 */
export function CommunityMeLikesExperience({ onLeaveDrawer }: CommunityMeLikesExperienceProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginReturnPath = useMemo(
    () => communityMeLoginReturnUrl(pathname, searchParams, "likes"),
    [pathname, searchParams],
  );
  const likesFeatureOn = isCommunityMeLikesListEnabled();
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const [apiPosts, setApiPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoadError, setListLoadError] = useState<string | null>(null);
  const [partialHint, setPartialHint] = useState<string | null>(null);
  const [likesRetryKey, setLikesRetryKey] = useState(0);
  const [pinOrder, setPinOrder] = useState<string[]>([]);
  /** `GET …/me/likes` 解析后的 `post_id` 条数（用于上限提示；与 hydrate 后帖子数解耦） */
  const [likesSourcePostIdCount, setLikesSourcePostIdCount] = useState(0);

  useEffect(() => {
    if (!likesFeatureOn) {
      setLoading(false);
      setListLoadError(null);
      setApiPosts([]);
      setLikesSourcePostIdCount(0);
      setPinOrder([]);
      return;
    }
    if (!isLoggedIn || authPending) {
      if (!isLoggedIn && !authPending) {
        setLoading(false);
        setListLoadError(null);
        setApiPosts([]);
        setLikesSourcePostIdCount(0);
        setPinOrder([]);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    setListLoadError(null);
    setPartialHint(null);
    setLikesSourcePostIdCount(0);
    getMeLikes()
      .then((data) => {
        if (cancelled) return;
        const parsed = parseMeLikesListEnvelope(data);
        if (parsed.kind === "invalid") {
          setListLoadError(t("community_me_likes_list_contract_error"));
          setApiPosts([]);
          setPartialHint(null);
          setLikesSourcePostIdCount(0);
          setLoading(false);
          return;
        }
        const ids = parsed.value;
        setLikesSourcePostIdCount(ids.length);
        if (ids.length === 0) {
          setApiPosts([]);
          setLoading(false);
          return;
        }
        return allSettledInChunks(ids, COMMUNITY_ME_POST_DETAIL_FETCH_CONCURRENCY, (postId) => getPostById(postId)).then(
          (results) => {
            if (cancelled) return;
            const posts: CommunityPost[] = [];
            let failedOrMissing = 0;
            let firstReject: unknown = null;
            results.forEach((r) => {
              if (r.status === "rejected") {
                failedOrMissing += 1;
                if (firstReject == null) firstReject = r.reason;
                return;
              }
              const p = r.value.post;
              if (p) posts.push(mapApiPostToCommunityPost({ ...p, like_count: p.like_count }));
              else failedOrMissing += 1;
            });
            if (posts.length === 0) {
              setApiPosts([]);
              const explainAllMissing = t("community_me_likes_all_posts_unavailable", {
                n: String(ids.length),
              });
              setListLoadError(
                firstReject != null
                  ? `${explainAllMissing} ${mapApiReadError(firstReject, t, "community_me_likes_loadFailed")}`
                  : explainAllMissing,
              );
              setPartialHint(null);
              return;
            }
            setApiPosts(posts);
            setListLoadError(null);
            if (failedOrMissing > 0) {
              setPartialHint(
                t("community_me_likes_partial_load_hint", { n: failedOrMissing }),
              );
            }
          },
        )
          .catch((err) => {
            if (!cancelled) {
              if (typeof window !== "undefined") {
                console.error("CommunityMeLikes getPostById batch:", err);
              }
              setListLoadError(mapApiReadError(err, t, "community_me_likes_loadFailed"));
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
            console.error("CommunityMeLikes getMeLikes:", err);
          }
          setListLoadError(mapApiReadError(err, t, "community_me_likes_loadFailed"));
          setApiPosts([]);
          setLikesSourcePostIdCount(0);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [likesFeatureOn, likesRetryKey, t, isLoggedIn, authPending]);

  const likedPosts = apiPosts;
  const likedPostsForGrid = useMemo(() => applyPinOrder(likedPosts, (p) => p.id, pinOrder), [likedPosts, pinOrder]);
  const likesListState = useMemo(() => {
    if (!likesFeatureOn) {
      return dataStateInvalid(t("community_me_likes_feature_disabled_hint"));
    }
    const base = deriveListDataState({ loading, error: listLoadError, items: likedPostsForGrid });
    /** 与「收藏 / 社区帖子」抽屉一致：空列表仍走 success，便于一行三格 + 下方空态（非整卡 empty 分支） */
    if (!loading && !listLoadError && likedPostsForGrid.length === 0) {
      return dataStateSuccess(likedPostsForGrid);
    }
    return base;
  }, [likesFeatureOn, loading, listLoadError, likedPostsForGrid, t]);

  const postsForLikeSync = useMemo(
    () =>
      likedPosts.map((p) => ({
        id: p.id,
        likedByMe: true,
        collectedByMe: p.collectedByMe,
      })),
    [likedPosts]
  );

  const { handleLike, likedIds, interactionToast } = useCommunityPostLikeCollect(
    t,
    likesFeatureOn && isLoggedIn
      ? {
          postsForLikeSync,
          onLikeResolved: (postId, nowLiked) => {
            if (!nowLiked) {
              setApiPosts((prev) => prev.filter((p) => p.id !== postId));
            }
          },
        }
      : undefined
  );

  const openLikedPost = useCallback(
    (p: CommunityPost) => {
      router.push(`/community/post/${encodeURIComponent(p.id)}`);
      onLeaveDrawer?.();
    },
    [router, onLeaveDrawer]
  );

  if (!likesFeatureOn) {
    return (
      <div className={drawerShellClass} role="region" aria-label={t("community_me_likes_title")}>
        <CommunityMeDataStateSurface
          state={dataStateInvalid(t("community_me_likes_feature_disabled_hint"))}
          t={t}
          analyticsSurface="community_me_likes_list"
          emptySlot={<></>}
          invalidSlot={
            <section
              className="rounded-[var(--radius-md)] border border-dashed border-warning/35 bg-ink-800/50 px-5 py-8 text-center space-y-4"
              role="region"
              aria-label={t("community_me_likes_feature_disabled_title")}
            >
              <p className="text-body text-slate-200">{t("community_me_likes_feature_disabled_body")}</p>
              <Link
                href="/community/me"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-200 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
              >
                {t("me_title")}
              </Link>
            </section>
          }
          success={() => null}
        />
      </div>
    );
  }

  if (!isLoggedIn && !authPending) {
    return (
      <div className={drawerShellClass} role="region" aria-label={t("community_me_likes_title")}>
        <section
          data-tt-community-me-surface="community_me_likes_auth_gate"
          data-tt-data-state="invalid"
          className="rounded-[var(--radius-md)] border border-cyan-500/35 bg-ink-800/70 backdrop-blur-md px-6 py-10 text-center space-y-4"
          role="region"
        >
          <p className="text-body text-slate-200">{t("community_me_likes_login_required")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent(loginReturnPath)}`}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-5 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
          >
            {t("community_activity_go_login")}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className={drawerShellClass} role="region" aria-label={t("community_me_likes_title")}>
        <div className="space-y-4 pb-2">
          {partialHint ? (
            <p className="rounded-[var(--radius-md)] border border-warning/35 bg-warning/25 px-3 py-2 text-meta text-white/95" role="status">
              {partialHint}
            </p>
          ) : null}
          <CommunityMeDataStateSurface
            state={likesListState}
            t={t}
            analyticsSurface="community_me_likes_list"
            onRetry={() => setLikesRetryKey((k) => k + 1)}
            loadingSlot={<CommunityMeDrawerGridLoadingSkeleton ariaLabel={t("community_me_likes_title")} />}
            emptySlot={<></>}
            success={(items) => (
              <div
                className={
                  items.length === 0
                    ? "space-y-4 rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-ink-800/45 px-4 py-5 sm:px-5"
                    : "space-y-2"
                }
              >
                <CommunityMeNotesPostThumbGrid
                  posts={items}
                  t={t}
                  listAriaLabel={t("community_me_likes_title")}
                  minEmptySlots={items.length === 0 ? 3 : 0}
                  onOpenPost={(p) => openLikedPost(p)}
                  cardMenu={{
                    onDelete: (postId) => {
                      void handleLike(postId);
                    },
                    onPinToTop: (postId) => setPinOrder((prev) => [postId, ...prev.filter((x) => x !== postId)]),
                  }}
                />
                {items.length === 0 ? <MeLikesEmptyPanel t={t} /> : null}
              </div>
            )}
          />
          {likesListState.kind === "success" && likesSourcePostIdCount >= COMMUNITY_ME_DRAWER_LIST_ID_CAP ? (
            <p className="px-1 pt-1 text-[0.7rem] leading-snug text-white/75 sm:text-meta">{t("community_me_likes_list_cap_hint")}</p>
          ) : null}
        </div>
      </div>
      {interactionToast ? (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-ink-800/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {interactionToast}
        </div>
      ) : null}
    </>
  );
}
