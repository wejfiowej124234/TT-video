"use client";



import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from "react";

import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { mapApiReadError } from "@/lib/mapApiReadError";

import type { CommunityPost } from "@/lib/communityMockData";

import type { CommunityMePostsVisFilterKey } from "@/lib/communityMePostsVisFilters";

import {

  COMMUNITY_ME_LIST_STALE_MS,

  communityMePostsQueryKey,

  fetchCommunityMePostsPage,

  type CommunityMePostsPageData,

} from "@/lib/communityMeListQueries";



function flattenPostsPages(data: InfiniteData<CommunityMePostsPageData> | undefined): CommunityPost[] {

  if (!data?.pages?.length) return [];

  const seen = new Set<string>();

  const out: CommunityPost[] = [];

  for (const page of data.pages) {

    for (const p of page.posts) {

      if (seen.has(p.id)) continue;

      seen.add(p.id);

      out.push(p);

    }

  }

  return out;

}



function collapsePostsCache(

  old: InfiniteData<CommunityMePostsPageData> | undefined,

  next: CommunityPost[],

): InfiniteData<CommunityMePostsPageData> {

  const tailCursor = old?.pages?.[old.pages.length - 1]?.next_cursor ?? "";

  return {

    pages: [{ posts: next, next_cursor: tailCursor }],

    pageParams: [undefined],

  };

}



export function useCommunityMePostsPageMyPostsQuery(args: {

  postsRetryKey: number;

  postsVisFilter: CommunityMePostsVisFilterKey;

  t: (k: string) => string;

  isLoggedIn: boolean;

  authPending: boolean;

}): {

  apiPosts: CommunityPost[];

  setApiPosts: Dispatch<SetStateAction<CommunityPost[]>>;

  loading: boolean;

  postsLoadError: string | null;

  postsListTruncated: boolean;

  postsHasMore: boolean;

  postsLoadMoreBusy: boolean;

  loadMorePosts: () => void;

} {

  const { postsRetryKey, postsVisFilter, t, isLoggedIn, authPending } = args;

  const queryClient = useQueryClient();

  const listEnabled = !authPending && isLoggedIn;

  const queryKey = communityMePostsQueryKey(postsVisFilter);



  useEffect(() => {

    if (postsRetryKey === 0) return;

    void queryClient.invalidateQueries({ queryKey });

  }, [postsRetryKey, queryClient, queryKey]);



  const postsInfinite = useInfiniteQuery({

    queryKey,

    staleTime: COMMUNITY_ME_LIST_STALE_MS,

    initialPageParam: undefined as string | undefined,

    enabled: listEnabled,

    queryFn: ({ pageParam }) => fetchCommunityMePostsPage(postsVisFilter, pageParam),

    getNextPageParam: (last) => {

      const c = last.next_cursor?.trim();

      return c && c.length > 0 ? c : undefined;

    },

  });



  const apiPosts = useMemo(() => flattenPostsPages(postsInfinite.data), [postsInfinite.data]);



  const setApiPosts = useCallback(

    (action: SetStateAction<CommunityPost[]>) => {

      queryClient.setQueryData<InfiniteData<CommunityMePostsPageData>>(queryKey, (old) => {

        const current = flattenPostsPages(old);

        const next = typeof action === "function" ? action(current) : action;

        return collapsePostsCache(old, next);

      });

    },

    [queryClient, queryKey],

  );



  const postsLoadError = useMemo(() => {

    if (!listEnabled) return null;

    if (postsInfinite.isError) {

      const err = postsInfinite.error;

      if (err instanceof Error && err.message === "community_me_posts_list_contract_invalid") {

        return t("api_list_items_contract_error");

      }

      return mapApiReadError(err, t, "community_me_posts_loadFailed");

    }

    return null;

  }, [listEnabled, postsInfinite.isError, postsInfinite.error, t]);



  const loading = listEnabled && postsInfinite.isPending && apiPosts.length === 0;

  const lastPage = postsInfinite.data?.pages?.[postsInfinite.data.pages.length - 1];

  const postsHasMore = Boolean(postsInfinite.hasNextPage);

  const postsListTruncated = postsHasMore || Boolean(lastPage?.next_cursor?.trim());



  return {

    apiPosts,

    setApiPosts,

    loading,

    postsLoadError,

    postsListTruncated,

    postsHasMore,

    postsLoadMoreBusy: postsInfinite.isFetchingNextPage,

    loadMorePosts: () => {

      void postsInfinite.fetchNextPage();

    },

  };

}

