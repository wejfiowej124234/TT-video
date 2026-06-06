"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT,
  COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY,
  readHideLikesReceivedMetric,
  setHideLikesReceivedMetric as persistHideLikesReceivedMetric,
} from "@/lib/communityMeLikesMetricPrivacy";

/** 与 `GET …/community/me/likes-received` 拉取及统计条「获赞」列对齐；跨标签用 `storage` + 同页 `CustomEvent`。勾选隐藏时的 **`removeQueries`** 见 **`useCommunityMeLikesReceivedCachePurgeOnHide`**（Me / 活动 / 消息挂载）。 */
export function useCommunityMeHideLikesReceivedMetric(): readonly [boolean, (hidden: boolean) => void] {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(readHideLikesReceivedMetric());
    const onStorage = (e: StorageEvent) => {
      if (e.key != null && e.key !== COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY) return;
      setHidden(readHideLikesReceivedMetric());
    };
    const onCustom = () => setHidden(readHideLikesReceivedMetric());
    window.addEventListener("storage", onStorage);
    window.addEventListener(COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT, onCustom);
    };
  }, []);

  const setHiddenPersisted = useCallback((next: boolean) => {
    persistHideLikesReceivedMetric(next);
    setHidden(next);
  }, []);

  return [hidden, setHiddenPersisted] as const;
}
