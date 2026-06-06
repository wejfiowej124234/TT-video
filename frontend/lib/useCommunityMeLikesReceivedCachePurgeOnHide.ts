"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { communityMeLikesReceivedQueryKey } from "@/lib/communityMeLikesReceivedContract";
import {
  COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT,
  COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY,
  readHideLikesReceivedMetric,
} from "@/lib/communityMeLikesMetricPrivacy";

/**
 * Me / 活动 / 消息页挂载：本机偏好为「隐藏获赞」时 `removeQueries` 共享键（含跨标签 `storage`、同页 `CustomEvent`、首屏已隐藏）。
 * 与 `communityMeLikesReceivedQueryKey` 同源；①②③ 无环境分叉。
 */
export function useCommunityMeLikesReceivedCachePurgeOnHide(): void {
  const qc = useQueryClient();
  useEffect(() => {
    const purgeIfHidden = () => {
      if (readHideLikesReceivedMetric()) {
        void qc.removeQueries({ queryKey: communityMeLikesReceivedQueryKey });
      }
    };
    purgeIfHidden();
    const onStorage = (e: StorageEvent) => {
      if (e.key != null && e.key !== COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY) return;
      purgeIfHidden();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT, purgeIfHidden);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT, purgeIfHidden);
    };
  }, [qc]);
}
