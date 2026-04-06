"use client";

import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { formatCommunityDateShort } from "@/lib/communityFormatters";
import { getConversations, getMeLikesReceived } from "@/lib/apiClient/community";
import { getMe } from "@/lib/apiClient/me";
import { CommunityMessagesListSkeleton } from "@/components/community/CommunityMessagesListSkeleton";
import OrderChatContextCard from "@/components/community/OrderChatContextCard";
import {
  communityStoredRolePillClassName,
  mapApiUserRoleToCommunity,
} from "@/components/community/communityFeedMappers";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { CommunityInteractionSummary } from "@/components/community/CommunityInteractionSummary";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS_COMPACT } from "@/components/community/communityFeedConstants";
import {
  communityConversationRowFocus,
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
  communityFuchsiaTextFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";

/** 88 §3.2：私信 Tab 空会话列表 — 与好友页申请空态同口径（虚线框 + 说明 + CTA） */
function MessagesDmEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div
      className="mx-3 sm:mx-4 my-4 rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-slate-900/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={t("community_messages_empty")}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-300"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5.05 21l1.395-3.72C5.512 15.042 5 13.574 5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">{t("community_messages_empty")}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_messages_empty_hint")}</p>
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

/** 51-31-6：会话列表（含最后一条消息与未读条数） */
interface ApiConversationItem {
  id: string;
  peerId: string;
  peerNickname: string;
  peerAvatarUrl: string | null;
  peerRole: string;
  peerIsEscrowGuide?: boolean;
  /** 已缩写，供列表展示 */
  peerWalletShort?: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

/** 31 附录 / 51-31-6：潮流社区 · 消息（会话列表）；53-S7 支持 ?orderId= 来自订单详情「前往订单聊天」 */
function CommunityMessagesPageInner() {
  const { t, locale } = useTranslation();
  const dash = t("ui_em_dash");
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId") ?? null;
  const sharePostId = searchParams?.get("sharePostId")?.trim() ?? null;
  const messagesTab = searchParams?.get("tab")?.toLowerCase() === "activity" ? "activity" : "dm";
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();

  const likesQ = useQuery({
    queryKey: ["community", "likes-received"],
    queryFn: async () => (await getMeLikesReceived()) ?? { status: "ok", likes_received: 0 },
    enabled: isLoggedIn && !authPending && messagesTab === "activity",
    staleTime: 60_000,
  });
  const likesReceived = Math.floor(
    Number((likesQ.data as { likes_received?: number } | undefined)?.likes_received ?? 0)
  );
  const likesErrorMessage =
    likesQ.isError && likesQ.error != null
      ? mapApiReadError(likesQ.error, t, "community_activity_likes_load_failed")
      : null;

  const setMessagesTab = useCallback(
    (next: "dm" | "activity") => {
      if (typeof window === "undefined") return;
      const u = new URL(window.location.href);
      if (next === "activity") u.searchParams.set("tab", "activity");
      else u.searchParams.delete("tab");
      const qs = u.searchParams.toString();
      router.replace(`${u.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (!sharePostId && !orderId) return;
    if (searchParams?.get("tab")?.toLowerCase() !== "activity") return;
    const u = new URL(window.location.href);
    u.searchParams.delete("tab");
    const qs = u.searchParams.toString();
    router.replace(`${u.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [sharePostId, orderId, searchParams, router]);

  const [apiList, setApiList] = useState<ApiConversationItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [listLoadError, setListLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [pullY, setPullY] = useState(0);
  const pullStartYRef = useRef<number | null>(null);
  const pullYRef = useRef(0);
  pullYRef.current = pullY;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const retryList = useCallback(() => setRetryKey((k) => k + 1), []);
  const retryListRef = useRef(retryList);
  retryListRef.current = retryList;

  // 51-31-14：移动端下拉刷新会话列表（与 Feed 阈值一致；加载中不触发）
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
      if (pullYRef.current >= PULL_THRESHOLD && !loadingRef.current) retryListRef.current();
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

  useEffect(() => {
    if (messagesTab !== "dm") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setListLoadError(null);
    Promise.all([getConversations(), getMe()])
      .then(([convData, meData]) => {
        if (cancelled) return;
        const rawMe = meData as Record<string, unknown> | null;
        const meInner =
          rawMe?.user && typeof rawMe.user === "object" && rawMe.user !== null
            ? (rawMe.user as { id?: string })
            : (rawMe as { id?: string } | null);
        const meId =
          typeof meInner?.id === "string" && meInner.id !== "anonymous" ? meInner.id : undefined;
        const list = convData.conversations ?? [];
        if (list.length > 0 && meId) {
          setApiList(
            list.map((c) => {
              const peerId = c.peer_id ?? (c.user1_id === meId ? c.user2_id : c.user1_id);
              const nick =
                (c.peer_nickname && String(c.peer_nickname).trim()) || peerId.slice(0, 8);
              const peerWalletShort = formatWalletOrDidShort(c.peer_default_wallet ?? undefined);
              return {
                id: c.id,
                peerId,
                peerNickname: nick,
                peerAvatarUrl: c.peer_avatar_url ?? null,
                peerRole: mapApiUserRoleToCommunity(c.peer_role),
                peerIsEscrowGuide: c.peer_is_escrow_guide === true,
                peerWalletShort,
                lastMessage: (c.last_message ?? "").trim() || dash,
                lastAt: c.last_message_at ?? c.created_at,
                unread: typeof c.unread_count === "number" ? c.unread_count : 0,
              };
            })
          );
        } else {
          setApiList(
            list.length > 0
              ? list.map((c) => {
                  const peerId = c.peer_id ?? c.user1_id;
                  const nick =
                    (c.peer_nickname && String(c.peer_nickname).trim()) || peerId.slice(0, 8);
                  const peerWalletShort = formatWalletOrDidShort(c.peer_default_wallet ?? undefined);
                  return {
                    id: c.id,
                    peerId,
                    peerNickname: nick,
                    peerAvatarUrl: c.peer_avatar_url ?? null,
                    peerRole: mapApiUserRoleToCommunity(c.peer_role),
                    peerIsEscrowGuide: c.peer_is_escrow_guide === true,
                    peerWalletShort,
                    lastMessage: (c.last_message ?? "").trim() || dash,
                    lastAt: c.last_message_at ?? c.created_at,
                    unread: typeof c.unread_count === "number" ? c.unread_count : 0,
                  };
                })
              : []
          );
        }
      })
      .catch((e) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("CommunityMessagesPage load:", e);
          }
          setListLoadError(mapApiReadError(e, t, "community_messages_listLoadFailed"));
          setApiList(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryKey, messagesTab, dash, t]);

  const displayList = (listLoadError != null ? [] : apiList ?? []).map((c) => ({
    id: c.id,
    peerId: c.peerId,
    peer: {
      nickname: c.peerNickname,
      avatar_url: c.peerAvatarUrl,
      role: c.peerRole,
      isEscrowGuide: c.peerIsEscrowGuide,
      walletShort: c.peerWalletShort,
    },
    last_message: c.lastMessage,
    last_at: c.lastAt,
    unread: c.unread,
  }));
  const isEmpty = !loading && listLoadError == null && displayList.length === 0;

  return (
    <main className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb" aria-label={t("community_tab_messages")}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h3 font-bold bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
            {t("community_tab_messages")}
          </h1>
          <p className="text-small text-slate-300 mt-0.5">{t("community_messages_desc")}</p>
        </div>
        <Link
          href="/community/activity"
          className={`shrink-0 rounded-full border border-slate-500/60 bg-slate-800/70 px-3 py-2 text-meta text-slate-300 hover:border-fuchsia-500/40 hover:text-fuchsia-100 motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
        >
          {t("community_activity_open_full")}
        </Link>
      </header>

      <div
        role="tablist"
        aria-label={t("community_messages_tabs_aria")}
        className="flex flex-wrap gap-2 mb-4 border-b border-slate-600/40 pb-3"
      >
        <form
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setMessagesTab("dm");
          }}
        >
          <button
            type="submit"
            role="tab"
            aria-selected={messagesTab === "dm"}
            className={`rounded-full border px-4 py-2 text-meta font-medium motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus} ${
              messagesTab === "dm"
                ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-cyan-500/40 hover:text-slate-300"
            }`}
          >
            {t("community_messages_tab_dm")}
          </button>
        </form>
        <form
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setMessagesTab("activity");
          }}
        >
          <button
            type="submit"
            role="tab"
            aria-selected={messagesTab === "activity"}
            className={`rounded-full border px-4 py-2 text-meta font-medium motion-sub min-h-[44px] inline-flex items-center justify-center ${communityFuchsiaPillFocus} ${
              messagesTab === "activity"
                ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200"
                : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-fuchsia-500/40 hover:text-slate-300"
            }`}
          >
            {t("community_messages_tab_activity")}
          </button>
        </form>
      </div>

      {messagesTab === "activity" ? (
        <div className="mb-6 space-y-4">
          <CommunityInteractionSummary
            t={t}
            loginReturnPath="/community/messages?tab=activity"
            variant="messages"
            isLoggedIn={isLoggedIn}
            authPending={authPending}
            likesReceived={likesReceived}
            likesLoading={likesQ.isLoading || likesQ.isFetching}
            likesError={likesQ.isError}
            likesErrorMessage={likesErrorMessage}
            onRetryLikes={() => void likesQ.refetch()}
          />
          <p className="text-center text-meta text-slate-400">
            <Link
              href="/community/activity"
              className={`inline-flex min-h-[44px] items-center justify-center text-fuchsia-200 hover:text-fuchsia-100 hover:underline ${communityFuchsiaTextFocus}`}
            >
              {t("community_activity_open_full")}
            </Link>
          </p>
        </div>
      ) : null}

      {messagesTab === "dm" && orderId ? <OrderChatContextCard orderId={orderId} /> : null}

      {messagesTab === "dm" && sharePostId ? (
        <div
          className="mb-3 rounded-[var(--radius-md)] border border-fuchsia-500/40 bg-fuchsia-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
          role="status"
          aria-live="polite"
        >
          <p className="text-small text-fuchsia-50">{t("community_share_pick_conversation")}</p>
          <form
            className="inline shrink-0"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (typeof window === "undefined") return;
              const u = new URL(window.location.href);
              u.searchParams.delete("sharePostId");
              const qs = u.searchParams.toString();
              router.replace(`${u.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
            }}
          >
            <button
              type="submit"
              aria-label={t("community_share_cancel")}
              className={`rounded-full border border-slate-500/60 bg-slate-800/70 px-3 py-1.5 text-meta text-slate-300 hover:bg-slate-700/60 motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
            >
              {t("community_share_cancel")}
            </button>
          </form>
        </div>
      ) : null}

      {messagesTab === "dm" && pullY > 0 ? (
        <div
          className="md:hidden flex items-center justify-center text-meta text-cyan-300 transition-opacity"
          style={{ height: Math.min(pullY, 56) }}
          role="status"
          aria-live="polite"
          aria-label={pullY > 50 ? t("community_release_to_refresh") : t("community_pull_to_refresh")}
        >
          {pullY > 50 ? t("community_release_to_refresh") : t("community_pull_to_refresh")}
        </div>
      ) : null}

      {messagesTab === "dm" ? (
      <section
        className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-scifi-panel"
        aria-label={t("community_conversations")}
      >
        {loading ? (
          <div role="status" aria-label={t("common_loading")}>
            <CommunityMessagesListSkeleton />
          </div>
        ) : listLoadError != null ? (
          <div className="px-6 py-10 text-center space-y-3" role="alert">
            <ApiErrorAlert message={listLoadError} tone="dark" />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                retryList();
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
        ) : isEmpty ? (
          <MessagesDmEmptyPanel t={t} />
        ) : (
          <ul className="divide-y divide-slate-600/50">
            {displayList.map((conv: {
              id: string;
              peerId: string;
              peer: {
                nickname: string;
                avatar_url?: string | null;
                role?: string;
                isEscrowGuide?: boolean;
                walletShort?: string | null;
              };
              last_message: string;
              last_at: string;
              unread?: number;
            }) => {
              const convQs = new URLSearchParams();
              if (sharePostId) convQs.set("sharePostId", sharePostId);
              if (orderId) convQs.set("orderId", orderId);
              const convQ = convQs.toString();
              const convHref = `/community/messages/${conv.id}${convQ ? `?${convQ}` : ""}`;
              const showBookGuide =
                conv.peerId &&
                (conv.peer?.role === "guide" || conv.peer?.isEscrowGuide === true);
              return (
              <li
                key={conv.id}
                className={
                  "flex items-stretch divide-x divide-slate-600/40 " +
                  (conv.unread != null && conv.unread > 0 ? "bg-slate-800/40" : "")
                }
              >
                <Link
                  href={convHref}
                  className={
                    `${communityConversationRowFocus} flex min-w-0 flex-1 items-center gap-3 px-4 py-3 motion-sub ` +
                    (conv.unread != null && conv.unread > 0
                      ? "border-l-[3px] border-fuchsia-400/70 hover:bg-slate-800/65"
                      : "hover:bg-slate-800/50")
                  }
                  aria-label={
                    conv.unread != null && conv.unread > 0
                      ? `${conv.peer?.nickname ?? ""}, ${conv.unread} ${t("community_unread")}`
                      : undefined
                  }
                >
                  <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-cyan-400/30 flex-shrink-0 bg-slate-700">
                    {conv.peer?.avatar_url ? (
                      <Image src={conv.peer.avatar_url} alt="" fill className="object-cover" sizes="48px" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-body font-medium text-cyan-300">
                        {(conv.peer?.nickname ?? "?").slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-body font-medium text-slate-200">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate">{conv.peer?.nickname ?? dash}</span>
                          {conv.peer?.role && (
                            <span
                              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-meta ${communityStoredRolePillClassName(
                                conv.peer.role
                              )}`}
                            >
                              {t(communityStoredRoleLabelI18nKey(conv.peer.role))}
                            </span>
                          )}
                          {conv.peer?.isEscrowGuide ? (
                            <span className="flex-shrink-0 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90">
                              {t("community_badge_escrow_guide")}
                            </span>
                          ) : null}
                        </span>
                        {conv.peer?.walletShort ? (
                          <span className="truncate text-meta font-mono text-slate-400">{conv.peer.walletShort}</span>
                        ) : null}
                      </span>
                      {conv.unread != null && conv.unread > 0 && (
                        <span className="rounded-full bg-fuchsia-500/80 px-2 py-0.5 text-meta text-white">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p
                      className={
                        "text-small truncate mt-0.5 " +
                        (conv.unread != null && conv.unread > 0 ? "text-slate-300 font-medium" : "text-slate-400")
                      }
                    >
                      {conv.last_message}
                    </p>
                  </div>
                  <span className="text-meta text-slate-400 flex-shrink-0 self-center">{formatCommunityDateShort(conv.last_at, locale)}</span>
                </Link>
                {showBookGuide ? (
                  <div className="flex items-center px-2 py-2 sm:px-3">
                    <Link href={marketHrefForCommunityUser(conv.peerId)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS_COMPACT}>
                      {t("community_book_guide_cta")}
                    </Link>
                  </div>
                ) : null}
              </li>
              );
            })}
          </ul>
        )}
      </section>
      ) : null}

      <p className="text-meta text-slate-400 text-center mt-6">{t("community_more_coming")}</p>
    </main>
  );
}

export default function CommunityMessagesPage() {
  return (
    <CommunityParamRouteSuspense mainAriaLabelKey="community_tab_messages">
      <CommunityMessagesPageInner />
    </CommunityParamRouteSuspense>
  );
}
