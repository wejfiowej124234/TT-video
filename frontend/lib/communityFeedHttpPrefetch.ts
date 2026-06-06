import type { QueryClient } from "@tanstack/react-query";
import type { CommunityFeedApiMode } from "@/components/community/useCommunityFeedApi";
import { warmCommunityMainFeed } from "@/lib/communityFeedInfiniteQuery";

/** ① · Feed 首屏预热（与 `useCommunityFeedApi` React Query cache 同源；无 QueryClient 时 no-op） */
export function warmCommunityFeedHttp(args: {
  mode: CommunityFeedApiMode | "recommend";
  limit: number;
  tag?: string | null;
  queryClient?: QueryClient;
}): void {
  if (typeof window === "undefined") return;
  const { queryClient, mode, tag } = args;
  if (!queryClient) return;
  if (mode === "recommend") return;
  warmCommunityMainFeed(queryClient, {
    mode: mode as CommunityFeedApiMode,
    tag: tag ?? null,
  });
}
