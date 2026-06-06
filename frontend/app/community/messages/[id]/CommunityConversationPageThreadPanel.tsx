"use client";

import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import OrderChatContextCard from "@/components/community/OrderChatContextCard";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import type { CommunityConversationPageViewModel } from "./useCommunityConversationPage";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

type Props = Pick<
  CommunityConversationPageViewModel,
  "t" | "orderThreadContextId" | "loading" | "threadLoadError" | "retryThread" | "messages" | "myId"
>;

export function CommunityConversationPageThreadPanel({
  t,
  orderThreadContextId,
  loading,
  threadLoadError,
  retryThread,
  messages,
  myId,
}: Props) {
  return (
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
              className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
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
                    ? "bg-ref-sun/22 text-ref-sun border border-ref-sun/28"
                    : "bg-ink-800/80 text-slate-200 border border-slate-600/50"
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
  );
}
