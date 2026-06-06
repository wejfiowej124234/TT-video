import { mapApiUserRoleToCommunity } from "@/components/community/communityFeedMappers";
import type { CommunityUserItem } from "@/lib/communityMockData";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";

/** 51-31-7：关注/粉丝/好友列表（API 可带 nickname、avatar_url、role） */
export function apiUsersToItems(
  items: Array<{
    id: string;
    nickname?: string | null;
    avatar_url?: string | null;
    role?: string | null;
    is_escrow_guide?: boolean | null;
    default_wallet_address?: string | null;
  }>
): CommunityUserItem[] {
  return items.map((u) => {
    const wallet = formatWalletOrDidShort(u.default_wallet_address ?? undefined);
    return {
      id: u.id,
      nickname: (u.nickname && String(u.nickname).trim()) || u.id.slice(0, 8),
      avatar_url: u.avatar_url ?? null,
      role: mapApiUserRoleToCommunity(u.role),
      ...(u.is_escrow_guide === true ? { isEscrowGuide: true } : {}),
      ...(wallet ? { wallet } : {}),
    };
  });
}
