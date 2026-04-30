"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { getMeCollects, getPostById } from "@/lib/apiClient/community";
import { mapApiPostToCommunityPost } from "@/components/community/useCommunityFeed";
import type { CommunityPost } from "@/lib/communityPostTypes";
import { useCommunityPostLikeCollect } from "@/components/community/useCommunityPostLikeCollect";
import { communityCyanPillFocus, communityFuchsiaPillFocus } from "@/lib/communityA11yFocus";
import { useState, useEffect, useMemo, useCallback } from "react";
import { applyPinOrder } from "@/lib/communityMeNotesPinOrder";
import CommunityMeDataStateSurface from "@/components/me/CommunityMeDataStateSurface";
import { CommunityMeDrawerGridLoadingSkeleton } from "@/components/me/communityMeNotes/CommunityMeDrawerGridLoadingSkeleton";
import { CommunityMeNotesPostThumbGrid } from "@/components/me/communityMeNotes/CommunityMeNotesPostThumbGrid";
import { dataStateSuccess, deriveListDataState } from "@/lib/dataState";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { communityMeLoginReturnUrl } from "@/lib/communityMeContentNav";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { allSettledInChunks, COMMUNITY_ME_POST_DETAIL_FETCH_CONCURRENCY } from "@/lib/allSettledInChunks";
import { parseMeCollectsListEnvelope } from "@/lib/communityMeDrawerListContracts";
import { COMMUNITY_ME_DRAWER_LIST_ID_CAP } from "@/lib/communityMeDrawerListCaps";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";

/** 88 §3.2：收藏空态文案与 CTA（置于一行三格下方，与外框同壳，与「赞过」弹层结构对齐） */
function MeCollectsEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-4 text-center" role="region" aria-label={t("community_collects_empty")}>
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

export type CommunityMeCollectsExperienceProps = {
  /** 从个人中心玻璃弹层打开时传入：进入帖子深链后关闭弹层 */
  onLeaveDrawer?: () => void;
};

/**
 * 我的收藏：仅用于个人中心弹层；点击缩略图进入帖子（`/community/post/:id` → Feed 深链）。
 * 无独立列表页——与「赞过」弹层同构的方格预览 + 收藏开关。
 */
