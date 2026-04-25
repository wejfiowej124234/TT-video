"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { getMeFollowing, getMeFollowers, getFriendsList, getMeLikesReceived } from "@/lib/apiClient/community";
import CommunityMeAccountPanel, { type CommunityMeNotesPanel } from "@/components/me/CommunityMeAccountPanel";
import MePageFooter from "@/components/me/MePageFooter";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import {
  communityMeCollectsPathActive,
  communityMeContentSegmentClass,
  communityMeLikesPathActive,
  communityMeOrdersPathActive,
  communityMePostsPathActive,
  parseCommunityMeTabQuery,
} from "@/lib/communityMeContentNav";
import { parseCommunityMeLikesReceivedResponse } from "@/lib/communityMeLikesReceivedContract";
import { countCommunityMeSocialList } from "@/lib/communityMeSocialListsContract";
import { deriveAuthGateDataState, deriveCommunitySocialStatsDataState } from "@/lib/dataState";
import { trackCommunityMeDataStateRender } from "@/lib/analytics";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { CommunityMeNotesGlassDrawer } from "@/components/me/communityMeNotes/CommunityMeNotesGlassDrawer";
import { CommunityMeLikesExperience } from "@/components/me/communityMeNotes/CommunityMeLikesExperience";
import { CommunityMeCollectsExperience } from "@/components/me/communityMeNotes/CommunityMeCollectsExperience";
import { CommunityMePostsExperience } from "@/components/me/communityMeNotes/CommunityMePostsExperience";
import { CommunityMeOrdersDrawerPreview } from "@/components/me/communityMeNotes/CommunityMeOrdersDrawerPreview";
import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";

const STATS_STALE_MS = 60_000;

