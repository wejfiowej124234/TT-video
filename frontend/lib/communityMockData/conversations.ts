/**
 * 会话列表 MOCK 已移除；数据来自 GET `/api/v1/community/conversations`。
 */

import type { CommunityConversation } from "./types";

export const MOCK_CONVERSATIONS: CommunityConversation[] = [];

export function getConversationIdByPeerId(_peerId: string): string | undefined {
  return undefined;
}
