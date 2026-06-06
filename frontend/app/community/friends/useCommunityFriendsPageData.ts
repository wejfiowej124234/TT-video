"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getFriendsList,
  getFriendsRequests,
  getFriendsRequestsSent,
  getMeFollowers,
  getMeFollowing,
} from "@/lib/apiClient/community";
import { getMe } from "@/lib/apiClient/me";
import { mapApiUserRoleToCommunity } from "@/components/community/communityFeedMappers";
import {
  COMMUNITY_FRIENDS_LIST_QUERY_KEY,
  COMMUNITY_FRIENDS_ME_QUERY_KEY,
  COMMUNITY_FRIENDS_REQUESTS_RECEIVED_QUERY_KEY,
  COMMUNITY_FRIENDS_REQUESTS_SENT_QUERY_KEY,
  COMMUNITY_FRIENDS_STALE_MS,
  COMMUNITY_ME_FOLLOWERS_QUERY_KEY,
} from "@/lib/communityFriendsQueryKeys";
import {
  COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
  COMMUNITY_CONVERSATIONS_STALE_MS,
  scheduleCommunityIdleWork,
} from "@/lib/communityConversationsQuery";
import { COMMUNITY_ME_FOLLOWING_QUERY_KEY } from "@/lib/communityMeListQueries";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { CommunityUserItem } from "@/lib/communityMockData";

export type FriendsTab = "following" | "followers" | "friends" | "requests";

export type FriendsRequestReceived = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  from_nickname?: string;
  from_avatar_url?: string | null;
  from_role?: string | null;
  from_is_escrow_guide?: boolean | null;
  from_default_wallet?: string | null;
};

export type FriendsRequestSent = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  to_nickname?: string;
  to_avatar_url?: string | null;
  to_role?: string | null;
  to_is_escrow_guide?: boolean | null;
  to_default_wallet?: string | null;
};

