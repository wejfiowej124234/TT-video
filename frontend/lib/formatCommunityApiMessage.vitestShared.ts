/** Vitest 切片共用：轻量 `t`，与删前 `formatCommunityApiMessage.test.ts` 行为一致。 */
export function formatCommunityApiMessageTestT(k: string): string {
  if (k === "community_api_msg_empty_body") return "正文不能为空";
  if (k === "fb") return "FB";
  return k;
}
