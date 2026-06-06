"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { getOrderMessages, postOrderMessage, getIdempotencyKey } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import OrderChatContextCard from "@/components/community/OrderChatContextCard";
import type { ItineraryBlock, OrderRow } from "./types";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import {
  getDailyItineraryOutline,
  getFirstDayImage,
  type DailyItemForSummary,
} from "@/components/landing/itineraryResultsUtils";
import { escrowExperienceChatShellClass } from "@/lib/escrowExperienceUi";
import {
  escrowProtocolChatBodyClass,
  escrowProtocolChatEmptyStateClass,
  escrowProtocolChatInputClass,
  escrowProtocolChatMetaClass,
  escrowProtocolChatMicroRibbonClass,
  escrowProtocolChatSendBtnClass,
  escrowProtocolChatShellDividerClass,
  escrowProtocolChatTitleClass,
  escrowProtocolInlineLinkClass,
  escrowProtocolSecondaryBtnClass,
} from "@/lib/escrowProtocolUi";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreClasses,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

/** 与 GET /api/v1/orders/:id/messages items[] 对齐 */
export type OrderChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_avatar_url?: string | null;
  sender_name?: string | null;
};

/** 53-S7 可选增强：消息区上方微型行程条（与 OrderChatContextCard 同源数据，免二次请求） */
function ChatItineraryMicroRibbon({
  inline,
  isDidShell,
  isWarmAccent,
  t,
}: {
  inline: { order: OrderRow; itinerary: ItineraryBlock | null } | null | undefined;
  isDidShell: boolean;
  isWarmAccent: boolean;
  t: (k: string, vars?: LocaleInterpolationVars) => string;
}) {
  if (!inline?.order?.id) return null;
  const daily = inline.itinerary?.daily_itinerary as DailyItemForSummary[] | undefined;
  const hasDays = (daily?.length ?? 0) > 0;
  const dest = typeof inline.order.destination === "string" ? inline.order.destination.trim() : "";
  const city = typeof inline.order.city === "string" ? inline.order.city.trim() : "";
  const headline = [dest, city].filter(Boolean).join(" · ");
  if (!hasDays && !headline) return null;

  const dash = t("ui_em_dash");
  const outline = hasDays ? getDailyItineraryOutline(daily, dash, t, 3) : "";
  const orderImg = inline.order.image;
  const cover =
    getFirstDayImage(daily) ??
    (typeof orderImg === "string" && orderImg.trim() !== "" ? orderImg.trim() : null);

  const shell = isDidShell
    ? isWarmAccent
      ? "rounded-[var(--radius-md)] border border-ref-sun/22 bg-ref-sun/8 px-2 py-1.5 mb-2 flex gap-2 items-center"
      : escrowProtocolChatMicroRibbonClass
    : "rounded-[var(--radius-md)] border border-ink-200/60 bg-bg-soft/40 px-2 py-1.5 mb-2 flex gap-2 items-center";

  return (
    <div className={shell} role="note" aria-label={t("escrow_chat_microItinerary_aria")}>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- 行程图任意 HTTPS
        <img
          src={cover}
          alt={headline ? t("escrow_chat_microItinerary_thumb_alt", { headline }) : t("escrow_chat_microItinerary_thumb_alt_generic")}
          className="h-11 w-11 rounded-[var(--radius-sm)] object-cover shrink-0 border border-slate-600/30"
          fetchPriority="high"
          decoding="async"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className={`text-meta font-medium truncate ${isDidShell ? "text-slate-300" : "text-ink-600"}`}>
          {t("escrow_chat_microItinerary_label")}
        </p>
        {headline ? (
          <p className={`text-small truncate ${isDidShell ? "text-slate-200" : "text-ink-800"}`}>{headline}</p>
        ) : null}
        {outline ? (
          <p className={`text-meta truncate ${isDidShell ? "text-slate-300" : "text-ink-500"}`}>{outline}</p>
        ) : null}
      </div>
    </div>
  );
}

