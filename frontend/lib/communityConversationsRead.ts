import type { CommunityConversationRow } from "@/lib/apiClient/community";

/**
 * `GET …/conversations`：`status === "ok"` 时由 `getConversations` 内断言保证数组；
 * `degraded` 或代理/缓存畸形体则 `conversations` 可能缺失或非数组——不得用 `?? []` 当作「无会话」。
 */
export function conversationsArrayFromEnvelope(convData: unknown): CommunityConversationRow[] {
  if (convData == null || typeof convData !== "object" || Array.isArray(convData)) return [];
  const raw = (convData as { conversations?: unknown }).conversations;
  return Array.isArray(raw) ? (raw as CommunityConversationRow[]) : [];
}
