"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { deletePost } from "@/lib/apiClient/community";
import { mapApiPostToCommunityPost } from "@/components/community/useCommunityFeed";
import type { CommunityPost } from "@/lib/communityPostTypes";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { messageForCommunityActionResponse } from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { communityCyanPillFocus, communityFuchsiaPillFocus } from "@/lib/communityA11yFocus";
import { CommunityMePostsShowcaseThumbGrid } from "@/components/me/communityMeNotes/CommunityMePostsShowcaseThumbGrid";
import { useState, useCallback, useEffect, useMemo } from "react";
import { applyPinOrder } from "@/lib/communityMeNotesPinOrder";
import {
  fetchAllPostsForCommunityMeDrawer,
  POSTS_SHOWCASE_DRAWER_MAX_ROWS,
} from "@/lib/communityMePostsDrawerFetch";
import { TRAVELTRUST_MY_POSTS_PAGE_CONTRACT_INVALID } from "@/lib/communityMeDrawerListContracts";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { communityMeLoginReturnUrl } from "@/lib/communityMeContentNav";
import CommunityMeDataStateSurface from "@/components/me/CommunityMeDataStateSurface";
import { CommunityMeDrawerGridLoadingSkeleton } from "@/components/me/communityMeNotes/CommunityMeDrawerGridLoadingSkeleton";
import { dataStateSuccess, deriveListDataState } from "@/lib/dataState";

/** 「社区帖子」橱窗抽屉：空列表时置于三格占位下方，与「赞过 / 收藏」弹层结构对齐 */
function CommunityMePostsShowcaseDrawerEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-4 text-center" role="region" aria-label={t("community_me_posts_drawer_preview_empty")}>
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
      <p className="text-body text-slate-200">{t("community_me_posts_drawer_preview_empty")}</p>
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
        <Link
          href="/community?publish=1"
          prefetch={false}
          className={`rounded-full border border-cyan-400/40 bg-ink-700/70 px-4 py-2 text-meta font-medium text-cyan-200 hover:bg-ink-600/80 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityCyanPillFocus}`}
        >
          {t("community_me_posts_link_publish")}
        </Link>
      </div>
    </div>
  );
}

export type CommunityMePostsExperienceProps = {
  /** 弹层内点帖子进入 `/community/post/:id` 后关闭玻璃抽屉 */
  onLeaveDrawer?: () => void;
};

/**
 * 31 附录 / 51-31-19：社区帖子列表仅 API；仅用于 `/community/me` 玻璃抽屉（无 `shell=page` 分支）。
 * 独立 `/community/me/posts` 已重定向至 `?tab=posts`。
 */