/** 无头像时用账户 id 前两字符生成占位头像（保证每条消息都有头像） */
function SenderAvatar({
  senderId,
  avatarUrl,
  senderName,
  isDidShell,
  avatarPriority,
}: {
  senderId: string;
  avatarUrl?: string | null;
  senderName?: string | null;
  isDidShell: boolean;
  avatarPriority?: boolean;
}) {
  const { t } = useTranslation();
  const initial = senderId.slice(0, 2).toLowerCase();
  const bgClass = isDidShell ? "bg-ink-500/80 text-slate-200" : "bg-ink-200/80 text-ink-700";
  const hint = senderName?.trim() || senderId.slice(0, 8);
  const alt =
    avatarUrl && senderName?.trim()
      ? t("guide_card_avatarAlt", { name: senderName.trim() })
      : t("escrow_chat_sender_avatar_alt", { hint });
  if (avatarUrl) {
    return (
      <span className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden ring-1 ring-white/20">
        <Image
          src={avatarUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="44px"
          unoptimized
          priority={Boolean(avatarPriority)}
          fetchPriority={avatarPriority ? "high" : "low"}
        />
      </span>
    );
  }
  return (
    <span className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-meta font-semibold ${bgClass}`} aria-hidden>
      {initial}
    </span>
  );
}

/** 54-S1：协议区（30-DID 赛博朋克）内用浅色字；variant=did 时标题/列表用 text-slate-* */
export default function ChatBlock({
  orderId,
  variant = "default",
  /** Escrow 页传入可避免 `OrderChatContextCard` 重复 GET order（须与 `orderId` 一致） */
  orderContextInline,
}: {
  orderId: string;
  variant?: "default" | "did" | "experience";
  orderContextInline?: { order: OrderRow; itinerary: ItineraryBlock | null } | null;
}) {
  const { t } = useTranslation();
  const chatHeadingId = useId();
  const isWarmAccent = variant === "experience";
  const isDidShell = variant === "did" || isWarmAccent;
  const protocolLinkClass = `${touchTargetLink44Classes} ${escrowProtocolInlineLinkClass}`;
  const accentLink = isWarmAccent
    ? `${touchTargetLink44Classes} text-ref-sun hover:text-ref-sun/90 underline-offset-2 hover:underline rounded-[var(--radius-sm)] ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`
    : protocolLinkClass;
  const titleClass = isWarmAccent
    ? "text-small font-medium text-ref-sun/90 mb-2"
    : isDidShell
      ? escrowProtocolChatTitleClass
      : "text-small font-medium text-ink-700 mb-2";
  const loadingClass = isDidShell ? escrowProtocolChatMetaClass : "text-small text-ink-500";
  const emptyTitleClass = isDidShell ? escrowProtocolChatMetaClass : "text-small font-medium text-ink-600";
  const emptyHintClass = isDidShell ? `${escrowProtocolChatMetaClass} mt-0.5` : "text-meta text-ink-500 mt-0.5";
  const [messages, setMessages] = useState<OrderChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const fetchMessages = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    getOrderMessages(orderId)
      .then((items: OrderChatMessage[]) => {
        setMessages(items);
        setFetchError(null);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("ChatBlock getOrderMessages:", err);
        }
        setMessages([]);
        setFetchError(mapApiReadError(err, t, "escrow_chatLoadFailed"));
      })
      .finally(() => setLoading(false));
  }, [orderId, t]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setPosting(true);
    setPostError(null);
    postOrderMessage(orderId, { content: text }, getIdempotencyKey())
      .then(() => {
        setInput("");
        fetchMessages();
      })
      .catch((e: unknown) => {
        if (typeof window !== "undefined") {
          console.error("ChatBlock send:", e);
        }
        setPostError(mapApiReadError(e, t, "escrow_chatSendFailed"));
      })
      .finally(() => setPosting(false));
  }, [fetchMessages, input, orderId, t]);

  const shellClass = isWarmAccent
    ? escrowExperienceChatShellClass
    : isDidShell
      ? escrowProtocolChatShellDividerClass
      : "mt-3 pt-3 border-t border-ink-200";

  return (
    <div className={shellClass} data-tt-escrow-chat-block="1" data-tt-escrow-chat-variant={variant}>
      {isDidShell && !isWarmAccent ? (
        <OrderChatContextCard
          orderId={orderId}
          variantLayout="escrow-embedded"
          inlineSnapshot={orderContextInline ?? null}
        />
      ) : null}
      <h4 id={chatHeadingId} className={titleClass}>
        {isWarmAccent ? t("escrow_chatTitle_draft") : t("escrow_chatTitle")}
      </h4>
      <ChatItineraryMicroRibbon
        inline={orderContextInline}
        isDidShell={isDidShell}
        isWarmAccent={isWarmAccent}
        t={t}
      />
      {loading ? (
        <p className={loadingClass} role="status" aria-live="polite" aria-busy="true">
          {t("common_loading")}
        </p>
      ) : fetchError ? (
        <div
          className={`rounded-[var(--radius-sm)] border px-3 py-3 text-small ${isDidShell ? "border-warning/45 bg-warning/15 text-warning/95" : "border-warning/25 bg-warning/10 text-ink-800"}`}
          role="alert"
        >
          <p>{fetchError}</p>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              fetchMessages();
            }}
          >
            <button
              type="submit"
              data-tt-escrow-chat-fetch-retry="1"
              className={`mt-2 text-meta font-medium underline-offset-2 hover:underline ${isDidShell ? accentLink : `${touchTargetLink44Classes} text-travel-600 rounded-[var(--radius-sm)] ${travelFocusRingCoreClasses}`}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : (
        <ul
          className={`space-y-3 flex-1 overflow-y-auto text-small ${isWarmAccent ? "min-h-[12rem] max-h-[min(20rem,42vh)]" : "max-h-48"}`}
          aria-labelledby={chatHeadingId}
        >
          {messages.length === 0 && (
            <li className={`${isDidShell ? escrowProtocolChatEmptyStateClass : "flex flex-col items-center justify-center flex-1 min-h-[12rem] rounded-[var(--radius-sm)] border border-ink-200/50 bg-bg-soft/50 py-6 px-4 text-center"}`} role="status" aria-label={t("empty_messages")}>
              <span className={`block h-16 w-16 rounded-full flex items-center justify-center text-h3 mb-3 select-none ${isDidShell ? "bg-ref-sun/15 text-ref-sun/90" : "bg-ink-200/60 text-ink-400"}`} aria-hidden>💬</span>
              <p className={emptyTitleClass}>{t("empty_messages")}</p>
              <p className={emptyHintClass}>
                {isWarmAccent ? t("escrow_chatEmptyHint_draft") : t("escrow_chatEmptyHint")}
              </p>
            </li>
          )}
          {messages.map((m, msgIdx) => (
            <li key={m.id} className="flex gap-2.5">
              <SenderAvatar
                senderId={m.sender_id}
                avatarUrl={m.sender_avatar_url}
                senderName={m.sender_name}
                isDidShell={isDidShell}
                avatarPriority={msgIdx === 0}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <Link
                    href={`/community/user/${m.sender_id}`}
                    className={`font-medium truncate max-w-[140px] hover:underline ${isDidShell ? (isWarmAccent ? `text-slate-200 ${accentLink}` : protocolLinkClass) : `${touchTargetLink44Classes} text-ink-800 hover:text-travel-600 rounded-[var(--radius-sm)] ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}`}
                    title={m.sender_id}
                  >
                    {m.sender_name ?? `${m.sender_id.slice(0, 8)}…`}
                  </Link>
                  <Link
                    href={`/community/user/${m.sender_id}`}
                    className={`text-meta shrink-0 ${
                      isDidShell
                        ? protocolLinkClass
                        : `${touchTargetLink44Classes} text-travel-600 hover:text-travel-700 rounded-[var(--radius-sm)] ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`
                    }`}
                  >
                    {t("community_chat")}
                  </Link>
                </div>
                <p className={`mt-0.5 break-words ${isDidShell ? escrowProtocolChatBodyClass : "text-ink-700"}`}>{m.content}</p>
                <p className={`mt-0.5 ${isDidShell ? escrowProtocolChatMetaClass : "text-meta text-ink-500"}`}>
                  {new Date(m.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* 54-S3：协议区内输入框浅底深字；DID 态边框与 slate 协议区一致 */}
      <form
        className="flex gap-2 mt-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (!posting && !fetchError) void send();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={posting || !!fetchError}
          spellCheck={false}
          aria-busy={posting ? true : undefined}
          className={
            isDidShell
              ? isWarmAccent
                ? "flex-1 border border-ref-sun/35 rounded-[var(--radius-sm)] px-2 py-1 text-small bg-white text-ink-900 placeholder:text-ink-500 focus:outline-none focus-visible:border-ref-sun focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 disabled:opacity-60 disabled:cursor-wait"
                : escrowProtocolChatInputClass
              : "flex-1 border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1 text-small bg-white text-ink-900 placeholder:text-ink-500 focus:outline-none focus-visible:border-travel-500 disabled:opacity-60 disabled:cursor-wait " +
                `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`
          }
          placeholder={t("escrow_messagePlaceholder")}
          aria-labelledby={chatHeadingId}
        />
        <button
          type="submit"
          disabled={posting || !!fetchError}
          aria-busy={posting ? true : undefined}
          className={
            isDidShell
              ? isWarmAccent
                ? `btn-console shrink-0 rounded-[var(--radius-sm)] border border-ref-sun/40 bg-ref-sun/90 px-3 py-1 text-ink-950 text-small font-semibold hover:bg-ref-sun disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`
                : escrowProtocolChatSendBtnClass
              : `btn-console rounded-[var(--radius-sm)] bg-travel-500 px-2 py-1 text-white text-small disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`
          }
        >
          {posting ? t("common_submitting") : t("escrow_send")}
        </button>
      </form>
      {postError ? (
        <div className="mt-2 space-y-2">
          <ApiErrorAlert message={postError} tone={isDidShell ? "dark" : "default"} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!posting && !fetchError && input.trim()) void send();
              }}
            >
              <button
                type="submit"
                data-tt-escrow-chat-post-retry="1"
                disabled={posting || !!fetchError || !input.trim()}
                aria-label={t("common_retry")}
                className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border px-3 py-2 text-small font-medium disabled:opacity-50 ${
                  isDidShell
                    ? escrowProtocolSecondaryBtnClass
                    : `border-ink-300 bg-white text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`
                }`}
              >
                {t("common_retry")}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setPostError(null)}
              className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border px-3 py-2 text-small font-medium ${
                isDidShell
                  ? escrowProtocolSecondaryBtnClass
                  : `border-ink-200 text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`
              }`}
            >
              {t("common_closeAlert")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