function mapApiUsersToItems(
  items: Array<{
    id: string;
    nickname?: string | null;
    avatar_url?: string | null;
    role?: string | null;
    is_escrow_guide?: boolean | null;
    default_wallet_address?: string | null;
  }>,
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

export function useCommunityFriendsPageData(args: {
  tab: FriendsTab;
  retryKey: number;
  t: (k: string) => string;
  isLoggedIn: boolean;
  authLoading: boolean;
}): {
  apiFollowing: CommunityUserItem[];
  apiFollowers: CommunityUserItem[];
  apiFriends: CommunityUserItem[];
  apiRequestsReceived: FriendsRequestReceived[];
  apiRequestsSent: FriendsRequestSent[];
  convByPeer: Record<string, string>;
  loading: boolean;
  loadError: string | null;
  setApiRequestsReceived: Dispatch<SetStateAction<FriendsRequestReceived[]>>;
} {
  const { tab, retryKey, t, isLoggedIn, authLoading } = args;
  const queryClient = useQueryClient();
  const listEnabled = isLoggedIn && !authLoading;
  const [deferSecondary, setDeferSecondary] = useState(false);
  const [requestsReceivedOverride, setApiRequestsReceived] = useState<FriendsRequestReceived[] | null>(null);

  useEffect(() => {
    if (!listEnabled) {
      setDeferSecondary(false);
      return;
    }
    if (tab !== "following") {
      setDeferSecondary(true);
      return;
    }
    return scheduleCommunityIdleWork(() => setDeferSecondary(true), 1200);
  }, [listEnabled, tab]);

  useEffect(() => {
    if (retryKey === 0) return;
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_ME_FOLLOWING_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_ME_FOLLOWERS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_FRIENDS_LIST_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_FRIENDS_REQUESTS_RECEIVED_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_FRIENDS_REQUESTS_SENT_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_FRIENDS_ME_QUERY_KEY });
    setApiRequestsReceived(null);
  }, [retryKey, queryClient]);

  const socialListsEnabled =
    deferSecondary || tab === "followers" || tab === "friends";
  const requestsEnabled = listEnabled && (tab === "requests" || deferSecondary);

  const [followingQ, followersQ, friendsQ, requestsReceivedQ, requestsSentQ, convQ, meQ] = useQueries({
    queries: [
      {
        queryKey: COMMUNITY_ME_FOLLOWING_QUERY_KEY,
        queryFn: getMeFollowing,
        staleTime: COMMUNITY_FRIENDS_STALE_MS,
        enabled: listEnabled,
      },
      {
        queryKey: COMMUNITY_ME_FOLLOWERS_QUERY_KEY,
        queryFn: getMeFollowers,
        staleTime: COMMUNITY_FRIENDS_STALE_MS,
        enabled: listEnabled && socialListsEnabled,
      },
      {
        queryKey: COMMUNITY_FRIENDS_LIST_QUERY_KEY,
        queryFn: getFriendsList,
        staleTime: COMMUNITY_FRIENDS_STALE_MS,
        enabled: listEnabled && socialListsEnabled,
      },
      {
        queryKey: COMMUNITY_FRIENDS_REQUESTS_RECEIVED_QUERY_KEY,
        queryFn: getFriendsRequests,
        staleTime: COMMUNITY_FRIENDS_STALE_MS,
        enabled: requestsEnabled,
      },
      {
        queryKey: COMMUNITY_FRIENDS_REQUESTS_SENT_QUERY_KEY,
        queryFn: getFriendsRequestsSent,
        staleTime: COMMUNITY_FRIENDS_STALE_MS,
        enabled: requestsEnabled,
      },
      {
        queryKey: COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
        queryFn: getConversations,
        staleTime: COMMUNITY_CONVERSATIONS_STALE_MS,
        enabled: listEnabled && deferSecondary,
      },
      {
        queryKey: COMMUNITY_FRIENDS_ME_QUERY_KEY,
        queryFn: getMe,
        staleTime: COMMUNITY_FRIENDS_STALE_MS,
        enabled: listEnabled && deferSecondary,
      },
    ],
  });

  const apiFollowing = useMemo(
    () => mapApiUsersToItems(followingQ.data?.following ?? []),
    [followingQ.data],
  );
  const apiFollowers = useMemo(
    () => mapApiUsersToItems(followersQ.data?.followers ?? []),
    [followersQ.data],
  );
  const apiFriends = useMemo(
    () => mapApiUsersToItems(friendsQ.data?.friends ?? []),
    [friendsQ.data],
  );
  const apiRequestsReceivedBase = useMemo(
    () => (requestsReceivedQ.data?.requests ?? []) as FriendsRequestReceived[],
    [requestsReceivedQ.data],
  );

  useEffect(() => {
    setApiRequestsReceived(null);
  }, [requestsReceivedQ.dataUpdatedAt]);

  const apiRequestsReceived = requestsReceivedOverride ?? apiRequestsReceivedBase;
  const apiRequestsSent = useMemo(
    () => (requestsSentQ.data?.requests ?? []) as FriendsRequestSent[],
    [requestsSentQ.data],
  );

  const convByPeer = useMemo(() => {
    const rawMe = meQ.data as Record<string, unknown> | null | undefined;
    const meInner =
      rawMe?.user && typeof rawMe.user === "object" && rawMe.user !== null
        ? (rawMe.user as { id?: string })
        : (rawMe as { id?: string } | null);
    const meId =
      typeof meInner?.id === "string" && meInner.id !== "anonymous" ? meInner.id : undefined;
    const convs = convQ.data?.conversations ?? [];
    if (!meId || convs.length === 0) return {};
    const m: Record<string, string> = {};
    for (const c of convs) {
      const peer = c.peer_id ?? (c.user1_id === meId ? c.user2_id : c.user1_id);
      m[peer] = c.id;
    }
    return m;
  }, [meQ.data, convQ.data]);

  const activeQ =
    tab === "following"
      ? followingQ
      : tab === "followers"
        ? followersQ
        : tab === "friends"
          ? friendsQ
          : requestsReceivedQ;

  const loading = authLoading || (listEnabled && activeQ.isPending);

  const loadError = useMemo(() => {
    if (!listEnabled || loading) return null;
    const attempted = [
      followingQ,
      ...(socialListsEnabled ? [followersQ, friendsQ] : []),
      ...(requestsEnabled ? [requestsReceivedQ, requestsSentQ] : []),
    ];
    if (attempted.some((q) => q.isSuccess)) return null;
    const firstErr = attempted.find((q) => q.isError)?.error;
    return mapApiReadError(firstErr ?? new Error("network"), t, "community_friends_loadFailed");
  }, [
    listEnabled,
    loading,
    socialListsEnabled,
    requestsEnabled,
    followingQ,
    followersQ,
    friendsQ,
    requestsReceivedQ,
    requestsSentQ,
    t,
  ]);

  const setApiRequestsReceivedResolved: Dispatch<SetStateAction<FriendsRequestReceived[]>> = (
    action,
  ) => {
    setApiRequestsReceived((prev) => {
      const base = prev ?? apiRequestsReceivedBase;
      return typeof action === "function" ? action(base) : action;
    });
  };

  return {
    apiFollowing,
    apiFollowers,
    apiFriends,
    apiRequestsReceived,
    apiRequestsSent,
    convByPeer,
    loading,
    loadError,
    setApiRequestsReceived: setApiRequestsReceivedResolved,
  };
}
