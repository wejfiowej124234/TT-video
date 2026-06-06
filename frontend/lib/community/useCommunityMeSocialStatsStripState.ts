"use client";

import { useCallback, useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { getMeFollowing, getMeFollowers, getFriendsList, getMeLikesReceived } from "@/lib/apiClient/community";
import {
  communityMeLikesReceivedQueryKey,
  parseCommunityMeLikesReceivedResponse,
} from "@/lib/communityMeLikesReceivedContract";
import { COMMUNITY_ME_FOLLOWERS_QUERY_KEY } from "@/lib/communityFriendsQueryKeys";
import { COMMUNITY_ME_FOLLOWING_QUERY_KEY } from "@/lib/communityMeListQueries";
import { countCommunityMeSocialList } from "@/lib/communityMeSocialListsContract";
import { deriveCommunitySocialStatsDataState } from "@/lib/dataState";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";

const STATS_STALE_MS = 60_000;

/** 社区资料 · 社交统计条（关注/粉丝/好友/获赞） */
export function useCommunityMeSocialStatsStripState(
  enabled: boolean,
  t: (key: string) => string,
  hideLikesReceivedMetric = false,
) {
  const queryClient = useQueryClient();
  const likesListEnabled = isCommunityMeLikesListEnabled();

  const [a, b, c, likesQ] = useQueries({
    queries: [
      {
        queryKey: COMMUNITY_ME_FOLLOWING_QUERY_KEY,
        queryFn: getMeFollowing,
        staleTime: STATS_STALE_MS,
        enabled,
      },
      {
        queryKey: COMMUNITY_ME_FOLLOWERS_QUERY_KEY,
        queryFn: getMeFollowers,
        staleTime: STATS_STALE_MS,
        enabled,
      },
      {
        queryKey: ["community", "friendsList"],
        queryFn: getFriendsList,
        staleTime: STATS_STALE_MS,
        enabled,
      },
      {
        queryKey: communityMeLikesReceivedQueryKey,
        queryFn: getMeLikesReceived,
        staleTime: STATS_STALE_MS,
        enabled: enabled && likesListEnabled,
      },
    ],
  });

  const likesSettled = !likesListEnabled || likesQ.isSuccess || likesQ.isError;
  const socialSettled =
    enabled && (a.isSuccess || a.isError) && (b.isSuccess || b.isError) && (c.isSuccess || c.isError) && likesSettled;

  const nWatched = likesListEnabled ? 4 : 3;
  let socialQueryErrorCount = 0;
  if (a.isError) socialQueryErrorCount += 1;
  if (b.isError) socialQueryErrorCount += 1;
  if (c.isError) socialQueryErrorCount += 1;
  if (likesListEnabled && likesQ.isError) socialQueryErrorCount += 1;

  const socialStatsFatalError = socialSettled && socialQueryErrorCount === nWatched;
  const socialStatsPartialFailure =
    socialSettled && socialQueryErrorCount > 0 && socialQueryErrorCount < nWatched;
  const socialStatsReady = socialSettled && !socialStatsFatalError;
  const statsLoading = enabled && !socialStatsFatalError && !socialSettled;

  const refetchSocialStats = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_ME_FOLLOWING_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_ME_FOLLOWERS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ["community", "friendsList"] });
    if (likesListEnabled) {
      void queryClient.invalidateQueries({ queryKey: communityMeLikesReceivedQueryKey });
    }
  }, [likesListEnabled, queryClient]);

  const followingParsed =
    a.isSuccess && a.data != null ? countCommunityMeSocialList(a.data, "following") : null;
  const followersParsed =
    b.isSuccess && b.data != null ? countCommunityMeSocialList(b.data, "followers") : null;
  const friendsParsed = c.isSuccess && c.data != null ? countCommunityMeSocialList(c.data, "friends") : null;
  const followingCount = followingParsed?.kind === "ok" ? followingParsed.n : 0;
  const followersCount = followersParsed?.kind === "ok" ? followersParsed.n : 0;
  const friendsCount = friendsParsed?.kind === "ok" ? friendsParsed.n : 0;
  const followingCountUnknown = Boolean(a.isSuccess && a.data != null && followingParsed?.kind === "invalid");
  const followersCountUnknown = Boolean(b.isSuccess && b.data != null && followersParsed?.kind === "invalid");
  const friendsCountUnknown = Boolean(c.isSuccess && c.data != null && friendsParsed?.kind === "invalid");

  const likesParse =
    likesListEnabled && likesQ.isSuccess && likesQ.data != null
      ? parseCommunityMeLikesReceivedResponse(likesQ.data)
      : null;
  const likesReceivedUnknown =
    Boolean(likesListEnabled && likesQ.isSuccess && likesParse?.kind === "invalid");
  const likesReceived = likesListEnabled && likesParse?.kind === "ok" ? likesParse.n : 0;

  const showLikesReceivedMetric = likesListEnabled && !hideLikesReceivedMetric;

  const socialStatsState = useMemo(
    () =>
      deriveCommunitySocialStatsDataState({
        statsLoading,
        statsError: socialStatsFatalError,
        partialFailure: socialStatsPartialFailure,
        likesReceivedUnknown,
        followingCountUnknown,
        followersCountUnknown,
        friendsCountUnknown,
        socialStatsReady,
        followingCount,
        followersCount,
        friendsCount,
        likesReceived,
        errorMessage: t("community_me_social_stats_error"),
        contractInvalidMessage: t("community_errorTitle"),
        includeLikesReceivedMetric: showLikesReceivedMetric,
      }),
    [
      statsLoading,
      socialStatsFatalError,
      socialStatsPartialFailure,
      likesReceivedUnknown,
      followingCountUnknown,
      followersCountUnknown,
      friendsCountUnknown,
      socialStatsReady,
      followingCount,
      followersCount,
      friendsCount,
      likesReceived,
      showLikesReceivedMetric,
      t,
    ],
  );

  return {
    socialStatsState,
    refetchSocialStats,
    showLikesReceivedMetric,
    likesListEnabled,
  };
}
