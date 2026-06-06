// search-params gate: parent route provides Suspense boundary.
"use client";

import { useState, useId } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { tryOrderUuidToOrderIdBytes32 } from "@/lib/orderIdBytes32";
import { useCommunityConversationPagePeer } from "./useCommunityConversationPagePeer";
import type { CommunityDmMessageRow } from "@/lib/apiClient/community";
import { useCommunityConversationPageSend, type CommunityConversationSendIssue } from "./useCommunityConversationPageSend";
import { useCommunityConversationPageSharePrefill } from "./useCommunityConversationPageSharePrefill";
import { useCommunityConversationPageThread } from "./useCommunityConversationPageThread";

export type { CommunityConversationSendIssue };

export type CommunityConversationPageViewModel = {
  t: ReturnType<typeof useTranslation>["t"];
  dash: string;
  id: string;
  messagesListHref: string;
  showcaseReadonly: boolean;
  messages: CommunityDmMessageRow[];
  myId: string | null;
  peerUserId: string | null;
  peerLabel: string;
  peerAvatarUrl: string | null;
  peerRole: string | null;
  peerIsEscrowGuide: boolean;
  loading: boolean;
  sending: boolean;
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  threadLoadError: string | null;
  sendIssue: CommunityConversationSendIssue | null;
  setSendIssue: Dispatch<SetStateAction<CommunityConversationSendIssue | null>>;
  dmBodyFieldError: string | null;
  setDmBodyFieldError: Dispatch<SetStateAction<string | null>>;
  retryThread: () => void;
  dmBodyErrorNoticeId: string;
  dmSendErrorNoticeId: string;
  orderThreadContextId: string | null;
  handleSend: () => Promise<void>;
  isLoggedIn: boolean;
  displayPeer: string;
  profileHref: string | null;
};

export function useCommunityConversationPage(): CommunityConversationPageViewModel {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const { isLoggedIn, user: meUser } = useCommunityAuth();
  const myId = meUser?.id ?? null;
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

  const [inputValue, setInputValue] = useState("");
  useCommunityConversationPageSharePrefill(id, sharePostIdFromQuery, t, setInputValue);

  const { messages, setMessages, loading, threadLoadError, retryThread, showcaseReadonly } =
    useCommunityConversationPageThread({ id, t, myId });

  const {
    peerUserId,
    peerLabel,
    peerAvatarUrl,
    peerRole,
    peerIsEscrowGuide,
    displayPeer,
    profileHref,
  } = useCommunityConversationPagePeer({ id, myId, messages, showcaseReadonly, dash });

  const { sending, sendIssue, setSendIssue, dmBodyFieldError, setDmBodyFieldError, handleSend } =
    useCommunityConversationPageSend({
      id,
      myId,
      isLoggedIn,
      showcaseReadonly,
      inputValue,
      setInputValue,
      setMessages,
      t,
    });

  const dmBodyErrorNoticeId = useId();
  const dmSendErrorNoticeId = useId();

  return {
    t,
    dash,
    id,
    messagesListHref,
    showcaseReadonly,
    messages,
    myId,
    peerUserId,
    peerLabel,
    peerAvatarUrl,
    peerRole,
    peerIsEscrowGuide,
    loading,
    sending,
    inputValue,
    setInputValue,
    threadLoadError,
    sendIssue,
    setSendIssue,
    dmBodyFieldError,
    setDmBodyFieldError,
    retryThread,
    dmBodyErrorNoticeId,
    dmSendErrorNoticeId,
    orderThreadContextId,
    handleSend,
    isLoggedIn,
    displayPeer,
    profileHref,
  };
}
