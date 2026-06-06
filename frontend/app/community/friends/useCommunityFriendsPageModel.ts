// search-params gate: parent route provides Suspense boundary.
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import {
  postFriendsRequest,
  deleteUserFollow,
} from "@/lib/apiClient/community";
import { messageForCommunityActionResponse } from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { CommunityUserItem } from "@/lib/communityMockData";
import { FRIENDS_TABS, type FriendsTab, type CommunityFriendsRequestReceived, type CommunityFriendsRequestSent } from "./communityFriendsPageTypes";
import {
  loadFriendsPageCore,
  loadFriendsPageTabFragment,
  scheduleFriendsBackgroundPrefetch,
  type FriendsPageDataSlice,
} from "./communityFriendsPageDataLoad";

export function useCommunityFriendsPageModel() {
  const { t } = useTranslation();
  const { isLoggedIn, isLoading: authLoading } = useCommunityAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<FriendsTab>("following");
  const [requestSubTab, setRequestSubTab] = useState<"sent" | "received">("sent");
  const [unfollowed, setUnfollowed] = useState<Set<string>>(new Set());
  const [addRequestSent, setAddRequestSent] = useState<Set<string>>(new Set());
  const [addRequestPendingId, setAddRequestPendingId] = useState<string | null>(null);
  const [unfollowPendingId, setUnfollowPendingId] = useState<string | null>(null);

  const [apiFollowing, setApiFollowing] = useState<CommunityUserItem[]>([]);
  const [apiFollowers, setApiFollowers] = useState<CommunityUserItem[]>([]);
  const [apiFriends, setApiFriends] = useState<CommunityUserItem[]>([]);
  const [apiRequestsReceived, setApiRequestsReceived] = useState<CommunityFriendsRequestReceived[]>([]);
  const [apiRequestsSent, setApiRequestsSent] = useState<CommunityFriendsRequestSent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [convByPeer, setConvByPeer] = useState<Record<string, string>>({});
  const loadedTabsRef = useRef<Set<FriendsTab>>(new Set());
  const prefetchCancelRef = useRef<(() => void) | null>(null);
  const lastRetryKeyRef = useRef(retryKey);

  const mergeSlice = useCallback((slice: Partial<FriendsPageDataSlice>) => {
    if (slice.following) setApiFollowing(slice.following);
    if (slice.followers) setApiFollowers(slice.followers);
    if (slice.friends) setApiFriends(slice.friends);
    if (slice.requestsReceived) setApiRequestsReceived(slice.requestsReceived);
    if (slice.requestsSent) setApiRequestsSent(slice.requestsSent);
    if (slice.convByPeer) setConvByPeer(slice.convByPeer);
  }, []);

  const markTabLoaded = useCallback((key: FriendsTab) => {
    loadedTabsRef.current.add(key);
  }, []);

  const prefetchOtherTabs = useCallback(
    (active: FriendsTab) => {
      prefetchCancelRef.current?.();
      prefetchCancelRef.current = scheduleFriendsBackgroundPrefetch(() => {
        for (const other of FRIENDS_TABS) {
          if (other === active || loadedTabsRef.current.has(other)) continue;
          void loadFriendsPageTabFragment(other)
            .then((fragment) => {
              mergeSlice(fragment);
              markTabLoaded(other);
            })
            .catch((err) => {
              if (typeof window !== "undefined") {
                console.error("CommunityFriendsPage background tab prefetch failed:", other, err);
              }
            });
        }
      });
    },
    [markTabLoaded, mergeSlice],
  );

  useEffect(() => {
    const raw = searchParams.get("tab")?.trim().toLowerCase();
    if (raw && (FRIENDS_TABS as readonly string[]).includes(raw)) {
      setTab(raw as FriendsTab);
    }
  }, [searchParams]);

  const selectTab = useCallback(
    (key: FriendsTab) => {
      setTab(key);
      router.replace(`/community/friends?tab=${key}`, { scroll: false });
    },
    [router]
  );

  const retryLoad = useCallback(() => setRetryKey((k) => k + 1), []);

  const [friendsToastText, setFriendsToastText] = useState<string | null>(null);
  const friendsToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFriendsToast = useCallback((text: string) => {
    if (friendsToastTimerRef.current) clearTimeout(friendsToastTimerRef.current);
    setFriendsToastText(text);
    friendsToastTimerRef.current = setTimeout(() => {
      friendsToastTimerRef.current = null;
      setFriendsToastText(null);
    }, 3200);
  }, []);

  const showFriendsActionError = useCallback(
    (res: unknown, fallbackKey: string) => {
      showFriendsToast(messageForCommunityActionResponse(res, t, fallbackKey));
    },
    [showFriendsToast, t]
  );

  useEffect(
    () => () => {
      if (friendsToastTimerRef.current) clearTimeout(friendsToastTimerRef.current);
      prefetchCancelRef.current?.();
    },
    []
  );

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!isLoggedIn) {
      setApiFollowing([]);
      setApiFollowers([]);
      setApiFriends([]);
      setApiRequestsReceived([]);
      setApiRequestsSent([]);
      setConvByPeer({});
      setLoadError(null);
      setLoading(false);
      loadedTabsRef.current = new Set();
      prefetchCancelRef.current?.();
      return;
    }

    if (lastRetryKeyRef.current !== retryKey) {
      loadedTabsRef.current = new Set();
      lastRetryKeyRef.current = retryKey;
    }

    if (loadedTabsRef.current.has(tab)) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    const run = async () => {
      try {
        if (loadedTabsRef.current.size === 0) {
          const { slice } = await loadFriendsPageCore(tab);
          if (cancelled) return;
          mergeSlice(slice);
        } else {
          const fragment = await loadFriendsPageTabFragment(tab);
          if (cancelled) return;
          mergeSlice(fragment);
        }
        markTabLoaded(tab);
        setLoadError(null);
        setLoading(false);
        prefetchOtherTabs(tab);
      } catch (err) {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("CommunityFriendsPage load failed:", tab, err);
        }
        setLoadError(mapApiReadError(err, t, "community_friends_loadFailed"));
        setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [tab, retryKey, t, authLoading, isLoggedIn, mergeSlice, markTabLoaded, prefetchOtherTabs]);

  const tabRows: { key: FriendsTab; keyLabel: string; list: CommunityUserItem[] }[] = [
    { key: "following", keyLabel: "community_friends_following", list: apiFollowing },
    { key: "followers", keyLabel: "community_friends_followers", list: apiFollowers },
    { key: "friends", keyLabel: "community_friends_friends", list: apiFriends },
    { key: "requests", keyLabel: "community_tab_requests", list: [] },
  ];

  const currentTabRow = tabRows.find((x) => x.key === tab)!;
  const list = currentTabRow.list;
  const followingList = tab === "following" ? list.filter((u) => !unfollowed.has(u.id)) : list;

  const msgHref = useCallback(
    (userId: string) => {
      const convId = convByPeer[userId];
      return convId ? `/community/messages/${convId}` : "/community/messages";
    },
    [convByPeer]
  );

  const handleUnfollow = useCallback(
    (user: CommunityUserItem) => {
      if (unfollowPendingId === user.id) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        showFriendsToast(t("community_interaction_offline"));
        return;
      }
      setUnfollowPendingId(user.id);
      void deleteUserFollow(user.id)
        .then((res) => {
          const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
          if (ok) setUnfollowed((s) => new Set(s).add(user.id));
          else {
            if (typeof window !== "undefined") {
              console.error("CommunityFriendsPage unfollow not ok:", res);
            }
            showFriendsActionError(res, "community_friends_unfollowFailed");
          }
        })
        .catch((err) => {
          if (typeof window !== "undefined") {
            console.error("CommunityFriendsPage unfollow:", err);
          }
          showFriendsToast(mapApiReadError(err, t, "community_friends_unfollowFailed"));
        })
        .finally(() => {
          setUnfollowPendingId((cur) => (cur === user.id ? null : cur));
        });
    },
    [unfollowPendingId, showFriendsToast, t, showFriendsActionError]
  );

  const handleAddFriendRequest = useCallback(
    (user: CommunityUserItem) => {
      if (addRequestSent.has(user.id) || addRequestPendingId === user.id) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        showFriendsToast(t("community_interaction_offline"));
        return;
      }
      setAddRequestPendingId(user.id);
      void postFriendsRequest(user.id)
        .then((res) => {
          const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
          if (ok) setAddRequestSent((s) => new Set(s).add(user.id));
          else {
            if (typeof window !== "undefined") {
              console.error("CommunityFriendsPage postFriendsRequest not ok:", res);
            }
            showFriendsActionError(res, "community_friends_addRequestFailed");
          }
        })
        .catch((err) => {
          if (typeof window !== "undefined") {
            console.error("CommunityFriendsPage postFriendsRequest:", err);
          }
          showFriendsToast(mapApiReadError(err, t, "community_friends_addRequestFailed"));
        })
        .finally(() => {
          setAddRequestPendingId((cur) => (cur === user.id ? null : cur));
        });
    },
    [addRequestSent, addRequestPendingId, showFriendsToast, t, showFriendsActionError]
  );

  return {
    t,
    isLoggedIn,
    authLoading,
    tab,
    selectTab,
    requestSubTab,
    setRequestSubTab,
    tabRows,
    currentKeyLabel: currentTabRow.keyLabel,
    followingList,
    loading,
    loadError,
    retryLoad,
    apiRequestsReceived,
    apiRequestsSent,
    setApiRequestsReceived,
    showFriendsActionError,
    showFriendsToast,
    friendsToastText,
    msgHref,
    unfollowPendingId,
    addRequestPendingId,
    addRequestSent,
    handleUnfollow,
    handleAddFriendRequest,
  };
}