export function CommunityMeCollectsExperience({ onLeaveDrawer }: CommunityMeCollectsExperienceProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginReturnPath = useMemo(
    () => communityMeLoginReturnUrl(pathname, searchParams, "collects"),
    [pathname, searchParams],
  );
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const [apiPosts, setApiPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoadError, setListLoadError] = useState<string | null>(null);
  const [partialHint, setPartialHint] = useState<string | null>(null);
  const [collectsRetryKey, setCollectsRetryKey] = useState(0);
  const [pinOrder, setPinOrder] = useState<string[]>([]);
  /** `GET …/me/collects` 解析后的 `post_id` 条数（用于与后端 LIST_LIMIT 对齐的上限提示） */
  const [collectsSourcePostIdCount, setCollectsSourcePostIdCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || authPending) {
      if (!isLoggedIn && !authPending) {
        setLoading(false);
        setListLoadError(null);
        setPartialHint(null);
        setApiPosts([]);
        setCollectsSourcePostIdCount(0);
        setPinOrder([]);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    setListLoadError(null);
    setPartialHint(null);
    setCollectsSourcePostIdCount(0);
    getMeCollects()
      .then((data) => {
        if (cancelled) return;
        const parsed = parseMeCollectsListEnvelope(data);
        if (parsed.kind === "invalid") {
          setListLoadError(t("community_me_collects_list_contract_error"));
          setApiPosts([]);
          setPartialHint(null);
          setCollectsSourcePostIdCount(0);
          setLoading(false);
          return;
        }
        const ids = parsed.value;
        setCollectsSourcePostIdCount(ids.length);
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
              const explainAllMissing = t("community_me_collects_all_posts_unavailable", {
                n: String(ids.length),
              });
              setListLoadError(
                firstReject != null
                  ? `${explainAllMissing} ${mapApiReadError(firstReject, t, "community_me_collects_loadFailed")}`
                  : explainAllMissing,
              );
              setPartialHint(null);
              return;
            }
            setApiPosts(posts);
            setListLoadError(null);
            if (failedOrMissing > 0) {
              setPartialHint(
                t("community_me_collects_partial_load_hint", { n: failedOrMissing }),
              );
            }
          },
        )
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
          setCollectsSourcePostIdCount(0);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [collectsRetryKey, t, isLoggedIn, authPending]);

  const collectedPosts = apiPosts;
  const collectedPostsForGrid = useMemo(
    () => applyPinOrder(collectedPosts, (p) => p.id, pinOrder),
    [collectedPosts, pinOrder],
  );
  const collectsListState = useMemo(() => {
    const base = deriveListDataState({ loading, error: listLoadError, items: collectedPostsForGrid });
    /** 与「赞过」一致：空列表仍走 success，便于渲染一行三格 + 空态说明（非整页替换为单块 empty） */
    if (!loading && !listLoadError && collectedPostsForGrid.length === 0) {
      return dataStateSuccess(collectedPostsForGrid);
    }
    return base;
  }, [loading, listLoadError, collectedPostsForGrid]);
  const collectedIdList = useMemo(() => collectedPosts.map((p) => p.id), [collectedPosts]);

  const postsForLikeSync = useMemo(
    () =>
      collectedPosts.map((p) => ({
        id: p.id,
        likedByMe: p.likedByMe,
        collectedByMe: p.collectedByMe ?? true,
      })),
    [collectedPosts]
  );

  const { handleCollect, interactionToast } = useCommunityPostLikeCollect(t, {
    initialCollectedIds: collectedIdList,
    postsForLikeSync,
    onCollectResolved: (postId, nowCollected) => {
      if (!nowCollected) {
        setApiPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    },
  });

  const openCollectedPost = useCallback(
    (p: CommunityPost) => {
      router.push(`/community/post/${encodeURIComponent(p.id)}`);
      onLeaveDrawer?.();
    },
    [router, onLeaveDrawer]
  );

  if (!isLoggedIn && !authPending) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" role="region" aria-label={t("community_me_my_collects")}>
        <section
          data-tt-community-me-surface="community_me_collects_auth_gate"
          data-tt-data-state="invalid"
          className="rounded-[var(--radius-md)] border border-cyan-500/35 bg-ink-800/70 backdrop-blur-md px-6 py-10 text-center space-y-4"
          role="region"
        >
          <p className="text-body text-slate-200">{t("community_me_collects_login_required")}</p>
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" role="region" aria-label={t("community_me_my_collects")}>
        <div className="space-y-4 pb-2">
          {partialHint ? (
            <p className="rounded-[var(--radius-md)] border border-warning/35 bg-warning/25 px-3 py-2 text-meta text-white/95" role="status">
              {partialHint}
            </p>
          ) : null}
          <CommunityMeDataStateSurface
            state={collectsListState}
            t={t}
            analyticsSurface="community_me_collects_list"
            onRetry={() => setCollectsRetryKey((k) => k + 1)}
            loadingSlot={<CommunityMeDrawerGridLoadingSkeleton ariaLabel={t("community_me_my_collects")} />}
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
                  listAriaLabel={t("community_me_my_collects")}
                  minEmptySlots={items.length === 0 ? 3 : 0}
                  onOpenPost={(p) => openCollectedPost(p)}
                  cardMenu={{
                    onDelete: (postId) => {
                      void handleCollect(postId);
                    },
                    onPinToTop: (postId) => setPinOrder((prev) => [postId, ...prev.filter((x) => x !== postId)]),
                  }}
                />
                {items.length === 0 ? <MeCollectsEmptyPanel t={t} /> : null}
              </div>
            )}
          />
          {collectsListState.kind === "success" && collectsSourcePostIdCount >= COMMUNITY_ME_DRAWER_LIST_ID_CAP ? (
            <p className="px-1 pt-1 text-[0.7rem] leading-snug text-white/75 sm:text-meta">{t("community_me_collects_list_cap_hint")}</p>
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
