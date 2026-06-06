"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CommunityFeedApiMode } from "@/components/community/useCommunityFeedApi";
import { warmCommunityTopicTagFeed } from "@/lib/communityFeedInfiniteQuery";

/** 话题 # 链 hover 预热（与 `useCommunityFeedApi` tag 筛选 cache 同源） */
export function useCommunityTopicTagWarm(mode: CommunityFeedApiMode = "latest") {
  const queryClient = useQueryClient();
  return useCallback(
    (tag: string) => warmCommunityTopicTagFeed(queryClient, tag, mode),
    [queryClient, mode],
  );
}
