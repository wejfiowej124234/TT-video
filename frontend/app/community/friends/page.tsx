"use client";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import {
  postFriendsRequest,
  postFriendsAccept,
  postFriendsReject,
  deleteUserFollow,
} from "@/lib/apiClient/community";
import type { CommunityUserItem } from "@/lib/communityMockData";
import { CommunityFriendsListSkeleton } from "@/components/community/CommunityFriendsListSkeleton";
import { communityStoredRolePillClassName } from "@/components/community/communityFeedMappers";
import { mapApiUserRoleToCommunity } from "@/components/community/communityFeedMappersRoleAndMedia";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { messageForCommunityActionResponse } from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  CommunityRelationalShowcaseHonestyNote,
  communityRelationalShowcaseDataAttr,
} from "@/components/community/CommunityRelationalShowcaseHonestyNote";
import { isShowcaseAuthorId } from "@/lib/communityShowcase";
import {
  communityAvatarLinkFocus,
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityShellTabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";
import {
  useCommunityFriendsPageData,
  type FriendsTab,
} from "./useCommunityFriendsPageData";

/** 88 §3.2：好友申请子 Tab 空态 — 虚线框 + 说明 + Feed/发现 CTA（与探索页结构化空态同口径） */
function FriendsRequestsEmptyPanel({
  variant,
  t,
}: {
  variant: "sent" | "received";
  t: (k: string) => string;
}) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-ref-sun/30 bg-slate-900/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={variant === "sent" ? t("community_requests_sent_empty") : t("community_requests_empty")}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-ref-sun/28 bg-ref-sun/10 text-ref-sun"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.48-3.987M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">
        {variant === "sent" ? t("community_requests_sent_empty") : t("community_requests_empty")}
      </p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">
        {variant === "sent"
          ? t("community_friends_requests_empty_hint_sent")
          : t("community_friends_requests_empty_hint_received")}
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link
          href="/community"
          className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
        >
          {t("community_tab_feed")}
        </Link>
        <Link
          href="/community/explore"
          className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}
        >
          {t("community_explore_title")}
        </Link>
      </div>
    </div>
  );
}

const FRIENDS_TABS: FriendsTab[] = ["following", "followers", "friends", "requests"];

