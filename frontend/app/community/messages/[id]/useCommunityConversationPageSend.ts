"use client";

import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import type { useTranslation } from "@/components/LocaleProvider";
import { postConversationMessage, type CommunityDmMessageRow } from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";

export type CommunityConversationSendIssue = { kind: "generic" } | { kind: "detail"; text: string };

export function useCommunityConversationPageSend(opts: {
  id: string;
  myId: string | null;
  isLoggedIn: boolean;
  showcaseReadonly: boolean;
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  setMessages: Dispatch<SetStateAction<CommunityDmMessageRow[]>>;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const { id, myId, isLoggedIn, showcaseReadonly, inputValue, setInputValue, setMessages, t } = opts;

  const [sending, setSending] = useState(false);
  const [sendIssue, setSendIssue] = useState<CommunityConversationSendIssue | null>(null);
  const [dmBodyFieldError, setDmBodyFieldError] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    if (!isLoggedIn || sending || showcaseReadonly) return;
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
  }, [id, myId, isLoggedIn, sending, showcaseReadonly, inputValue, setInputValue, setMessages, t]);

  return {
    sending,
    sendIssue,
    setSendIssue,
    dmBodyFieldError,
    setDmBodyFieldError,
    handleSend,
  };
}