export function CommunityMePostsExperience({ onLeaveDrawer }: CommunityMePostsExperienceProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginReturnPath = useMemo(
    () => communityMeLoginReturnUrl(pathname, searchParams, "posts"),
    [pathname, searchParams],
  );
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const [apiPosts, setApiPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoadError, setPostsLoadError] = useState<string | null>(null);
  const [postsRetryKey, setPostsRetryKey] = useState(0);
  const [postsTruncated, setPostsTruncated] = useState(false);
  const [postPinOrder, setPostPinOrder] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoggedIn || authPending) {
      if (!isLoggedIn && !authPending) {
        setLoading(false);
        setPostsLoadError(null);
        setPostsTruncated(false);
        setApiPosts([]);
        setPostPinOrder([]);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    setPostsLoadError(null);
    setPostsTruncated(false);
    fetchAllPostsForCommunityMeDrawer("all")
      .then(({ posts: list, truncated }) => {
        if (cancelled) return;
        setPostsTruncated(truncated);
        setApiPosts(list.map((p) => mapApiPostToCommunityPost(p)));
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("CommunityMePosts fetchAllPostsForCommunityMeDrawer:", err);
          }
          setPostsTruncated(false);
          const msg =
            err instanceof Error && err.message === TRAVELTRUST_MY_POSTS_PAGE_CONTRACT_INVALID
              ? t("community_me_posts_page_contract_error")
              : mapApiReadError(err, t, "community_me_posts_loadFailed");
          setPostsLoadError(msg);
          setApiPosts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postsRetryKey, t, isLoggedIn, authPending]);

  const myPosts = apiPosts;
  const postsForGrid = useMemo(() => applyPinOrder(myPosts, (p) => p.id, postPinOrder), [myPosts, postPinOrder]);

  const postsListState = useMemo(() => {
    const base = deriveListDataState({ loading, error: postsLoadError, items: postsForGrid });
    /** 空列表仍走 success([])，才能渲染「一行三槽」+ `CommunityMePostsShowcaseDrawerEmptyPanel`（`CommunityMeDataStateSurface` 的 `empty` 分支因此永不触发） */
    if (base.kind === "empty") return dataStateSuccess(postsForGrid);
    return base;
  }, [loading, postsLoadError, postsForGrid]);

  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        setDeleteError(null);
        setApiPosts((prev) => prev.filter((p) => p.id !== postId));
        setPostPinOrder((prev) => prev.filter((x) => x !== postId));
      } catch (err) {
        if (typeof window !== "undefined") {
          console.error("CommunityMePostsExperience deletePost:", err);
        }
        setDeleteError(mapApiReadError(err, t, "community_delete_post_failed"));
      } finally {
        setDeleteBusyId(null);
      }
    },
    [t],
  );

  const confirmDeletePost = useCallback(
    (postId: string) => {
      if (!window.confirm(t("community_delete_post_confirm"))) return;
      void performDeletePost(postId);
    },
    [t, performDeletePost],
  );

  const drawerRootClass = "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

  if (!isLoggedIn && !authPending) {
    return (
      <div className={drawerRootClass} role="region" aria-label={t("community_me_tab_community_posts")}>
        <section
          data-tt-community-me-surface="community_me_posts_auth_gate"
          data-tt-data-state="invalid"
          className="rounded-[var(--radius-md)] border border-cyan-500/35 bg-ink-800/70 backdrop-blur-md px-6 py-10 text-center space-y-4"
          role="region"
        >
          <p className="text-body text-slate-200">{t("community_me_posts_login_required")}</p>
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
    <div className={drawerRootClass} role="region" aria-label={t("community_me_tab_community_posts")}>
      {deleteError ? (
        <div className="mb-4">
          <ApiErrorAlert message={deleteError} />
        </div>
      ) : null}

      <div className="space-y-4 pb-2">
        {postsTruncated ? (
          <div
            className="rounded-[var(--radius-md)] border border-warning/35 bg-warning/25 px-3 py-2 space-y-2"
            role="status"
          >
            <p className="text-meta text-white/95 leading-snug">
              {t("community_me_posts_drawer_truncated_hint", { maxPosts: String(POSTS_SHOWCASE_DRAWER_MAX_ROWS) })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/community"
                prefetch={false}
                onClick={() => onLeaveDrawer?.()}
                className={`inline-flex min-h-[40px] items-center justify-center rounded-full border border-cyan-400/45 bg-cyan-500/15 px-3 py-1.5 text-[0.7rem] font-medium text-cyan-100 hover:bg-cyan-500/25 motion-sub ${communityCyanPillFocus}`}
              >
                {t("community_tab_feed")}
              </Link>
              <Link
                href="/community/explore"
                prefetch={false}
                onClick={() => onLeaveDrawer?.()}
                className={`inline-flex min-h-[40px] items-center justify-center rounded-full border border-fuchsia-400/40 bg-fuchsia-500/12 px-3 py-1.5 text-[0.7rem] font-medium text-fuchsia-100 hover:bg-fuchsia-500/22 motion-sub ${communityFuchsiaPillFocus}`}
              >
                {t("community_explore_title")}
              </Link>
            </div>
          </div>
        ) : null}
        <CommunityMeDataStateSurface
          state={postsListState}
          t={t}
          analyticsSurface="community_me_posts_list"
          onRetry={() => setPostsRetryKey((k) => k + 1)}
          loadingSlot={<CommunityMeDrawerGridLoadingSkeleton ariaLabel={t("community_me_tab_community_posts")} />}
          emptySlot={null}
          success={(items) => {
            const drawerEmpty = items.length === 0;
            return (
              <div
                className={
                  drawerEmpty
                    ? "space-y-4 rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-ink-800/45 px-4 py-5 sm:px-5"
                    : "contents"
                }
              >
                <CommunityMePostsShowcaseThumbGrid
                  posts={items}
                  t={t}
                  onOpenPost={(p) => {
                    router.push(`/community/post/${encodeURIComponent(p.id)}`);
                    onLeaveDrawer?.();
                  }}
                  onRequestDelete={(postId) => confirmDeletePost(postId)}
                  onPinToTop={(postId) => setPostPinOrder((prev) => [postId, ...prev.filter((x) => x !== postId)])}
                  deleteBusyId={deleteBusyId}
                  listAriaLabel={t("community_me_tab_community_posts")}
                  minSlots={3}
                  allowDelete
                />
                {drawerEmpty ? <CommunityMePostsShowcaseDrawerEmptyPanel t={t} /> : null}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
