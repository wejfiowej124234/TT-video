"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  COMMUNITY_FEED_LIST_API_MAX,
  getUserPosts,
  getConversations,
  getMeFollowing,
  postUserFollow,
  deleteUserFollow,
} from "@/lib/apiClient/community";
import { mapApiPostToCommunityPost } from "@/components/community/useCommunityFeed";
import { messageForCommunityActionResponse } from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { CommunityPost, CommunityPostUserVisibility } from "@/lib/communityMockData";
import {
  COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
  COMMUNITY_CONVERSATIONS_STALE_MS,
  scheduleCommunityIdleWork,
} from "@/lib/communityConversationsQuery";
import { isUuid, type FollowingListFetch } from "./communityUserPageModel";

type TFn = (key: string) => string;

export function useCommunityUserRemoteLists(options: {
  id: string;
  t: TFn;
  isSelf: boolean;
  isLoggedIn: boolean;
  authLoading: boolean;
  meId: string | undefined;
}) {
  const { id, t, isSelf, isLoggedIn, authLoading, meId } = options;

  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoadError, setPostsLoadError] = useState<string | null>(null);
  const [postsRetryKey, setPostsRetryKey] = useState(0);
  const [postsVisFilter, setPostsVisFilter] = useState<"all" | CommunityPostUserVisibility>("all");

  const [deferSocialQueries, setDeferSocialQueries] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followToast, setFollowToast] = useState<string | null>(null);
  const followToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsFollowing(false);
  }, [id]);

  useEffect(() => {
    setPostsVisFilter("all");
  }, [id]);

  useEffect(() => {
    if (authLoading || !isLoggedIn) {
      setDeferSocialQueries(false);
      return;
    }
    return scheduleCommunityIdleWork(() => setDeferSocialQueries(true), 1200);
  }, [authLoading, isLoggedIn, id]);

  useEffect(() => {
    if (!id || !isUuid(id)) {
      setUserPosts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPostsLoadError(null);
    getUserPosts(id, {
      limit: COMMUNITY_FEED_LIST_API_MAX,
      ...(isSelf ? { visibility: postsVisFilter } : {}),
    })
      .then((data) => {
        if (cancelled) return;
        const list = data?.posts ?? [];
        setUserPosts(list.map((p) => mapApiPostToCommunityPost(p)));
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("CommunityUserPage getUserPosts:", err);
          }
          setPostsLoadError(mapApiReadError(err, t, "community_user_posts_loadFailed"));
          setUserPosts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, postsRetryKey, postsVisFilter, t, isSelf]);

  const convQ = useQuery({
    queryKey: COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
    queryFn: getConversations,
    enabled: Boolean(meId) && !authLoading && deferSocialQueries,
    staleTime: COMMUNITY_CONVERSATIONS_STALE_MS,
  });

  const followingQ = useQuery({
    queryKey: ["community", "userPageFollowing", id],
    queryFn: getMeFollowing,
    enabled: isLoggedIn && !authLoading && deferSocialQueries && !isSelf && isUuid(id),
    staleTime: 60_000,
  });

  const convByPeer = useMemo(() => {
    if (!meId) return {};
    const convs = convQ.data?.conversations ?? [];
    if (convs.length === 0) return {};
    const m: Record<string, string> = {};
    for (const c of convs) {
      const peer = c.peer_id ?? (c.user1_id === meId ? c.user2_id : c.user1_id);
      if (peer) m[peer] = c.id;
    }
    return m;
  }, [convQ.data, meId]);

  const conversationsLoadError = useMemo(() => {
    if (!meId || !deferSocialQueries) return null;
    if (convQ.isError && convQ.error != null) {
      return mapApiReadError(convQ.error, t, "community_user_conversations_loadFailed");
    }
    return null;
  }, [meId, deferSocialQueries, convQ.isError, convQ.error, t]);

  const followingLoadError = useMemo(() => {
    if (!isLoggedIn || isSelf || !deferSocialQueries) return null;
    if (followingQ.isError && followingQ.error != null) {
      return mapApiReadError(followingQ.error, t, "community_user_followingList_loadFailed");
    }
    return null;
  }, [isLoggedIn, isSelf, deferSocialQueries, followingQ.isError, followingQ.error, t]);

  const followingListFetch: FollowingListFetch = useMemo(() => {
    if (!isLoggedIn || isSelf || !isUuid(id)) return "idle";
    if (!deferSocialQueries || followingQ.isLoading) return "loading";
    if (followingQ.isError) return "error";
    if (followingQ.isSuccess) return "ready";
    return "idle";
  }, [isLoggedIn, isSelf, id, deferSocialQueries, followingQ.isLoading, followingQ.isError, followingQ.isSuccess]);

  useEffect(() => {
    if (!followingQ.isSuccess) return;
    const list = followingQ.data?.following ?? [];
    setIsFollowing(list.some((u) => u.id === id));
  }, [followingQ.isSuccess, followingQ.data, id]);

  /** B-076: align post `author_followed_by_me` with GET …/me/following. */
  useEffect(() => {
    if (!isLoggedIn || !id || userPosts.length === 0) return;
    const p = userPosts.find((x) => x.author?.id === id);
    if (!p || typeof p.authorFollowedByMe !== "boolean") return;
    if (followingListFetch === "error") {
      setIsFollowing(p.authorFollowedByMe === true);
      return;
    }
    if (followingListFetch === "ready" && p.authorFollowedByMe === true) {
      setIsFollowing(true);
    }
  }, [followingListFetch, userPosts, id, isLoggedIn]);

  const showFollowToast = useCallback((message: string) => {
    if (followToastTimerRef.current) clearTimeout(followToastTimerRef.current);
    setFollowToast(message);
    followToastTimerRef.current = setTimeout(() => {
      followToastTimerRef.current = null;
      setFollowToast(null);
    }, 3200);
  }, []);

  useEffect(
    () => () => {
      if (followToastTimerRef.current) clearTimeout(followToastTimerRef.current);
    },
    [],
  );

  const handleFollowToggle = useCallback(async () => {
    if (!isLoggedIn || followBusy || followingListFetch !== "ready" || meId === id || !isUuid(id)) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showFollowToast(t("community_interaction_offline"));
      return;
    }
    setFollowBusy(true);
    try {
      if (isFollowing) {
        const res = await deleteUserFollow(id);
        const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
        if (ok) setIsFollowing(false);
        else
          showFollowToast(
            messageForCommunityActionResponse(res, t, "community_user_follow_toggleFailed"),
          );
      } else {
        const res = await postUserFollow(id);
        const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
        if (ok) setIsFollowing(true);
        else
          showFollowToast(
            messageForCommunityActionResponse(res, t, "community_user_follow_toggleFailed"),
          );
      }
    } catch (err) {
      showFollowToast(mapApiReadError(err, t, "community_user_follow_toggleFailed"));
    } finally {
      setFollowBusy(false);
    }
  }, [isLoggedIn, followBusy, followingListFetch, meId, id, isFollowing, showFollowToast, t]);

  const msgHref =
    convByPeer[id] != null ? `/community/messages/${convByPeer[id]}` : "/community/messages";

  return {
    userPosts,
    setUserPosts,
    loading,
    postsLoadError,
    setPostsRetryKey,
    postsVisFilter,
    setPostsVisFilter,
    convByPeer,
    conversationsLoadError,
    setConversationsRetryKey: () => {
      void convQ.refetch();
    },
    isFollowing,
    followingListFetch,
    followingLoadError,
    setFollowingRetryKey: () => {
      void followingQ.refetch();
    },
    followBusy,
    followToast,
    handleFollowToggle,
    msgHref,
  };
}
