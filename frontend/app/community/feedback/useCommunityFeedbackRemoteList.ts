"use client";

import { useState, useCallback, useEffect } from "react";
import { getFeedbackList } from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { dedupeListById } from "@/lib/dedupeListById";
import { mediaUrlsToItems } from "@/lib/communityFeedbackDisplay";
import {
  loadFeedbackLocalBrowser,
  saveFeedbackLocalBrowser,
  type CommunityFeedbackLocalItem,
} from "@/lib/communityFeedbackLocal";

export type FeedbackPageListItem = CommunityFeedbackLocalItem;

export function useCommunityFeedbackRemoteList(t: (key: string) => string) {
  const [list, setList] = useState<FeedbackPageListItem[]>([]);
  const [serverListSynced, setServerListSynced] = useState(false);
  const [listFetchError, setListFetchError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [listFetchRetryKey, setListFetchRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const local = loadFeedbackLocalBrowser();
    setListFetchError(null);
    getFeedbackList()
      .then((data) => {
        if (cancelled) return;
        if (data?.status === "ok" && Array.isArray(data.items)) {
          setListFetchError(null);
          setServerListSynced(true);
          const serverItems: FeedbackPageListItem[] = data.items.map((r) => ({
            id: r.id,
            category: r.category,
            content: r.content,
            status: r.status,
            official_reply: r.official_reply ?? undefined,
            created_at: r.created_at,
            local: false,
            media: mediaUrlsToItems(r.media_urls),
          }));
          setList(dedupeListById(serverItems, (x) => x.id));
        } else {
          setListFetchError(null);
          setServerListSynced(false);
          setList(dedupeListById(local, (x) => x.id));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("CommunityFeedbackPage getFeedbackList:", err);
          }
          setListFetchError(mapApiReadError(err, t, "community_feedback_list_load_failed"));
          setServerListSynced(false);
          setList(dedupeListById(local, (x) => x.id));
        }
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [listFetchRetryKey, t]);

  useEffect(() => {
    if (!hydrated) return;
    saveFeedbackLocalBrowser(list);
  }, [hydrated, list]);

  const retryFetch = useCallback(() => {
    setListFetchRetryKey((k) => k + 1);
  }, []);

  return {
    list,
    setList,
    serverListSynced,
    listFetchError,
    hydrated,
    retryFetch,
  };
}
