/**
 * 31 §2.4 / §3.3：社区 → 自由市场「约向导」深链（本页不支付）。
 * `useMarketPage` 消费 `communityUserId` 后从 URL 移除。
 */
export const COMMUNITY_USER_MARKET_QUERY = "communityUserId";

export function marketHrefForCommunityUser(userId: string): string {
  const q = new URLSearchParams();
  q.set(COMMUNITY_USER_MARKET_QUERY, userId.trim());
  q.set("view", "guides");
  return `/market?${q.toString()}`;
}