/** 31 附录 / 51-31-19：潮流社区 · 我的；社交统计 API + React Query；`getMeFull` 仅由 `CommunityMeAccountPanel` 内 `useMePage` 拉取（避免重复）。 */
function CommunityMePageInner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isLoggedIn, isLoading: authLoading } = useCommunityAuth();
  const [notesPanel, setNotesPanel] = useState<CommunityMeNotesPanel | null>(null);
  const [likesListEnvDisabledNotice, setLikesListEnvDisabledNotice] = useState(false);

  const likesListEnabled = isCommunityMeLikesListEnabled();
  const socialQueriesEnabled = !authLoading && isLoggedIn;

  const closeNotes = useCallback(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    if (!sp.has("tab")) return;
    sp.delete("tab");
    const qs = sp.toString();
    router.replace(qs ? `/community/me?${qs}` : "/community/me", { scroll: false });
  }, [router, searchParams]);

  /** 仅更新 URL；`notesPanel` 由下方 `useEffect` 与 `urlTab` 对齐，避免 replace 与 setState 竞态。 */
  const openNotesPanel = useCallback(
    (panel: CommunityMeNotesPanel) => {
      const sp = new URLSearchParams(searchParams?.toString() ?? "");
      sp.set("tab", panel);
      router.replace(`/community/me?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [a, b, c, likesQ] = useQueries({
    queries: [
      {
        queryKey: ["community", "meFollowing"],
        queryFn: getMeFollowing,
        staleTime: STATS_STALE_MS,
        enabled: socialQueriesEnabled,
      },
      {
        queryKey: ["community", "meFollowers"],
        queryFn: getMeFollowers,
        staleTime: STATS_STALE_MS,
        enabled: socialQueriesEnabled,
      },
      {
        queryKey: ["community", "friendsList"],
        queryFn: getFriendsList,
        staleTime: STATS_STALE_MS,
        enabled: socialQueriesEnabled,
      },
      {
        queryKey: ["community", "meLikesReceived"],
        queryFn: getMeLikesReceived,
        staleTime: STATS_STALE_MS,
        enabled: socialQueriesEnabled && likesListEnabled,
      },
    ],
  });

  const urlTab = useMemo(
    () => parseCommunityMeTabQuery(pathname, searchParams),
    [pathname, searchParams],
  );

  /** 与 `/orders?state=` 同源：剔除无法识别的 `tab=`，避免书签/投放参数误导 IA */
  useEffect(() => {
    if (pathname !== "/community/me") return;
    const raw = (searchParams.get("tab") ?? "").trim();
    if (!raw) return;
    if (parseCommunityMeTabQuery(pathname, searchParams) != null) return;
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    sp.delete("tab");
    const qs = sp.toString();
    router.replace(qs ? `/community/me?${qs}` : "/community/me", { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (urlTab === "likes" && !isCommunityMeLikesListEnabled()) {
      setLikesListEnvDisabledNotice(true);
      const sp = new URLSearchParams(searchParams?.toString() ?? "");
      sp.delete("tab");
      const qs = sp.toString();
      router.replace(qs ? `/community/me?${qs}` : "/community/me", { scroll: false });
      return;
    }
    setNotesPanel(urlTab);
  }, [urlTab, router, searchParams]);

  const likesSettled =
    !likesListEnabled || likesQ.isSuccess || likesQ.isError;
  const socialSettled =
    socialQueriesEnabled &&
    (a.isSuccess || a.isError) &&
    (b.isSuccess || b.isError) &&
    (c.isSuccess || c.isError) &&
    likesSettled;

  const nWatched = likesListEnabled ? 4 : 3;
  let socialQueryErrorCount = 0;
  if (a.isError) socialQueryErrorCount += 1;
  if (b.isError) socialQueryErrorCount += 1;
  if (c.isError) socialQueryErrorCount += 1;
  if (likesListEnabled && likesQ.isError) socialQueryErrorCount += 1;

  const socialStatsFatalError = socialSettled && socialQueryErrorCount === nWatched;
  const socialStatsPartialFailure =
    socialSettled && socialQueryErrorCount > 0 && socialQueryErrorCount < nWatched;

  const socialStatsReady = socialSettled && !socialStatsFatalError;

  const statsLoading =
    socialQueriesEnabled && !socialStatsFatalError && !socialSettled;

  const refetchSocialStats = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["community", "meFollowing"] });
    void queryClient.invalidateQueries({ queryKey: ["community", "meFollowers"] });
    void queryClient.invalidateQueries({ queryKey: ["community", "friendsList"] });
    if (likesListEnabled) {
      void queryClient.invalidateQueries({ queryKey: ["community", "meLikesReceived"] });
    }
  }, [likesListEnabled, queryClient]);

  const followingParsed =
    a.isSuccess && a.data != null ? countCommunityMeSocialList(a.data, "following") : null;
  const followersParsed =
    b.isSuccess && b.data != null ? countCommunityMeSocialList(b.data, "followers") : null;
  const friendsParsed = c.isSuccess && c.data != null ? countCommunityMeSocialList(c.data, "friends") : null;
  const followingCount = followingParsed?.kind === "ok" ? followingParsed.n : 0;
  const followersCount = followersParsed?.kind === "ok" ? followersParsed.n : 0;
  const friendsCount = friendsParsed?.kind === "ok" ? friendsParsed.n : 0;
  const followingCountUnknown = Boolean(a.isSuccess && a.data != null && followingParsed?.kind === "invalid");
  const followersCountUnknown = Boolean(b.isSuccess && b.data != null && followersParsed?.kind === "invalid");
  const friendsCountUnknown = Boolean(c.isSuccess && c.data != null && friendsParsed?.kind === "invalid");

  const likesParse =
    likesListEnabled && likesQ.isSuccess && likesQ.data != null
      ? parseCommunityMeLikesReceivedResponse(likesQ.data)
      : null;
  const likesReceivedUnknown =
    Boolean(likesListEnabled && likesQ.isSuccess && likesParse?.kind === "invalid");
  const likesReceived =
    likesListEnabled && likesParse?.kind === "ok" ? likesParse.n : 0;

  const socialStripState = useMemo(
    () =>
      deriveCommunitySocialStatsDataState({
        statsLoading,
        statsError: socialStatsFatalError,
        partialFailure: socialStatsPartialFailure,
        likesReceivedUnknown,
        followingCountUnknown,
        followersCountUnknown,
        friendsCountUnknown,
        socialStatsReady,
        followingCount,
        followersCount,
        friendsCount,
        likesReceived,
        errorMessage: t("community_me_social_stats_error"),
        contractInvalidMessage: t("community_errorTitle"),
        includeLikesReceivedMetric: likesListEnabled,
      }),
    [
      statsLoading,
      socialStatsFatalError,
      socialStatsPartialFailure,
      likesReceivedUnknown,
      followingCountUnknown,
      followersCountUnknown,
      friendsCountUnknown,
      socialStatsReady,
      followingCount,
      followersCount,
      friendsCount,
      likesReceived,
      likesListEnabled,
      t,
    ]
  );

  const showMeSections = isLoggedIn && !authLoading;
  const authSurface = useMemo(() => deriveAuthGateDataState(authLoading, isLoggedIn), [authLoading, isLoggedIn]);
  const lastAuthSig = useRef("");
  useEffect(() => {
    const sig = `community_me_auth_gate::${authSurface.kind}`;
    if (lastAuthSig.current === sig) return;
    lastAuthSig.current = sig;
    trackCommunityMeDataStateRender("community_me_auth_gate", authSurface.kind, {
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  }, [authSurface.kind]);
  const guestLikesActive =
    communityMeLikesPathActive(pathname, searchParams) || notesPanel === "likes";
  const guestCollectsActive =
    communityMeCollectsPathActive(pathname, searchParams) || notesPanel === "collects";
  /** 访客分段：「社区帖子」Tab（UGC 橱窗），勿与市场 listing /「我的产品」语义混用 */
  const guestCommunityPostsActive =
    communityMePostsPathActive(pathname, searchParams) || notesPanel === "posts";
  const guestOrdersActive =
    communityMeOrdersPathActive(pathname, searchParams) || notesPanel === "orders";
  const showLikesTab = likesListEnabled;
  const segmentGridClass = showLikesTab
    ? "grid-cols-2 sm:grid-cols-4"
    : "grid-cols-3";

  /** 访客点「去登录」：若已在个人中心且带 `?tab=` 等 query，登录后须回到同一深链（与弹层内 returnUrl 一致）。 */
  const communityMeGuestLoginReturnUrl = useMemo(() => {
    if (pathname !== "/community/me") return "/community/me";
    const qs = searchParams?.toString() ?? "";
    return qs ? `/community/me?${qs}` : "/community/me";
  }, [pathname, searchParams]);

  return (
    <main
      className="max-w-3xl mx-auto px-3 py-3 sm:px-4 sm:py-4 pb-24 safe-area-pb text-slate-200 space-y-3"
      aria-label={t("me_title")}
    >
      {authSurface.kind === "invalid" ? (
        <section
          data-tt-community-me-surface="community_me_auth_gate"
          data-tt-data-state="invalid"
          className="rounded-[var(--radius-md)] border border-cyan-400/35 bg-ink-800/60 backdrop-blur-md px-4 py-5 text-center shadow-scifi-banner ring-1 ring-white/5"
        >
          <p className="text-meta sm:text-body text-slate-400 mb-3 leading-snug">{t("community_me_login_prompt")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent(communityMeGuestLoginReturnUrl)}`}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-5 py-2.5 text-meta font-medium text-cyan-200 transition-colors hover:bg-cyan-500/30 motion-reduce:transition-none ${communityCardLinkFocus}`}
          >
            {t("me_goLogin")}
          </Link>
        </section>
      ) : null}

      {likesListEnvDisabledNotice ? (
        <div
          role="status"
          className="rounded-[var(--radius-md)] border border-warning/40 bg-warning/35 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ring-1 ring-warning/15"
        >
          <p className="text-meta text-white/95 leading-snug">{t("community_me_likes_list_disabled_by_config")}</p>
          <button
            type="button"
            onClick={() => setLikesListEnvDisabledNotice(false)}
            className={`inline-flex self-start sm:self-center shrink-0 min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-warning/45 bg-warning/40 px-3 py-2 text-meta font-medium text-white transition-colors hover:bg-warning/60 motion-sub motion-reduce:transition-none ${communityCardLinkFocus}`}
          >
            {t("common_close")}
          </button>
        </div>
      ) : null}

      <CommunityMeAccountPanel
        t={t}
        enabled={isLoggedIn && !authLoading}
        compactVertical={showMeSections}
        communityStats={{
          socialStrip: socialStripState,
          onSocialStatsRetry: refetchSocialStats,
        }}
        notesPanelOpen={notesPanel}
        onNotesPanelOpen={openNotesPanel}
      />

      {authLoading ? (
        <section
          aria-busy="true"
          aria-label={t("me_loading")}
          className="rounded-[var(--radius-md)] border border-cyan-400/25 bg-ink-800/50 backdrop-blur-md px-3 py-3 shadow-scifi-banner ring-1 ring-white/5"
        >
          <div className="h-11 w-full max-w-md mx-auto rounded-[var(--radius-sm)] bg-ink-600/40 animate-pulse motion-reduce:animate-none" />
        </section>
      ) : null}

      {!showMeSections && !authLoading ? (
        <nav
          className="rounded-[var(--radius-md)] border border-cyan-400/35 bg-ink-800/60 backdrop-blur-md overflow-hidden shadow-scifi-banner ring-1 ring-white/5 p-0.5"
          aria-label={t("community_me_notes_tablist_aria")}
          title={t("community_me_notes_tab_hint")}
        >
          <ul className={`grid list-none p-0 m-0 gap-0.5 text-center ${segmentGridClass}`}>
            {showLikesTab ? (
              <li className="min-w-0">
                <button
                  type="button"
                  className={`w-full ${communityMeContentSegmentClass(guestLikesActive)}`}
                  aria-current={guestLikesActive ? "page" : undefined}
                  onClick={() => openNotesPanel("likes")}
                >
                  {t("community_me_tab_liked")}
                </button>
              </li>
            ) : null}
            <li className="min-w-0">
              <button
                type="button"
                className={`w-full ${communityMeContentSegmentClass(guestCollectsActive)}`}
                aria-current={guestCollectsActive ? "page" : undefined}
                onClick={() => openNotesPanel("collects")}
              >
                {t("community_me_tab_collects")}
              </button>
            </li>
            <li className="min-w-0">
              <button
                type="button"
                className={`w-full ${communityMeContentSegmentClass(guestOrdersActive)}`}
                aria-current={guestOrdersActive ? "page" : undefined}
                onClick={() => openNotesPanel("orders")}
              >
                {t("header_myOrders")}
              </button>
            </li>
            <li className="min-w-0">
              <button
                type="button"
                className={`w-full ${communityMeContentSegmentClass(guestCommunityPostsActive)}`}
                aria-current={guestCommunityPostsActive ? "page" : undefined}
                onClick={() => openNotesPanel("posts")}
              >
                {t("community_me_tab_community_posts")}
              </button>
            </li>
          </ul>
        </nav>
      ) : null}

      <MePageFooter t={t} variant="compact" />

      {notesPanel === "likes" ? (
        <CommunityMeNotesGlassDrawer
          open
          onClose={closeNotes}
          dialogTitle={t("community_me_likes_title")}
          dialogDescription={t("community_me_likes_drawer_intro")}
          t={t}
        >
          <CommunityMeLikesExperience onLeaveDrawer={closeNotes} />
        </CommunityMeNotesGlassDrawer>
      ) : null}

      {notesPanel === "collects" ? (
        <CommunityMeNotesGlassDrawer
          open
          onClose={closeNotes}
          dialogTitle={t("community_me_my_collects")}
          dialogDescription={t("community_me_collects_drawer_intro")}
          t={t}
        >
          <CommunityMeCollectsExperience onLeaveDrawer={closeNotes} />
        </CommunityMeNotesGlassDrawer>
      ) : null}

      {notesPanel === "posts" ? (
        <CommunityMeNotesGlassDrawer
          open
          onClose={closeNotes}
          dialogTitle={t("community_me_tab_community_posts")}
          dialogTitleBadge={t("community_me_posts_scope_badge")}
          dialogDescription={t("community_me_posts_drawer_intro")}
          t={t}
        >
          <CommunityMePostsExperience onLeaveDrawer={closeNotes} />
        </CommunityMeNotesGlassDrawer>
      ) : null}

      {notesPanel === "orders" ? (
        <CommunityMeNotesGlassDrawer
          open
          onClose={closeNotes}
          dialogTitle={t("header_myOrders")}
          dialogDescription={t("community_me_orders_drawer_intro")}
          t={t}
        >
          <CommunityMeOrdersDrawerPreview t={t} onNavigate={closeNotes} />
        </CommunityMeNotesGlassDrawer>
      ) : null}
    </main>
  );
}

export default function CommunityMePage() {
  return (
    <CommunityParamRouteSuspense mainAriaLabelKey="me_title" horizontalPadding="px-3">
      <CommunityMePageInner />
    </CommunityParamRouteSuspense>
  );
}