/** 31 附录 / 51-31-7：潮流社区 · 关注/粉丝/好友 + 好友申请；数据仅来自 API */
function CommunityFriendsPageInner() {
  const { t } = useTranslation();
  const { isLoggedIn, isLoading: authLoading } = useCommunityAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<FriendsTab>("following");
  const [requestSubTab, setRequestSubTab] = useState<"sent" | "received">("sent");
  const [unfollowed, setUnfollowed] = useState<Set<string>>(new Set());
  const [addRequestSent, setAddRequestSent] = useState<Set<string>>(new Set());
  const [addRequestPendingId, setAddRequestPendingId] = useState<string | null>(null);
  const [unfollowPendingId, setUnfollowPendingId] = useState<string | null>(null);

  const [retryKey, setRetryKey] = useState(0);

  const {
    apiFollowing,
    apiFollowers,
    apiFriends,
    apiRequestsReceived,
    apiRequestsSent,
    convByPeer,
    loading,
    loadError,
    setApiRequestsReceived,
  } = useCommunityFriendsPageData({
    tab,
    retryKey,
    t,
    isLoggedIn,
    authLoading,
  });

  useEffect(() => {
    const raw = searchParams.get("tab")?.trim().toLowerCase();
    if (raw && (FRIENDS_TABS as readonly string[]).includes(raw)) {
      setTab(raw as FriendsTab);
    }
  }, [searchParams]);

  const selectTab = useCallback(
    (key: FriendsTab) => {
      setTab(key);
      router.replace(`/community/friends?tab=${key}`, { scroll: false });
    },
    [router]
  );

  const retryLoad = useCallback(() => setRetryKey((k) => k + 1), []);
  /** 已本地化全文（含 API `message` 映射），直接渲染 */
  const [friendsToastText, setFriendsToastText] = useState<string | null>(null);
  const friendsToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFriendsToast = useCallback((text: string) => {
    if (friendsToastTimerRef.current) clearTimeout(friendsToastTimerRef.current);
    setFriendsToastText(text);
    friendsToastTimerRef.current = setTimeout(() => {
      friendsToastTimerRef.current = null;
      setFriendsToastText(null);
    }, 3200);
  }, []);

  const showFriendsActionError = useCallback(
    (res: unknown, fallbackKey: string) => {
      showFriendsToast(messageForCommunityActionResponse(res, t, fallbackKey));
    },
    [showFriendsToast, t]
  );

  useEffect(() => () => {
    if (friendsToastTimerRef.current) clearTimeout(friendsToastTimerRef.current);
  }, []);

  const TABS: { key: FriendsTab; keyLabel: string; list: CommunityUserItem[] }[] = [
    { key: "following", keyLabel: "community_friends_following", list: apiFollowing },
    { key: "followers", keyLabel: "community_friends_followers", list: apiFollowers },
    { key: "friends", keyLabel: "community_friends_friends", list: apiFriends },
    { key: "requests", keyLabel: "community_tab_requests", list: [] },
  ];

  const current = TABS.find((x) => x.key === tab)!;
  const list = current.list;
  const followingList = tab === "following" ? list.filter((u) => !unfollowed.has(u.id)) : list;

  const msgHref = (userId: string) => {
    const convId = convByPeer[userId];
    return convId ? `/community/messages/${convId}` : "/community/messages";
  };

  const relationalShowcaseAttr = communityRelationalShowcaseDataAttr();

  return (
    <main
      data-tt-community-friends-page="1"
      {...relationalShowcaseAttr}
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb text-slate-200"
      aria-label={t("community_tab_friends")}
      aria-describedby={
        relationalShowcaseAttr
          ? "community-relational-showcase-hint-community_friends_relational_showcase_hint"
          : undefined
      }
    >
      <header className="mb-4">
        <h1 className={TT_COMMUNITY_PAGE_L5.pageTitle}>
          {t("community_tab_friends")}
        </h1>
        <p className="text-small text-slate-300 mt-0.5">{t("community_friends_desc")}</p>
        <CommunityRelationalShowcaseHonestyNote
          t={t}
          hintKey="community_friends_relational_showcase_hint"
        />
      </header>

      {!authLoading && !isLoggedIn ? (
        <section
          className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-slate-900/70 backdrop-blur-md px-6 py-10 text-center space-y-4 mb-4"
          role="region"
          aria-label={t("community_tab_friends")}
        >
          <p className="text-body text-slate-200">{t("community_friends_login_hint")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent("/community/friends")}`}
            className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
          >
            {t("community_activity_go_login")}
          </Link>
        </section>
      ) : null}

      {loadError != null && !loading && isLoggedIn ? (
        <section
          className="rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 px-6 py-10 text-center space-y-3 mb-4"
          role="alert"
          aria-live="polite"
        >
          <ApiErrorAlert message={loadError} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              retryLoad();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </section>
      ) : null}

      {(loadError == null || loading) && isLoggedIn && (
      <>
      <div className="flex gap-2 mb-4 rounded-[var(--radius-md)] p-1 bg-slate-800/60 flex-wrap">
        {TABS.map(({ key, keyLabel }) => (
          <form
            key={key}
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              selectTab(key);
            }}
          >
            <button
              type="submit"
              className={`rounded-[var(--radius-md)] px-3 py-2 text-meta font-medium motion-sub min-h-[44px] inline-flex items-center justify-center ${communityShellTabFocus} ${
                tab === key
                  ? "bg-ref-sun/22 text-ref-sun/90 border border-ref-sun/32"
                  : "text-slate-300 hover:text-slate-200"
              }`}
            >
              {t(keyLabel)}
            </button>
          </form>
        ))}
      </div>

      {tab === "requests" ? (
        <section className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-900/70 backdrop-blur-md overflow-hidden mb-4">
          <div className="flex gap-2 p-2 border-b border-slate-600/50">
            <form
              className="contents"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setRequestSubTab("sent");
              }}
            >
              <button
                type="submit"
                className={`flex-1 rounded-[var(--radius-md)] px-3 py-2 text-meta font-medium min-h-[44px] inline-flex items-center justify-center ${communityShellTabFocus} ${
                  requestSubTab === "sent" ? "bg-ref-sun/22 text-ref-sun/90" : "text-slate-300"
                }`}
              >
                {t("community_requests_sent")}
              </button>
            </form>
            <form
              className="contents"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setRequestSubTab("received");
              }}
            >
              <button
                type="submit"
                className={`flex-1 rounded-[var(--radius-md)] px-3 py-2 text-meta font-medium min-h-[44px] inline-flex items-center justify-center ${communityShellTabFocus} ${
                  requestSubTab === "received" ? "bg-ref-sun/22 text-ref-sun/90" : "text-slate-300"
                }`}
              >
                {t("community_requests_received")}
              </button>
            </form>
          </div>
          <div className="p-4">
            {requestSubTab === "sent" ? (
              loading ? (
                <p className="text-slate-300 text-center py-6" role="status" aria-label={t("common_loading")}>{t("common_loading")}</p>
              ) : apiRequestsSent.length > 0 ? (
                <ul className="space-y-3">
                  {apiRequestsSent.map((req) => {
                    const toWallet = formatWalletOrDidShort(req.to_default_wallet ?? undefined);
                    return (
                    <li
                      key={req.id}
                      className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-3 py-2"
                    >
                      <Link
                        href={`/community/user/${req.to_user_id}`}
                        className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-700 ring-2 ring-ref-sun/22 motion-sub hover:ring-ref-sun/40 ${communityAvatarLinkFocus}`}
                        aria-label={req.to_nickname ?? req.to_user_id.slice(0, 8)}
                      >
                        {req.to_avatar_url ? (
                          <Image src={req.to_avatar_url} alt="" fill className="object-cover" sizes="44px" unoptimized />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-meta font-medium text-ref-sun">
                            {(req.to_nickname ?? req.to_user_id).slice(0, 1)}
                          </span>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-body text-slate-200">
                          <span className="text-slate-400" aria-hidden>
                            →
                          </span>
                          <Link
                            href={`/community/user/${req.to_user_id}`}
                            className={`inline-flex min-h-[44px] max-w-full min-w-0 items-center justify-start truncate font-medium hover:text-ref-coral motion-sub rounded-sm ${communityCardLinkFocus}`}
                          >
                            {req.to_nickname ?? req.to_user_id.slice(0, 8)}
                          </Link>
                          <span
                            className={`rounded-full px-2 py-0.5 text-meta ${communityStoredRolePillClassName(
                              mapApiUserRoleToCommunity(req.to_role)
                            )}`}
                          >
                            {t(communityStoredRoleLabelI18nKey(mapApiUserRoleToCommunity(req.to_role)))}
                          </span>
                          {req.to_is_escrow_guide === true &&
                          mapApiUserRoleToCommunity(req.to_role) !== "guide" ? (
                            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90">
                              {t("community_role_guide")}
                            </span>
                          ) : null}
                        </div>
                        {toWallet ? (
                          <p className="mt-0.5 truncate text-meta font-mono text-slate-400" title={toWallet}>
                            {toWallet}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                        {(mapApiUserRoleToCommunity(req.to_role) === "guide" || req.to_is_escrow_guide === true) && (
                          <Link href={marketHrefForCommunityUser(req.to_user_id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
                            {t("community_book_guide_cta")}
                          </Link>
                        )}
                        <span className="rounded-full px-2 py-0.5 text-meta bg-warning/20 text-warning/90">
                          {t("community_request_status_pending")}
                        </span>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              ) : (
                <FriendsRequestsEmptyPanel variant="sent" t={t} />
              )
            ) : loading ? (
              <p className="text-slate-300 text-center py-6" role="status" aria-label={t("common_loading")}>{t("common_loading")}</p>
            ) : apiRequestsReceived.length > 0 ? (
              <ul className="space-y-3">
                {apiRequestsReceived.map((req) => (
                  <RequestReceivedApiRow
                    key={req.id}
                    req={req}
                    t={t}
                    onResolved={(id) => setApiRequestsReceived((prev) => prev.filter((r) => r.id !== id))}
                    onActionFailed={(res) =>
                      showFriendsActionError(res, "community_friends_resolveRequestFailed")
                    }
                    onThrown={(e) =>
                      showFriendsToast(mapApiReadError(e, t, "community_friends_resolveRequestFailed"))
                    }
                    onOfflineHint={() => showFriendsToast(t("community_interaction_offline"))}
                  />
                ))}
              </ul>
            ) : (
              <FriendsRequestsEmptyPanel variant="received" t={t} />
            )}
          </div>
        </section>
      ) : loading ? (
        <section
          className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-scifi-panel"
          aria-label={t(current.keyLabel)}
        >
          <div role="status" aria-label={t("common_loading")}>
            <CommunityFriendsListSkeleton />
          </div>
        </section>
      ) : (
        <section
          className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-scifi-panel [content-visibility:auto]"
          aria-label={t(current.keyLabel)}
        >
          {followingList.length === 0 ? (
            <div className="mx-3 sm:mx-4 my-4 rounded-[var(--radius-md)] border border-dashed border-ref-sun/28 bg-slate-900/40 px-5 py-10 sm:px-6 sm:py-12 text-center">
              <p className="text-body text-slate-200 mb-4">{t("community_friends_empty")}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/community"
                  className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
                >
                  {t("community_tab_feed")}
                </Link>
                <Link
                  href="/community/explore"
                  className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}
                >
                  {t("community_explore_title")}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-600/50">
              {followingList.map((user) => (
                <li key={user.id} className="flex items-center gap-3 px-4 py-3">
                  <Link
                    href={`/community/user/${user.id}`}
                    className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-ref-sun/22 motion-sub hover:ring-ref-sun/40 ${communityAvatarLinkFocus}`}
                    aria-label={user.nickname}
                  >
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt="" fill className="object-cover" sizes="44px" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-slate-700 text-meta font-medium text-ref-sun">
                        {user.nickname.slice(0, 1)}
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/community/user/${user.id}`}
                        className={`inline-flex min-h-[44px] max-w-full min-w-0 items-center justify-start truncate text-body font-medium text-slate-200 hover:text-ref-coral motion-sub rounded-sm ${communityCardLinkFocus}`}
                      >
                        {user.nickname}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-meta ${communityStoredRolePillClassName(user.role)}`}
                      >
                        {t(communityStoredRoleLabelI18nKey(user.role))}
                      </span>
                      {user.isEscrowGuide && String(user.role ?? "").toLowerCase() !== "guide" ? (
                        <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90">
                          {t("community_role_guide")}
                        </span>
                      ) : null}
                    </div>
                    {user.wallet ? (
                      <p className="mt-0.5 truncate text-meta font-mono text-slate-400" title={user.wallet}>
                        {user.wallet}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {tab === "following" && (
                      <form
                        className="inline"
                        onSubmit={(e: FormEvent) => {
                          e.preventDefault();
                          if (unfollowPendingId === user.id) return;
                          if (typeof navigator !== "undefined" && !navigator.onLine) {
                            showFriendsToast(t("community_interaction_offline"));
                            return;
                          }
                          setUnfollowPendingId(user.id);
                          void deleteUserFollow(user.id)
                            .then((res) => {
                              const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
                              if (ok) setUnfollowed((s) => new Set(s).add(user.id));
                              else {
                                if (typeof window !== "undefined") {
                                  console.error("CommunityFriendsPage unfollow not ok:", res);
                                }
                                showFriendsActionError(res, "community_friends_unfollowFailed");
                              }
                            })
                            .catch((err) => {
                              if (typeof window !== "undefined") {
                                console.error("CommunityFriendsPage unfollow:", err);
                              }
                              showFriendsToast(mapApiReadError(err, t, "community_friends_unfollowFailed"));
                            })
                            .finally(() => {
                              setUnfollowPendingId((cur) => (cur === user.id ? null : cur));
                            });
                        }}
                      >
                        <button
                          type="submit"
                          disabled={unfollowPendingId === user.id}
                          aria-busy={unfollowPendingId === user.id ? true : undefined}
                          className={`rounded-full border border-slate-500/60 bg-slate-700/50 px-3 py-1.5 text-meta text-slate-300 hover:bg-slate-600/50 motion-sub disabled:opacity-60 disabled:cursor-wait min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
                        >
                          {unfollowPendingId === user.id ? t("common_loading") : t("community_unfollow")}
                        </button>
                      </form>
                    )}
                    {tab === "followers" && (
                      <form
                        className="inline"
                        onSubmit={(e: FormEvent) => {
                          e.preventDefault();
                          if (isShowcaseAuthorId(user.id)) {
                            showFriendsToast(t("community_friends_showcase_add_blocked"));
                            return;
                          }
                          if (addRequestSent.has(user.id) || addRequestPendingId === user.id) return;
                          if (typeof navigator !== "undefined" && !navigator.onLine) {
                            showFriendsToast(t("community_interaction_offline"));
                            return;
                          }
                          setAddRequestPendingId(user.id);
                          void postFriendsRequest(user.id)
                            .then((res) => {
                              const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
                              if (ok) setAddRequestSent((s) => new Set(s).add(user.id));
                              else {
                                if (typeof window !== "undefined") {
                                  console.error("CommunityFriendsPage postFriendsRequest not ok:", res);
                                }
                                showFriendsActionError(res, "community_friends_addRequestFailed");
                              }
                            })
                            .catch((err) => {
                              if (typeof window !== "undefined") {
                                console.error("CommunityFriendsPage postFriendsRequest:", err);
                              }
                              showFriendsToast(mapApiReadError(err, t, "community_friends_addRequestFailed"));
                            })
                            .finally(() => {
                              setAddRequestPendingId((cur) => (cur === user.id ? null : cur));
                            });
                        }}
                      >
                        <button
                          type="submit"
                          disabled={
                            isShowcaseAuthorId(user.id) ||
                            addRequestSent.has(user.id) ||
                            addRequestPendingId === user.id
                          }
                          title={
                            isShowcaseAuthorId(user.id)
                              ? t("community_friends_showcase_add_blocked")
                              : undefined
                          }
                          data-tt-community-friends-showcase-add-gated={
                            isShowcaseAuthorId(user.id) ? "1" : undefined
                          }
                          aria-busy={addRequestPendingId === user.id ? true : undefined}
                          className={`${TT_COMMUNITY_PAGE_L5.pillCompact} disabled:opacity-70 disabled:cursor-not-allowed ${communityCyanPillFocus}`}
                        >
                          {addRequestPendingId === user.id
                            ? t("common_loading")
                            : addRequestSent.has(user.id)
                              ? t("community_request_sent")
                              : isShowcaseAuthorId(user.id)
                                ? t("community_friends_showcase_add_blocked_short")
                                : t("community_friends_add")}
                        </button>
                      </form>
                    )}
                    <Link
                      href={msgHref(user.id)}
                      className={`${TT_COMMUNITY_PAGE_L5.pillCompact} ${communityCyanPillFocus}`}
                    >
                      {t("community_chat")}
                    </Link>
                    {(user.role === "guide" || user.isEscrowGuide) && (
                      <Link href={marketHrefForCommunityUser(user.id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
                        {t("community_book_guide_cta")}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      </>
      )}

      <p className="text-meta text-slate-400 text-center mt-6">{t("community_more_coming")}</p>

      {friendsToastText && (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {friendsToastText}
        </div>
      )}
    </main>
  );
}

export default function CommunityFriendsPage() {
  return (
    <CommunityParamRouteSuspense mainAriaLabelKey="community_tab_friends">
      <CommunityFriendsPageInner />
    </CommunityParamRouteSuspense>
  );
}

/** 51-31-7：收到的申请 — 调用 accept/reject API，成功后从列表移除 */
function RequestReceivedApiRow({
  req,
  t,
  onResolved,
  onActionFailed,
  onThrown,
  onOfflineHint,
}: {
  req: {
    id: string;
    from_user_id: string;
    to_user_id: string;
    status: string;
    from_nickname?: string;
    from_avatar_url?: string | null;
    from_role?: string | null;
    from_is_escrow_guide?: boolean | null;
    from_default_wallet?: string | null;
  };
  t: (k: string) => string;
  onResolved: (requestId: string) => void;
  onActionFailed?: (res: unknown) => void;
  onThrown?: (err: unknown) => void;
  onOfflineHint?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const resolve = (kind: "accept" | "reject") => {
    if (busy || req.status !== "pending") return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      onOfflineHint?.();
      return;
    }
    setBusy(true);
    const p = kind === "accept" ? postFriendsAccept(req.id) : postFriendsReject(req.id);
    void p
      .then((res) => {
        const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
        if (ok) onResolved(req.id);
        else {
          if (typeof window !== "undefined") {
            console.error("RequestReceivedApiRow resolve not ok:", kind, res);
          }
          onActionFailed?.(res);
        }
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("RequestReceivedApiRow resolve:", kind, e);
        }
        onThrown?.(e);
      })
      .finally(() => setBusy(false));
  };
  const fromWallet = formatWalletOrDidShort(req.from_default_wallet ?? undefined);
  return (
    <li className="flex items-center gap-3 rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-3 py-2">
      <Link
        href={`/community/user/${req.from_user_id}`}
        className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-700 ring-2 ring-ref-sun/22 motion-sub hover:ring-ref-sun/40 ${communityAvatarLinkFocus}`}
        aria-label={req.from_nickname ?? req.from_user_id.slice(0, 8)}
      >
        {req.from_avatar_url ? (
          <Image src={req.from_avatar_url} alt="" fill className="object-cover" sizes="44px" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-meta font-medium text-ref-sun">
            {(req.from_nickname ?? req.from_user_id).slice(0, 1)}
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-body text-slate-200">
          <Link
            href={`/community/user/${req.from_user_id}`}
            className={`inline-flex min-h-[44px] max-w-full min-w-0 items-center justify-start truncate font-medium hover:text-ref-coral motion-sub rounded-sm ${communityCardLinkFocus}`}
          >
            {req.from_nickname ?? req.from_user_id.slice(0, 8)}
          </Link>
          <span
            className={`rounded-full px-2 py-0.5 text-meta ${communityStoredRolePillClassName(
              mapApiUserRoleToCommunity(req.from_role)
            )}`}
          >
            {t(communityStoredRoleLabelI18nKey(mapApiUserRoleToCommunity(req.from_role)))}
          </span>
          {req.from_is_escrow_guide === true &&
          mapApiUserRoleToCommunity(req.from_role) !== "guide" ? (
            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90">
              {t("community_role_guide")}
            </span>
          ) : null}
        </div>
        {fromWallet ? (
          <p className="mt-0.5 truncate text-meta font-mono text-slate-400" title={fromWallet}>
            {fromWallet}
          </p>
        ) : null}
      </div>
      <form
        className="contents"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          const v = sub?.value;
          if (v === "accept" || v === "reject") resolve(v);
        }}
      >
        <div className="flex flex-wrap gap-2 justify-end">
          {(mapApiUserRoleToCommunity(req.from_role) === "guide" || req.from_is_escrow_guide === true) && (
            <Link href={marketHrefForCommunityUser(req.from_user_id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
              {t("community_book_guide_cta")}
            </Link>
          )}
          <button
            type="submit"
            name="friendReqResolve"
            value="accept"
            disabled={busy}
            aria-busy={busy ? true : undefined}
            className={`${TT_COMMUNITY_PAGE_L5.pill} disabled:opacity-50 disabled:cursor-not-allowed ${communityCyanPillFocus}`}
          >
            {t("common_accept")}
          </button>
          <button
            type="submit"
            name="friendReqResolve"
            value="reject"
            disabled={busy}
            aria-busy={busy ? true : undefined}
            className={`rounded-full border border-slate-500/60 bg-slate-700/50 px-4 py-2 text-meta text-slate-300 motion-sub disabled:opacity-50 min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
          >
            {t("common_reject")}
          </button>
        </div>
      </form>
    </li>
  );
}
