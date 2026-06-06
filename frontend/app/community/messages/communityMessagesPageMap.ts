import type { CommunityConversationRow } from "@/lib/apiClient/community";
import { mapApiUserRoleToCommunity } from "@/components/community/communityFeedMappers";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import { SHOWCASE_CONVERSATIONS, shouldUseCommunityShowcaseForRelationalUi } from "@/lib/communityShowcase";
import type {
  CommunityMessagesApiConversationItem,
  CommunityMessagesDisplayConversation,
} from "./communityMessagesPageTypes";

export function extractCommunityMessagesMeId(meData: unknown): string | undefined {
  const rawMe = meData as Record<string, unknown> | null;
  const meInner =
    rawMe?.user && typeof rawMe.user === "object" && rawMe.user !== null
      ? (rawMe.user as { id?: string })
      : (rawMe as { id?: string } | null);
  return typeof meInner?.id === "string" && meInner.id !== "anonymous" ? meInner.id : undefined;
}

export function mapConversationsToApiItems(
  list: CommunityConversationRow[],
  meId: string | undefined,
  dash: string,
): CommunityMessagesApiConversationItem[] {
  let rows: CommunityMessagesApiConversationItem[] = [];
  if (list.length > 0 && meId) {
    rows = list.map((c) => {
      const peerId = c.peer_id ?? (c.user1_id === meId ? c.user2_id : c.user1_id);
      const nick = (c.peer_nickname && String(c.peer_nickname).trim()) || peerId.slice(0, 8);
      const peerWalletShort = formatWalletOrDidShort(c.peer_default_wallet ?? undefined);
      return {
        id: c.id,
        peerId,
        peerNickname: nick,
        peerAvatarUrl: c.peer_avatar_url ?? null,
        peerRole: mapApiUserRoleToCommunity(c.peer_role),
        peerIsEscrowGuide: c.peer_is_escrow_guide === true,
        peerWalletShort,
        lastMessage: (c.last_message ?? "").trim() || dash,
        lastAt: c.last_message_at ?? c.created_at,
        unread: typeof c.unread_count === "number" ? c.unread_count : 0,
      };
    });
  } else if (list.length > 0) {
    rows = list.map((c) => {
      const peerId = c.peer_id ?? c.user1_id;
      const nick = (c.peer_nickname && String(c.peer_nickname).trim()) || peerId.slice(0, 8);
      const peerWalletShort = formatWalletOrDidShort(c.peer_default_wallet ?? undefined);
      return {
        id: c.id,
        peerId,
        peerNickname: nick,
        peerAvatarUrl: c.peer_avatar_url ?? null,
        peerRole: mapApiUserRoleToCommunity(c.peer_role),
        peerIsEscrowGuide: c.peer_is_escrow_guide === true,
        peerWalletShort,
        lastMessage: (c.last_message ?? "").trim() || dash,
        lastAt: c.last_message_at ?? c.created_at,
        unread: typeof c.unread_count === "number" ? c.unread_count : 0,
      };
    });
  }
  if (rows.length === 0 && meId && shouldUseCommunityShowcaseForRelationalUi()) {
    rows = SHOWCASE_CONVERSATIONS.map((c) => ({
      id: c.id,
      peerId: c.peerId,
      peerNickname: c.peerNickname,
      peerAvatarUrl: c.peerAvatarUrl,
      peerRole: mapApiUserRoleToCommunity(c.peerRole),
      peerIsEscrowGuide: c.peerIsEscrowGuide === true,
      peerWalletShort: c.peerWalletShort ?? null,
      lastMessage: c.lastMessage,
      lastAt: c.lastAt,
      unread: c.unread,
    }));
  }
  return rows;
}

export function toDisplayConversations(
  apiList: CommunityMessagesApiConversationItem[] | null,
  listLoadError: string | null,
): CommunityMessagesDisplayConversation[] {
  return (listLoadError != null ? [] : apiList ?? []).map((c) => ({
    id: c.id,
    peerId: c.peerId,
    peer: {
      nickname: c.peerNickname,
      avatar_url: c.peerAvatarUrl,
      role: c.peerRole,
      isEscrowGuide: c.peerIsEscrowGuide,
      walletShort: c.peerWalletShort,
    },
    last_message: c.lastMessage,
    last_at: c.lastAt,
    unread: c.unread,
  }));
}
