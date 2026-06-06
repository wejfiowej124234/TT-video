/**
 * 社区 showcase 私信列表与演示线程（见根 {@link communityShowcase} 文档块）。
 */
import type { CommunityPostAuthor } from "@/lib/communityMockData";
import type { CommunityDmMessageRow } from "@/lib/apiClient/community";
import {
  SHOWCASE_AUTHOR_AURORA,
  SHOWCASE_AUTHOR_KENTO,
  SHOWCASE_AUTHOR_MEI,
  SHOWCASE_WALLET_SHORT,
  showcaseDemoIso,
} from "@/lib/communityShowcaseAuthors";

/** 私信列表行（与 messages/page ApiConversationItem 对齐） */
export type ShowcaseConversationRow = {
  id: string;
  peerId: string;
  peerNickname: string;
  peerAvatarUrl: string | null;
  peerRole: string;
  peerIsEscrowGuide?: boolean;
  peerWalletShort?: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export const SHOWCASE_CONVERSATIONS: ShowcaseConversationRow[] = [
  {
    id: "tt-showcase-conv-1",
    peerId: SHOWCASE_AUTHOR_KENTO.id,
    peerNickname: SHOWCASE_AUTHOR_KENTO.nickname,
    peerAvatarUrl: SHOWCASE_AUTHOR_KENTO.avatar_url,
    peerRole: "guide",
    peerIsEscrowGuide: true,
    peerWalletShort: SHOWCASE_WALLET_SHORT,
    lastMessage: "好的，那明天 9:00 三年坂见。我会带便携凳子。",
    lastAt: showcaseDemoIso(0, 20),
    unread: 2,
  },
  {
    id: "tt-showcase-conv-2",
    peerId: SHOWCASE_AUTHOR_AURORA.id,
    peerNickname: SHOWCASE_AUTHOR_AURORA.nickname,
    peerAvatarUrl: SHOWCASE_AUTHOR_AURORA.avatar_url,
    peerRole: "traveler",
    peerWalletShort: SHOWCASE_WALLET_SHORT,
    lastMessage: "胶片冲洗店我发你地图钉了～",
    lastAt: showcaseDemoIso(1, 15),
    unread: 0,
  },
  {
    id: "tt-showcase-conv-3",
    peerId: SHOWCASE_AUTHOR_MEI.id,
    peerNickname: SHOWCASE_AUTHOR_MEI.nickname,
    peerAvatarUrl: SHOWCASE_AUTHOR_MEI.avatar_url,
    peerRole: "traveler",
    peerWalletShort: SHOWCASE_WALLET_SHORT,
    lastMessage: "筑地那家丼饭周二定休，别跑空。",
    lastAt: showcaseDemoIso(2, 14),
    unread: 1,
  },
];

export const SHOWCASE_CONV_BY_PEER: Record<string, string> = Object.fromEntries(
  SHOWCASE_CONVERSATIONS.map((c) => [c.peerId, c.id])
);

type ThreadDef = {
  peer: CommunityPostAuthor;
  lines: ReadonlyArray<{ fromPeer: boolean; body: string; offsetMin: number }>;
};

const SHOWCASE_THREAD_DEFS: Record<string, ThreadDef> = {
  "tt-showcase-conv-1": {
    peer: SHOWCASE_AUTHOR_KENTO,
    lines: [
      { fromPeer: true, body: "您好，看到您收藏了我的京都晨走路线，需要我帮您排一下动线吗？", offsetMin: 300 },
      { fromPeer: false, body: "想安排半天东山＋下午宇治，带父母，脚力一般。", offsetMin: 280 },
      { fromPeer: true, body: "建议东山只走「宁宁之道」精华段，宇治选平等院对岸的茶寮休息。", offsetMin: 260 },
      { fromPeer: false, body: "好的，那明天 9:00 三年坂见。我会带便携凳子。", offsetMin: 20 },
    ],
  },
  "tt-showcase-conv-2": {
    peer: SHOWCASE_AUTHOR_AURORA,
    lines: [
      { fromPeer: false, body: "Hi，你上次发的祇园机位太绝了，冲洗有推荐店吗？", offsetMin: 200 },
      { fromPeer: true, body: "谢谢喜欢！我用的是银盐老店，支持 E-6。", offsetMin: 190 },
      { fromPeer: true, body: "胶片冲洗店我发你地图钉了～", offsetMin: 30 },
    ],
  },
  "tt-showcase-conv-3": {
    peer: SHOWCASE_AUTHOR_MEI,
    lines: [
      { fromPeer: true, body: "你问的筑地海鲜下，记得避开周末早高峰。", offsetMin: 120 },
      { fromPeer: false, body: "收到，我打算周二去。", offsetMin: 100 },
      { fromPeer: true, body: "筑地那家丼饭周二定休，别跑空。", offsetMin: 40 },
    ],
  },
};

export function buildShowcaseDmMessages(conversationId: string, meUserId: string): CommunityDmMessageRow[] {
  const def = SHOWCASE_THREAD_DEFS[conversationId];
  if (!def) return [];
  const now = Date.now();
  return def.lines.map((line, i) => {
    const t = new Date(now - line.offsetMin * 60_000).toISOString();
    return {
      id: `${conversationId}-m${i}`,
      conversation_id: conversationId,
      sender_id: line.fromPeer ? def.peer.id : meUserId,
      body: line.body,
      created_at: t,
    };
  });
}

export function getShowcaseThreadPeer(conversationId: string): CommunityPostAuthor | undefined {
  return SHOWCASE_THREAD_DEFS[conversationId]?.peer;
}
