import { COMMUNITY_ABUSE_429_CODES } from "@/lib/communityApiMessageCodes";

/** 社区写失败 envelope 的根级 `error` 码（无则 `null`）。 */
export function communityWriteRejectionCode(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.status !== "error") return null;
  const err = typeof d.error === "string" ? d.error.trim() : "";
  return err.length > 0 ? err : null;
}

/** HTTP 429 反刷/重复等：UI 已处理，勿 `console.error` 冒充系统故障。 */
export function isExpectedCommunityWriteRejection(data: unknown): boolean {
  const code = communityWriteRejectionCode(data);
  if (!code) return false;
  return (COMMUNITY_ABUSE_429_CODES as readonly string[]).includes(code);
}

/**
 * 同帖同文二次发评（API `comment_duplicate` · HTTP 429）：评论已在库中，
 * 发评 UX 应按软成功处理（刷新列表、勿回填草稿、勿 `console.error`）。
 */
export function isCommunityCommentDuplicateRejection(data: unknown): boolean {
  return communityWriteRejectionCode(data) === "comment_duplicate";
}
