import { COMMUNITY_ABUSE_429_CODES } from "@/lib/communityApiMessageCodes";

function communityWriteErrorCode(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.status !== "error") return null;
  const err = typeof d.error === "string" ? d.error.trim() : "";
  return err.length > 0 ? err : null;
}

/** HTTP 429 反刷/重复等：UI 已处理，勿 `console.error` 冒充系统故障。 */
export function isExpectedCommunityWriteRejection(data: unknown): boolean {
  const code = communityWriteErrorCode(data);
  if (!code) return false;
  return (COMMUNITY_ABUSE_429_CODES as readonly string[]).includes(code);
}
