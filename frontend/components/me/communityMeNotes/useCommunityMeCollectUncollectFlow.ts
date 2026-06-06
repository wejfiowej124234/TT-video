"use client";

import { useCallback } from "react";
import { useCommunityMeUncollectConfirm } from "@/components/community/useCommunityMeUncollectConfirm";

/** 收藏列表 ⋮「取消收藏」：L5 确认后再调用 collect toggle */
export function useCommunityMeCollectUncollectFlow(
  handleCollect: (postId: string) => void | Promise<void>,
) {
  const performUncollect = useCallback(
    async (postId: string) => {
      await handleCollect(postId);
    },
    [handleCollect],
  );

  return useCommunityMeUncollectConfirm(performUncollect);
}
