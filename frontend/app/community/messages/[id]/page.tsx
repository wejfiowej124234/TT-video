"use client";

import { useState, useEffect, useCallback, useRef, useId, type FormEvent } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { mapApiUserRoleToCommunity } from "@/components/community/communityFeedMappers";
import {
  getConversations,
  getConversationMessages,
  postConversationMessage,
  type CommunityDmMessageRow,
} from "@/lib/apiClient/community";
import { getMe } from "@/lib/apiClient/me";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import OrderChatContextCard from "@/components/community/OrderChatContextCard";
import { tryOrderUuidToOrderIdBytes32 } from "@/lib/orderIdBytes32";
import {
  communityAmberPillFocus,
  communityCardLinkFocus,
  communityCyanPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";
import { buildCommunityPostShareUrl } from "@/lib/communityPostShareUrl";

/** 31 附录 / 51-31-6：会话详情（私聊气泡 + 输入）；优先真实 API 消息列表与发送 */
function CommunityConversationPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const { isLoggedIn } = useCommunityAuth();
  const id = (params?.id as string) ?? "";
  const sharePostIdFromQuery = searchParams?.get("sharePostId")?.trim() ?? null;
  const orderIdFromQuery = searchParams?.get("orderId")?.trim() ?? "";
  const orderThreadContextId =
    orderIdFromQuery && tryOrderUuidToOrderIdBytes32(orderIdFromQuery) ? orderIdFromQuery : null;
  /** 53-S7：返回会话列表时保留 orderId，避免只读订单摘要从列表顶栏消失 */
  const messagesListHref =
    orderThreadContextId != null
      ? `/community/messages?orderId=${encodeURIComponent(orderThreadContextId)}`
      : "/community/messages";
  const sharePrefilledRef = useRef(false);

  const [messages, setMessages] = useState<CommunityDmMessageRow[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [peerUserId, setPeerUserId] = useState<string | null>(null);
  const [peerLabel, setPeerLabel] = useState<string>(dash);
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | null>(null);
  const [peerRole, setPeerRole] = useState<string | null>(null);
  const [peerIsEscrowGuide, setPeerIsEscrowGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [threadLoadError, setThreadLoadError] = useState<string | null>(null);
  /** 发送失败：`generic` 网络/未知；`detail` 为 API message 映射文案 */
  const [sendIssue, setSendIssue] = useState<
    { kind: "generic" } | { kind: "detail"; text: string } | null
  >(null);
  /** 后端 `errors.body` 映射文案（输入旁 + aria） */
  const [dmBodyFieldError, setDmBodyFieldError] = useState<string | null>(null);
  const [threadRetryKey, setThreadRetryKey] = useState(0);
  const dmBodyErrorNoticeId = useId();
  const dmSendErrorNoticeId = useId();

  const retryThread = useCallback(() => setThreadRetryKey((k) => k + 1), []);

  useEffect(() => {
    sharePrefilledRef.current = false;
  }, [id]);

  /** 31 §2.2：从 Feed「发给好友」进入时预填帖子链接，并去掉 URL 参数 */
  useEffect(() => {
    if (!sharePostIdFromQuery || sharePrefilledRef.current) return;
    if (typeof window === "undefined") return;
    sharePrefilledRef.current = true;
    const url = buildCommunityPostShareUrl(window.location.origin, sharePostIdFromQuery);
    const line = t("community_share_post_prefill").replace(/\{\{url\}\}/g, url);
    setInputValue((prev) => (prev.trim() ? prev : line));
    const u = new URL(window.location.href);
    u.searchParams.delete("sharePostId");
    const qs = u.search || "";
    window.history.replaceState({}, "", `${u.pathname}${qs}`);
  }, [sharePostIdFromQuery, t]);

  useEffect(() => {
    setPeerUserId(null);
    setPeerAvatarUrl(null);
    setPeerRole(null);
    setPeerIsEscrowGuide(false);
    setPeerLabel(dash);
  }, [id, dash]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setThreadLoadError(null);
    setMessages([]);
    getConversationMessages(id)
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
          void queryClient.invalidateQueries({ queryKey: ["community", "conversations", "layoutUnread"] });
        } else {
          if (typeof window !== "undefined") {
            console.error("CommunityConversationPage: unexpected messages payload", data);
          }
          setThreadLoadError(t("community_messages_threadLoadFailed"));
        }
      })
      .catch((e) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("CommunityConversationPage getConversationMessages:", e);
          }
          setThreadLoadError(mapApiReadError(e, t, "community_messages_threadLoadFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, queryClient, threadRetryKey, t]);

  useEffect(() => {
    getMe()
      .then((me: unknown) => {
        setMyId((me as { id?: string })?.id ?? null);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("CommunityConversationPage getMe:", err);
        }
        setMyId(null);
      });
  }, []);

  useEffect(() => {
    if (!id || !myId) return;
    let cancelled = false;
    getConversations()
      .then((data) => {
        if (cancelled) return;
        const list = data?.conversations ?? [];
        const c = list.find((x) => x.id === id);
        if (c) {
          const peer = c.peer_id ?? (c.user1_id === myId ? c.user2_id : c.user1_id);
          const nick = (c.peer_nickname && String(c.peer_nickname).trim()) || peer.slice(0, 8);
          setPeerUserId(peer);
          setPeerLabel(nick);
          setPeerAvatarUrl(c.peer_avatar_url ?? null);
          setPeerRole(mapApiUserRoleToCommunity(c.peer_role));
          setPeerIsEscrowGuide(c.peer_is_escrow_guide === true);
        }
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("CommunityConversationPage getConversations (peer label):", e);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, myId]);

  useEffect(() => {
    if (!id || messages.length === 0 || !myId) return;
    const other = messages.find((m) => m.sender_id !== myId);
    if (other) {
      setPeerLabel((prev) => (prev === dash ? other.sender_id.slice(0, 8) : prev));
      setPeerUserId((prev) => prev ?? other.sender_id);
    }
  }, [id, messages, myId, dash]);

  const displayPeer = peerLabel;
  const profileHref = peerUserId ? `/community/user/${peerUserId}` : null;

  const headerProfile = (
    <>
      <div className="relative h-11 w-11 rounded-full overflow-hidden ring-2 ring-cyan-400/30 bg-slate-700 shrink-0">
        {peerAvatarUrl ? (
          <Image src={peerAvatarUrl} alt="" fill className="object-cover" sizes="44px" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-body font-medium text-cyan-300">
            {displayPeer.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-body font-medium text-slate-200 flex items-center gap-2 flex-wrap">
          <span className="truncate">{displayPeer}</span>
          {peerRole != null ? (
            <span
              className={`rounded-full px-2 py-0.5 text-meta shrink-0 ${
                peerRole === "guide" ? "bg-fuchsia-500/20 text-fuchsia-300" : "bg-cyan-500/20 text-cyan-300"
              }`}
            >
              {t(communityStoredRoleLabelI18nKey(peerRole))}
            </span>
          ) : null}
          {peerIsEscrowGuide ? (
            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90 shrink-0">
              {t("community_badge_escrow_guide")}
            </span>
          ) : null}
          {(peerRole === "guide" || peerIsEscrowGuide) && peerUserId ? (
            <Link href={marketHrefForCommunityUser(peerUserId)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
              {t("community_book_guide_cta")}
            </Link>
          ) : null}
        </p>
        <p className="text-meta text-slate-400">{t("community_chat_peer")}</p>
      </div>
    </>
  );

  const handleSend = async () => {
    if (!isLoggedIn || sending) return;
    const v = inputValue.trim();
    if (!v) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setDmBodyFieldError(null);
      setSendIssue({ kind: "detail", text: t("community_messages_offline") });
      return;
    }
    setSending(true);
    setSendIssue(null);
    setDmBodyFieldError(null);
    try {
      const res = await postConversationMessage(id, v);
      if (res?.status === "ok" && res.id && myId) {
        setMessages((prev) => [
          ...prev,
          {
            id: res.id!,
            conversation_id: id,
            sender_id: myId,
            body: v,
            created_at: new Date().toISOString(),
          },
        ]);
        setInputValue("");
        return;
      }
      if (typeof window !== "undefined") {
        console.error("CommunityConversationPage postConversationMessage not ok:", res);
      }
      if (res?.status === "error") {
        const { topMessage, fieldMessages } = interpretCommunityWriteError(res, t, "community_messages_sendFailed");
        if (fieldMessages.body) {
          setDmBodyFieldError(fieldMessages.body);
          setSendIssue(null);
        } else {
          setDmBodyFieldError(null);
          setSendIssue({ kind: "detail", text: topMessage ?? t("community_messages_sendFailed") });
        }
      } else {
        setDmBodyFieldError(null);
        setSendIssue({ kind: "generic" });
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        console.error("CommunityConversationPage postConversationMessage:", e);
      }
      setDmBodyFieldError(null);
      setSendIssue({ kind: "detail", text: mapApiReadError(e, t, "community_messages_sendFailed") });
    } finally {
      setSending(false);
    }
  };

  if (!id) {
    return (
      <main
        className="max-w-4xl mx-auto px-4 py-8 text-center pb-24 safe-area-pb"
        aria-label={t("community_conversation_not_found")}
      >
        <h1 className="sr-only">{t("community_conversation_not_found")}</h1>
        <p className="text-slate-300">{t("community_conversation_not_found")}</p>
        <Link
          href={messagesListHref}
          className={`mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
        >
          {t("community_back_to_list")}
        </Link>
      </main>
    );
  }

  return (
    <main
      className="max-w-4xl mx-auto flex flex-col min-h-0 h-[calc(100vh-8rem)]"
      aria-label={t("community_conversation_thread_aria")}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-cyan-500/30 bg-slate-900/80 px-4 py-3 safe-area-inset-t">
        <Link
          href={messagesListHref}
          className={`flex min-h-[44px] items-center justify-start gap-2 rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/80 px-3 py-2 text-meta text-slate-300 hover:border-cyan-500/50 hover:text-cyan-100 motion-sub shrink-0 ${communitySlatePillFocus}`}
          aria-label={t("community_back_to_list")}
        >
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{t("community_back_drawer")}</span>
        </Link>
        {profileHref ? (
          <Link
            href={profileHref}
            className="flex min-h-[44px] min-w-0 flex-1 items-center justify-start gap-3 rounded-[var(--radius-md)] py-0.5 pl-0.5 pr-2 motion-sub hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {headerProfile}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">{headerProfile}</div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-3">
        {orderThreadContextId ? <OrderChatContextCard orderId={orderThreadContextId} /> : null}
        {loading ? (
          <p className="text-meta text-slate-400 text-center py-4" role="status" aria-label={t("common_loading")}>
            {t("common_loading")}
          </p>
        ) : threadLoadError != null ? (
          <div className="rounded-[var(--radius-md)] px-2 py-2 text-center space-y-3" role="alert">
            <ApiErrorAlert message={threadLoadError} tone="dark" />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                retryThread();
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
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const fromMe = myId && msg.sender_id === myId;
            return (
              <div
                key={msg.id}
                className={`flex ${fromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-[var(--radius-md)] px-3 py-2 ${
                    fromMe
                      ? "bg-cyan-500/30 text-cyan-100 border border-cyan-400/40"
                      : "bg-slate-800/80 text-slate-200 border border-slate-600/50"
                  }`}
                >
                  <p className="text-small">{msg.body}</p>
                  <p className="text-meta text-slate-400 mt-0.5">
                    {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-meta text-slate-400 text-center py-6">{t("community_messages_empty")}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col border-t border-cyan-500/30 bg-slate-900/90 p-3 safe-area-inset-b">
        {dmBodyFieldError ? (
          <div
            id={dmBodyErrorNoticeId}
            className="mb-2 rounded-[var(--radius-md)] border border-danger/50 bg-danger/10 px-3 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-meta text-danger/95 min-w-0 flex-1">{dmBodyFieldError}</p>
            <form
              className="inline shrink-0 self-end sm:self-auto"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setDmBodyFieldError(null);
              }}
            >
              <button
                type="submit"
                aria-label={t("common_closeAlert")}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded px-3 text-meta font-medium text-danger/95 hover:bg-danger/20 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {t("common_closeAlert")}
              </button>
            </form>
          </div>
        ) : sendIssue ? (
          <div
            id={dmSendErrorNoticeId}
            className="mb-2 rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 px-3 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-meta text-warning/95 min-w-0 flex-1">
              {sendIssue.kind === "detail" ? sendIssue.text : t("community_messages_sendFailed")}
            </p>
            <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end self-end sm:self-auto">
              <form
                className="inline shrink-0"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  setSendIssue(null);
                }}
              >
                <button
                  type="submit"
                  aria-label={t("common_closeAlert")}
                  className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded px-2 py-1 text-meta font-medium text-warning/95 hover:bg-warning/20 motion-sub ${communityAmberPillFocus}`}
                >
                  {t("common_closeAlert")}
                </button>
              </form>
              <form
                className="inline shrink-0"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void handleSend();
                }}
              >
                <button
                  type="submit"
                  disabled={!isLoggedIn || sending || !inputValue.trim()}
                  aria-label={t("common_retry")}
                  className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded px-2 py-1 text-meta font-medium text-cyan-300 hover:bg-cyan-500/20 motion-sub disabled:opacity-50 disabled:cursor-not-allowed ${communityCyanPillFocus}`}
                >
                  {t("common_retry")}
                </button>
              </form>
            </div>
          </div>
        ) : null}
        <form
          className="flex gap-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (sendIssue) setSendIssue(null);
              if (dmBodyFieldError) setDmBodyFieldError(null);
            }}
            placeholder={isLoggedIn ? t("community_chat_placeholder") : t("community_login_to_chat")}
            disabled={!isLoggedIn || sending}
            aria-busy={sending ? true : undefined}
            className={
              "flex-1 rounded-[var(--radius-md)] border bg-slate-800 px-3 py-2 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed " +
              (dmBodyFieldError
                ? "border-danger/60 focus-visible:ring-danger/50"
                : "border-cyan-500/40 focus-visible:ring-cyan-400/50")
            }
            aria-invalid={sendIssue != null || dmBodyFieldError != null}
            aria-errormessage={dmBodyFieldError ? dmBodyErrorNoticeId : sendIssue ? dmSendErrorNoticeId : undefined}
          />
          <button
            type="submit"
            disabled={!isLoggedIn || sending}
            aria-busy={sending ? true : undefined}
            className={`rounded-[var(--radius-md)] border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed ${communityCyanPillFocus}`}
          >
            {sending ? t("community_comment_sending") : t("community_comment_send")}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function CommunityConversationPage() {
  return (
    <CommunityParamRouteSuspense
      mainAriaLabelKey="community_conversation_thread_aria"
      horizontalPadding="px-4"
    >
      <CommunityConversationPageInner />
    </CommunityParamRouteSuspense>
  );
}
