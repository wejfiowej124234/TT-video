"use client";



import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { COMMUNITY_ME_COLLECTS_HYDRATE_PAGE_SIZE } from "@/lib/communityMeListPageSize";

import { hydrateCommunityMeCollectPostIds } from "@/lib/communityMeCollectsHydrateBatch";

import { mapApiReadError } from "@/lib/mapApiReadError";

import type { CommunityPost } from "@/lib/communityMockData";

import {

  COMMUNITY_ME_COLLECTS_IDS_QUERY_KEY,

  COMMUNITY_ME_LIST_STALE_MS,

  fetchCommunityMeCollectsIds,

} from "@/lib/communityMeListQueries";



import type { LocaleTranslateFn } from "@/lib/i18n";



export function useCommunityMeCollectsHydratedList(args: {

  retryKey: number;

  t: LocaleTranslateFn;

  isLoggedIn: boolean;

  authPending: boolean;

}): {

  apiPosts: CommunityPost[];

  setApiPosts: Dispatch<SetStateAction<CommunityPost[]>>;

  setCollectIds: Dispatch<SetStateAction<string[]>>;

  loading: boolean;

  listLoadError: string | null;

  partialHint: string | null;

  collectsListTruncated: boolean;

  collectsHasMore: boolean;

  collectsLoadMoreBusy: boolean;

  loadMoreCollects: () => void;

} {

  const { retryKey, t, isLoggedIn, authPending } = args;

  const queryClient = useQueryClient();

  const [apiPosts, setApiPosts] = useState<CommunityPost[]>([]);

  const [collectIds, setCollectIds] = useState<string[]>([]);

  const [hydratedOffset, setHydratedOffset] = useState(0);

  const [partialHint, setPartialHint] = useState<string | null>(null);

  const [collectsLoadMoreBusy, setCollectsLoadMoreBusy] = useState(false);

  const [hydrateError, setHydrateError] = useState<string | null>(null);

  const loadMoreInFlightRef = useRef(false);

  const listEnabled = !authPending && isLoggedIn;



  useEffect(() => {

    if (retryKey === 0) return;

    void queryClient.invalidateQueries({ queryKey: COMMUNITY_ME_COLLECTS_IDS_QUERY_KEY });

  }, [retryKey, queryClient]);



  const idsQ = useQuery({

    queryKey: COMMUNITY_ME_COLLECTS_IDS_QUERY_KEY,

    queryFn: fetchCommunityMeCollectsIds,

    enabled: listEnabled,

    staleTime: COMMUNITY_ME_LIST_STALE_MS,

  });



  useEffect(() => {

    if (!listEnabled) {

      setCollectIds([]);

      setHydratedOffset(0);

      setApiPosts([]);

      setPartialHint(null);

      setHydrateError(null);

      return;

    }

    if (idsQ.isPending || idsQ.isFetching) return;

    if (idsQ.isError) {

      setCollectIds([]);

      setHydratedOffset(0);

      setApiPosts([]);

      setPartialHint(null);

      setHydrateError(mapApiReadError(idsQ.error, t, "community_me_collects_loadFailed"));

      return;

    }

    const payload = idsQ.data;

    if (payload == null) return;

    if (payload.kind === "invalid") {

      setCollectIds([]);

      setHydratedOffset(0);

      setApiPosts([]);

      setPartialHint(null);

      setHydrateError(t("community_me_collects_loadFailed"));

      return;

    }

    const ids = payload.ids;

    setCollectIds(ids);

    setHydrateError(null);

    setPartialHint(null);

    if (ids.length === 0) {

      setHydratedOffset(0);

      setApiPosts([]);

      return;

    }

    let cancelled = false;

    const batch = ids.slice(0, COMMUNITY_ME_COLLECTS_HYDRATE_PAGE_SIZE);

    void hydrateCommunityMeCollectPostIds(batch).then(({ posts, failedOrMissing, firstReject }) => {

      if (cancelled) return;

      setHydratedOffset(batch.length);

      if (posts.length === 0) {

        setApiPosts([]);

        const explainAllMissing = t("community_me_collects_all_posts_unavailable", {

          n: String(batch.length),

        });

        setHydrateError(

          firstReject != null

            ? `${explainAllMissing} ${mapApiReadError(firstReject, t, "community_me_collects_loadFailed")}`

            : explainAllMissing,

        );

        return;

      }

      setApiPosts(posts);

      setHydrateError(null);

      if (failedOrMissing > 0) {

        setPartialHint(t("community_me_collects_partial_load_hint", { n: String(failedOrMissing) }));

      }

    });

    return () => {

      cancelled = true;

    };

  }, [listEnabled, idsQ.data, idsQ.isPending, idsQ.isFetching, idsQ.isError, idsQ.error, t]);



  const loading =

    authPending || !isLoggedIn

      ? false

      : idsQ.isPending || (listEnabled && collectIds.length > 0 && hydratedOffset === 0 && apiPosts.length === 0 && !hydrateError && !idsQ.isError);



  const listLoadError =

    !listEnabled

      ? null

      : idsQ.isError

        ? mapApiReadError(idsQ.error, t, "community_me_collects_loadFailed")

        : hydrateError;



  const collectsListTruncated = idsQ.data?.kind === "ok" ? idsQ.data.truncated : false;

  const collectsHasMore = collectIds.length > hydratedOffset;



  const loadMoreCollects = useCallback(() => {

    if (!collectsHasMore || loadMoreInFlightRef.current) return;

    const batch = collectIds.slice(hydratedOffset, hydratedOffset + COMMUNITY_ME_COLLECTS_HYDRATE_PAGE_SIZE);

    if (batch.length === 0) return;

    loadMoreInFlightRef.current = true;

    setCollectsLoadMoreBusy(true);

    void hydrateCommunityMeCollectPostIds(batch)

      .then(({ posts, failedOrMissing }) => {

        setHydratedOffset((prev) => prev + batch.length);

        if (posts.length > 0) {

          setApiPosts((prev) => {

            const seen = new Set(prev.map((p) => p.id));

            const appended = posts.filter((p) => !seen.has(p.id));

            return appended.length > 0 ? [...prev, ...appended] : prev;

          });

        }

        if (failedOrMissing > 0) {

          setPartialHint((prev) =>

            prev ?? t("community_me_collects_partial_load_hint", { n: String(failedOrMissing) }),

          );

        }

      })

      .catch((err) => {

        if (typeof window !== "undefined") {

          console.error("CommunityMeCollects loadMore hydrate:", err);

        }

        setHydrateError(mapApiReadError(err, t, "community_me_collects_loadFailed"));

      })

      .finally(() => {

        loadMoreInFlightRef.current = false;

        setCollectsLoadMoreBusy(false);

      });

  }, [collectIds, collectsHasMore, hydratedOffset, t]);



  return {

    apiPosts,

    setApiPosts,

    setCollectIds,

    loading,

    listLoadError,

    partialHint,

    collectsListTruncated,

    collectsHasMore,

    collectsLoadMoreBusy,

    loadMoreCollects,

  };

}

