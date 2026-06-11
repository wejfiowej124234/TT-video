"use client";

import { useState, useEffect, useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { useTranslation } from "@/components/LocaleProvider";
import {
  getConversationMessages,
  type CommunityDmMessageRow,
} from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY } from "@/lib/communityConversationsQuery";
import {
  buildShowcaseDmMessages,
  isShowcaseConversationId,
  shouldUseCommunityShowcaseForRelationalUi,
} from "@/lib/communityShowcase";

type ConversationMessagesPayload = Awaited<ReturnType<typeof getConversationMessages>>;

function messagesFromPayload(payload: ConversationMessagesPayload | undefined): CommunityDmMessageRow[] | undefined {
  return Array.isArray(payload?.messages) ? payload.messages : undefined;
}

export function useCommunityConversationPageThread(opts: {
  id: string;
  t: ReturnType<typeof useTranslation>["t"];
  myId: string | null;
}) {
  const { id, t, myId } = opts;
  const queryClient = useQueryClient();

  const showcaseReadonly =
    shouldUseCommunityShowcaseForRelationalUi() && isShowcaseConversationId(id);

  const [localMessages, setLocalMessages] = useState<CommunityDmMessageRow[] | null>(null);

  const threadQ = useQuery<ConversationMessagesPayload>({
    queryKey: ["community", "conversationMessages", id],
    queryFn: () => getConversationMessages(id),
    enabled: Boolean(id) && !showcaseReadonly,
    staleTime: 10_000,
  });

  const threadPayload = threadQ.data;
  const threadMessages = messagesFromPayload(threadPayload);

  useEffect(() => {
    setLocalMessages(null);
  }, [id]);

  useEffect(() => {
    if (!threadQ.isSuccess || !threadMessages) return;
    setLocalMessages(threadMessages);
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY });
  }, [threadQ.isSuccess, threadMessages, queryClient]);

  const showcaseMessages = useMemo(() => {
    if (!showcaseReadonly || !id) return [];
    if (!myId || myId === "anonymous") return [];
    return buildShowcaseDmMessages(id, myId);
  }, [showcaseReadonly, id, myId]);

  const messages = showcaseReadonly
    ? showcaseMessages
    : (localMessages ?? threadMessages ?? []);

  const setMessages: Dispatch<SetStateAction<CommunityDmMessageRow[]>> = useCallback(
    (action) => {
      setLocalMessages((prev) => {
        const base = prev ?? threadMessages ?? [];
        return typeof action === "function" ? action(base) : action;
      });
    },
    [threadMessages],
  );

  const threadLoadError = useMemo(() => {
    if (showcaseReadonly) {
      if (!myId || myId === "anonymous") return t("community_messages_threadLoadFailed");
      return null;
    }
    if (threadQ.isError && threadQ.error != null) {
      return mapApiReadError(threadQ.error, t, "community_messages_threadLoadFailed");
    }
    if (threadQ.isSuccess && threadPayload != null && !threadMessages) {
      return t("community_messages_threadLoadFailed");
    }
    return null;
  }, [showcaseReadonly, myId, threadQ.isError, threadQ.error, threadQ.isSuccess, threadPayload, threadMessages, t]);

  const loading = showcaseReadonly
    ? false
    : threadQ.isLoading && localMessages == null && !threadMessages;

  const retryThread = useCallback(() => {
    void threadQ.refetch();
  }, [threadQ]);

  return {
    messages,
    setMessages,
    loading,
    threadLoadError,
    retryThread,
    showcaseReadonly,
  };
}
