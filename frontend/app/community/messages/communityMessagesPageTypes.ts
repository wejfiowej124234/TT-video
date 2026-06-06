/** 51-31-6：会话列表（含最后一条消息与未读条数） */
export type CommunityMessagesApiConversationItem = {
  id: string;
  peerId: string;
  peerNickname: string;
  peerAvatarUrl: string | null;
  peerRole: string;
  peerIsEscrowGuide?: boolean;
  /** 已缩写，供列表展示 */
  peerWalletShort?: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export type CommunityMessagesDisplayConversation = {
  id: string;
  peerId: string;
  peer: {
    nickname: string;
    avatar_url?: string | null;
    role?: string;
    isEscrowGuide?: boolean;
    walletShort?: string | null;
  };
  last_message: string;
  last_at: string;
  unread?: number;
};
