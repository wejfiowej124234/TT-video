import {
  getMeFollowing,
  getMeFollowers,
  getFriendsList,
  getFriendsRequests,
  getFriendsRequestsSent,
  getConversations,
} from "@/lib/apiClient/community";
import { getMe } from "@/lib/apiClient/me";
import type { CommunityUserItem } from "@/lib/communityMockData";
import {
  SHOWCASE_CONV_BY_PEER,
  SHOWCASE_FOLLOWERS_USERS,
  SHOWCASE_FOLLOWING_USERS,
  SHOWCASE_FRIENDS_USERS,
  shouldUseCommunityShowcaseForRelationalUi,
} from "@/lib/communityShowcase";
import type { CommunityFriendsRequestReceived, CommunityFriendsRequestSent, FriendsTab } from "./communityFriendsPageTypes";
import { apiUsersToItems } from "./communityFriendsPageMappers";

export type FriendsPageDataSlice = {
  following: CommunityUserItem[];
  followers: CommunityUserItem[];
  friends: CommunityUserItem[];
  requestsReceived: CommunityFriendsRequestReceived[];
  requestsSent: CommunityFriendsRequestSent[];
  convByPeer: Record<string, string>;
};

function withShowcaseUsers(list: CommunityUserItem[], showcase: CommunityUserItem[]): CommunityUserItem[] {
  if (shouldUseCommunityShowcaseForRelationalUi() && list.length === 0) return showcase;
  return list;
}

function meIdFromPayload(meData: unknown): string | undefined {
  const rawMe = meData as Record<string, unknown> | null;
  const meInner =
    rawMe?.user && typeof rawMe.user === "object" && rawMe.user !== null
      ? (rawMe.user as { id?: string })
      : (rawMe as { id?: string } | null);
  return typeof meInner?.id === "string" && meInner.id !== "anonymous" ? meInner.id : undefined;
}

function convByPeerFromPayload(meId: string | undefined, convData: Awaited<ReturnType<typeof getConversations>> | null): Record<string, string> {
  const convs = convData?.conversations ?? [];
  const m: Record<string, string> = {};
  if (meId && convs.length > 0) {
    for (const c of convs) {
      const peer = c.peer_id ?? (c.user1_id === meId ? c.user2_id : c.user1_id);
      m[peer] = c.id;
    }
  }
  if (shouldUseCommunityShowcaseForRelationalUi() && convs.length === 0) {
    Object.assign(m, SHOWCASE_CONV_BY_PEER);
  }
  return m;
}

/** 首屏：当前 Tab + me + 会话映射（私信 CTA） */
export async function loadFriendsPageCore(
  tab: FriendsTab,
): Promise<{ slice: Partial<FriendsPageDataSlice>; meId?: string }> {
  const tabPromise =
    tab === "following"
      ? getMeFollowing()
      : tab === "followers"
        ? getMeFollowers()
        : tab === "friends"
          ? getFriendsList()
          : Promise.all([getFriendsRequests(), getFriendsRequestsSent()]);

  const [meResult, convResult, tabResult] = await Promise.allSettled([getMe(), getConversations(), tabPromise]);

  const meData = meResult.status === "fulfilled" ? meResult.value : null;
  const convData = convResult.status === "fulfilled" ? convResult.value : null;
  const meId = meIdFromPayload(meData);
  const slice: Partial<FriendsPageDataSlice> = {
    convByPeer: convByPeerFromPayload(meId, convData),
  };

  if (tabResult.status === "fulfilled") {
    if (tab === "following") {
      const data = tabResult.value as Awaited<ReturnType<typeof getMeFollowing>>;
      slice.following = withShowcaseUsers(apiUsersToItems(data?.following ?? []), SHOWCASE_FOLLOWING_USERS);
    } else if (tab === "followers") {
      const data = tabResult.value as Awaited<ReturnType<typeof getMeFollowers>>;
      slice.followers = withShowcaseUsers(apiUsersToItems(data?.followers ?? []), SHOWCASE_FOLLOWERS_USERS);
    } else if (tab === "friends") {
      const data = tabResult.value as Awaited<ReturnType<typeof getFriendsList>>;
      slice.friends = withShowcaseUsers(apiUsersToItems(data?.friends ?? []), SHOWCASE_FRIENDS_USERS);
    } else {
      const [requestsData, sentData] = tabResult.value as [
        Awaited<ReturnType<typeof getFriendsRequests>>,
        Awaited<ReturnType<typeof getFriendsRequestsSent>>,
      ];
      slice.requestsReceived = (requestsData?.requests ?? []) as CommunityFriendsRequestReceived[];
      slice.requestsSent = (sentData?.requests ?? []) as CommunityFriendsRequestSent[];
    }
  }

  if (tabResult.status === "rejected" && meResult.status === "rejected" && convResult.status === "rejected") {
    throw (tabResult as PromiseRejectedResult).reason ?? new Error("network");
  }

  return { slice, meId };
}

/** 后台预载其它 Tab（不改变首屏请求数） */
export async function loadFriendsPageTabFragment(tab: FriendsTab): Promise<Partial<FriendsPageDataSlice>> {
  if (tab === "following") {
    const data = await getMeFollowing();
    return { following: withShowcaseUsers(apiUsersToItems(data?.following ?? []), SHOWCASE_FOLLOWING_USERS) };
  }
  if (tab === "followers") {
    const data = await getMeFollowers();
    return { followers: withShowcaseUsers(apiUsersToItems(data?.followers ?? []), SHOWCASE_FOLLOWERS_USERS) };
  }
  if (tab === "friends") {
    const data = await getFriendsList();
    return { friends: withShowcaseUsers(apiUsersToItems(data?.friends ?? []), SHOWCASE_FRIENDS_USERS) };
  }
  const [requestsData, sentData] = await Promise.all([getFriendsRequests(), getFriendsRequestsSent()]);
  return {
    requestsReceived: (requestsData?.requests ?? []) as CommunityFriendsRequestReceived[],
    requestsSent: (sentData?.requests ?? []) as CommunityFriendsRequestSent[],
  };
}

export function scheduleFriendsBackgroundPrefetch(run: () => void): () => void {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const timer = globalThis.setTimeout(run, 200);
  return () => globalThis.clearTimeout(timer);
}
