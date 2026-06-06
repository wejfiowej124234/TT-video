"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { getMeCollects, getMeFollowing } from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { COMMUNITY_ME_DRAWER_LIST_ID_CAP } from "@/lib/communityMeDrawerListCaps";
import { loadShowcaseFollowIds } from "@/lib/communityShowcaseFollowStorage";
import type { LocaleInterpolationVars } from "@/lib/i18n";

type CommunityFeedTFunc = (key: string, vars?: LocaleInterpolationVars) => string;

function scheduleCommunityMeSocialFetch(run: () => void): () => void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const id = window.requestIdleCallback(run, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }
  const timer = window.setTimeout(run, 100);
  return () => window.clearTimeout(timer);
}

/** `GET …/me/collects` + `GET …/me/following`：登录时拉取；登出时清空（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedMeFollowingCollects(isLoggedIn: boolean, t: CommunityFeedTFunc) {
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [collectedPostIds, setCollectedPostIds] = useState<Set<string>>(new Set());
  const [meCollectsLoadError, setMeCollectsLoadError] = useState<string | null>(null);
  const [meCollectsRetryTick, setMeCollectsRetryTick] = useState(0);

  const retryMeCollectsLoad = useCallback(() => {
    setMeCollectsRetryTick((k) => k + 1);
  }, []);

  useEffect(() => {
    const showcaseFollowIds = [...loadShowcaseFollowIds()];
    if (!isLoggedIn) {
      setFollowingIds(showcaseFollowIds);
      setCollectedPostIds(new Set());
      setMeCollectsLoadError(null);
      return;
    }
    let cancelled = false;
    const cancelSchedule = scheduleCommunityMeSocialFetch(() => {
      if (cancelled) return;
      getMeCollects({ limit: COMMUNITY_ME_DRAWER_LIST_ID_CAP })
        .then((data) => {
          if (cancelled) return;
          setMeCollectsLoadError(null);
          const list = data.collects ?? [];
          setCollectedPostIds(new Set(list.map((c) => c.post_id).filter(Boolean) as string[]));
        })
        .catch((err) => {
          if (!cancelled) {
            if (typeof window !== "undefined") {
              console.error("useCommunityFeedMeFollowingCollects getMeCollects:", err);
            }
            setMeCollectsLoadError(mapApiReadError(err, t, "community_me_collects_loadFailed"));
          }
        });
      getMeFollowing()
        .then((data) => {
          if (cancelled) return;
          const list = data.following ?? [];
          const ids = list.map((u) => u.id).filter(Boolean) as string[];
          setFollowingIds([...new Set([...ids, ...showcaseFollowIds])]);
        })
        .catch((err) => {
          if (!cancelled) {
            if (typeof window !== "undefined") {
              console.error("useCommunityFeedMeFollowingCollects getMeFollowing:", err);
            }
            setFollowingIds(showcaseFollowIds);
          }
        });
    });
    return () => {
      cancelled = true;
      cancelSchedule();
    };
  }, [isLoggedIn, meCollectsRetryTick, t]);

  return {
    followingIds,
    setFollowingIds,
    collectedPostIds,
    setCollectedPostIds,
    meCollectsLoadError,
    retryMeCollectsLoad,
  };
}
