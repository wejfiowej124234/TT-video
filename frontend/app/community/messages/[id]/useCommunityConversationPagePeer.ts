"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { mapApiUserRoleToCommunity } from "@/components/community/communityFeedMappers";
import { getConversations } from "@/lib/apiClient/community";
import type { CommunityDmMessageRow } from "@/lib/apiClient/community";
import {
  COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
  COMMUNITY_CONVERSATIONS_STALE_MS,
} from "@/lib/communityConversationsQuery";
import { getShowcaseThreadPeer } from "@/lib/communityShowcase";

export function useCommunityConversationPagePeer(opts: {
  id: string;
  myId: string | null;
  messages: CommunityDmMessageRow[];
  showcaseReadonly: boolean;
  dash: string;
}) {
  const { id, myId, messages, showcaseReadonly, dash } = opts;

  const [peerUserId, setPeerUserId] = useState<string | null>(null);
  const [peerLabel, setPeerLabel] = useState<string>(dash);
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | null>(null);
  const [peerRole, setPeerRole] = useState<string | null>(null);
  const [peerIsEscrowGuide, setPeerIsEscrowGuide] = useState(false);

  const convQ = useQuery({
    queryKey: COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
    queryFn: getConversations,
    enabled: Boolean(id && myId) && !showcaseReadonly,
    staleTime: COMMUNITY_CONVERSATIONS_STALE_MS,
  });

  useEffect(() => {
    setPeerUserId(null);
    setPeerAvatarUrl(null);
    setPeerRole(null);
    setPeerIsEscrowGuide(false);
    setPeerLabel(dash);
  }, [id, dash]);

  useEffect(() => {
    if (!id || !showcaseReadonly) return;
    const peer = getShowcaseThreadPeer(id);
    if (peer) {
      setPeerUserId(peer.id);
      setPeerLabel(peer.nickname);
      setPeerAvatarUrl(peer.avatar_url ?? null);
      setPeerRole(mapApiUserRoleToCommunity(peer.role));
      setPeerIsEscrowGuide(peer.isEscrowGuide === true);
    }
  }, [id, showcaseReadonly]);

  useEffect(() => {
    if (!id || !myId || showcaseReadonly || !convQ.data) return;
    const list = convQ.data.conversations ?? [];
    const c = list.find((x) => x.id === id);
    if (!c) return;
    const peer = c.peer_id ?? (c.user1_id === myId ? c.user2_id : c.user1_id);
    const nick = (c.peer_nickname && String(c.peer_nickname).trim()) || peer.slice(0, 8);
    setPeerUserId(peer);
    setPeerLabel(nick);
    setPeerAvatarUrl(c.peer_avatar_url ?? null);
    setPeerRole(mapApiUserRoleToCommunity(c.peer_role));
    setPeerIsEscrowGuide(c.peer_is_escrow_guide === true);
  }, [id, myId, showcaseReadonly, convQ.data]);

  useEffect(() => {
    if (!id || messages.length === 0 || !myId) return;
    const other = messages.find((m) => m.sender_id !== myId);
    if (other) {
      setPeerLabel((prev) => (prev === dash ? other.sender_id.slice(0, 8) : prev));
      setPeerUserId((prev) => prev ?? other.sender_id);
    }
  }, [id, messages, myId, dash]);

  const displayPeer = useMemo(() => peerLabel, [peerLabel]);
  const profileHref = peerUserId ? `/community/user/${peerUserId}` : null;

  return {
    peerUserId,
    peerLabel,
    peerAvatarUrl,
    peerRole,
    peerIsEscrowGuide,
    displayPeer,
    profileHref,
  };
}
