import { apiUrl, routes } from "../../api";
import { communityReadOk, communityWriteJsonBody, defaultHeaders } from "./internal";
import type { CommunityConversationRow, CommunityDmMessageRow } from "./types";

export async function getConversations(): Promise<{
  status: string;
  conversations?: CommunityConversationRow[];
  note?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.conversations), {
    headers: defaultHeaders(),
  });
  return (await communityReadOk("community.getConversations", res)) as {
    status: string;
    conversations?: CommunityConversationRow[];
    note?: string;
    message?: string;
  };
}

export async function getConversationMessages(conversationId: string): Promise<{
  status: string;
  messages?: CommunityDmMessageRow[];
  note?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.conversationMessages(conversationId)), {
    headers: defaultHeaders(),
  });
  return (await communityReadOk("community.getConversationMessages", res)) as {
    status: string;
    messages?: CommunityDmMessageRow[];
    note?: string;
    message?: string;
  };
}

/** 51-31-6：发送私信 */
export async function postConversationMessage(
  conversationId: string,
  body: string
): Promise<{
  status: string;
  id?: string | null;
  message?: string;
  errors?: Record<string, string>;
  retry_after_sec?: number;
  retry_after_seconds?: number;
} | null> {
  const res = await fetch(apiUrl(routes.community.conversationMessages(conversationId)), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ body }),
  });
  return (await communityWriteJsonBody("community.postConversationMessage", res)) as {
    status: string;
    id?: string | null;
    message?: string;
    errors?: Record<string, string>;
    retry_after_sec?: number;
    retry_after_seconds?: number;
  } | null;
}
