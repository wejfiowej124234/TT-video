"use client";

import { useCallback } from "react";
import { useCommunityMeUnlikeConfirm } from "@/components/community/useCommunityMeUnlikeConfirm";

/** 赞过列表 ⋮「取消赞」：L5 确认后再调用 like toggle */
export function useCommunityMeLikesUnlikeFlow(
  handleLike: (postId: string) => void | Promise<void>,
) {
  const performUnlike = useCallback(
    async (postId: string) => {
      await handleLike(postId);
    },
    [handleLike],
  );

  return useCommunityMeUnlikeConfirm(performUnlike);
}
