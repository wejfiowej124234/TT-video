"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { CommunityPost } from "@/lib/communityMockData";
import { getPostById } from "@/lib/apiClient/community";
import { mapApiPostToCommunityPost } from "@/components/community/communityFeedMappers";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import {
  findCommunityShowcasePostById,
  isShowcasePostId,
} from "@/lib/communityShowcase";

type CommunityFeedTFunc = (key: string, vars?: LocaleInterpolationVars) => string;

export type CommunityFeedPostDeepLinkAlert =
  | { kind: "unavailable" }
  | { kind: "load_failed"; message: string };

function stripPostQueryFromUrl(): void {
  if (typeof window === "undefined") return;
  const u = new URL(window.location.href);
  if (!u.searchParams.has("post")) return;
  u.searchParams.delete("post");
  window.history.replaceState({}, "", `${u.pathname}${u.search || ""}`);
}

function clearDeepLinkUiState(
  setPostDeepLinkBusy: Dispatch<SetStateAction<boolean>>,
  setPostDeepLinkAlert: Dispatch<SetStateAction<CommunityFeedPostDeepLinkAlert | null>>,
  setPostDeepLinkLastId: Dispatch<SetStateAction<string | null>>,
) {
  setPostDeepLinkBusy((busy) => (busy ? false : busy));
  setPostDeepLinkAlert((alert) => (alert === null ? alert : null));
  setPostDeepLinkLastId((id) => (id === null ? id : null));
}

function openDeepLinkPost(
  post: CommunityPost,
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>,
  setPostDeepLinkBusy: Dispatch<SetStateAction<boolean>>,
  setPostDeepLinkAlert: Dispatch<SetStateAction<CommunityFeedPostDeepLinkAlert | null>>,
  setPostDeepLinkLastId: Dispatch<SetStateAction<string | null>>,
) {
  setDetailPost(post);
  stripPostQueryFromUrl();
  clearDeepLinkUiState(setPostDeepLinkBusy, setPostDeepLinkAlert, setPostDeepLinkLastId);
}

function markDeepLinkHandled(
  postQuery: string,
  handledPostRef: MutableRefObject<string | null>,
  inflightPostRef: MutableRefObject<string | null>,
) {
  handledPostRef.current = postQuery;
  inflightPostRef.current = null;
}

/** `?post=` 深链：列表命中或按 id 拉详情；重试/关闭（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedPostDeepLink({
  searchParams,
  allPosts,
  searchFilteredPosts,
  postDeepLinkLastId,
  t,
  setDetailPost,
  setPostDeepLinkBusy,
  setPostDeepLinkAlert,
  setPostDeepLinkLastId,
}: {
  searchParams: { get: (key: string) => string | null } | null;
  allPosts: CommunityPost[];
  searchFilteredPosts: CommunityPost[];
  postDeepLinkLastId: string | null;
  t: CommunityFeedTFunc;
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setPostDeepLinkBusy: Dispatch<SetStateAction<boolean>>;
  setPostDeepLinkAlert: Dispatch<SetStateAction<CommunityFeedPostDeepLinkAlert | null>>;
  setPostDeepLinkLastId: Dispatch<SetStateAction<string | null>>;
}) {
  const postQuery = searchParams?.get("post")?.trim() ?? "";

  const allPostsRef = useRef(allPosts);
  const searchFilteredPostsRef = useRef(searchFilteredPosts);
  allPostsRef.current = allPosts;
  searchFilteredPostsRef.current = searchFilteredPosts;

  const tRef = useRef(t);
  tRef.current = t;

  const setDetailPostRef = useRef(setDetailPost);
  setDetailPostRef.current = setDetailPost;
  const setPostDeepLinkBusyRef = useRef(setPostDeepLinkBusy);
  setPostDeepLinkBusyRef.current = setPostDeepLinkBusy;
  const setPostDeepLinkAlertRef = useRef(setPostDeepLinkAlert);
  setPostDeepLinkAlertRef.current = setPostDeepLinkAlert;
  const setPostDeepLinkLastIdRef = useRef(setPostDeepLinkLastId);
  setPostDeepLinkLastIdRef.current = setPostDeepLinkLastId;

  const handledPostRef = useRef<string | null>(null);
  const inflightPostRef = useRef<string | null>(null);

  const dismissPostDeepLinkIssue = useCallback(() => {
    setPostDeepLinkAlertRef.current(null);
    setPostDeepLinkLastIdRef.current(null);
    handledPostRef.current = null;
    inflightPostRef.current = null;
  }, []);

  const retryPostDeepLinkFetch = useCallback(() => {
    const id = postDeepLinkLastId?.trim();
    if (!id) return;
    handledPostRef.current = null;
    inflightPostRef.current = null;
    setPostDeepLinkAlertRef.current(null);
    setPostDeepLinkBusyRef.current(true);
    const showcase = findCommunityShowcasePostById(id);
    if (showcase) {
      setDetailPostRef.current(showcase);
      clearDeepLinkUiState(
        setPostDeepLinkBusyRef.current,
        setPostDeepLinkAlertRef.current,
        setPostDeepLinkLastIdRef.current,
      );
      handledPostRef.current = id;
      return;
    }
    inflightPostRef.current = id;
    void (async () => {
      try {
        const res = await getPostById(id);
        const row = res.post;
        if (res.status === "ok" && row?.id) {
          setDetailPostRef.current(mapApiPostToCommunityPost(row));
          clearDeepLinkUiState(
            setPostDeepLinkBusyRef.current,
            setPostDeepLinkAlertRef.current,
            setPostDeepLinkLastIdRef.current,
          );
          handledPostRef.current = id;
        } else {
          setPostDeepLinkAlertRef.current({ kind: "unavailable" });
        }
      } catch (e) {
        setPostDeepLinkAlertRef.current({
          kind: "load_failed",
          message: mapApiReadError(e, tRef.current, "community_postDeepLink_loadFailed"),
        });
      } finally {
        inflightPostRef.current = null;
        setPostDeepLinkBusyRef.current((busy) => (busy ? false : busy));
      }
    })();
  }, [postDeepLinkLastId]);

  useEffect(() => {
    if (!postQuery || typeof window === "undefined") {
      if (!postQuery) {
        handledPostRef.current = null;
        inflightPostRef.current = null;
      }
      return;
    }

    if (handledPostRef.current === postQuery || inflightPostRef.current === postQuery) {
      return;
    }

    const all = allPostsRef.current;
    const filtered = searchFilteredPostsRef.current;
    const found = all.find((p) => p.id === postQuery) ?? filtered.find((p) => p.id === postQuery);

    if (found) {
      if (isShowcasePostId(found.id)) {
        openDeepLinkPost(
          found,
          setDetailPostRef.current,
          setPostDeepLinkBusyRef.current,
          setPostDeepLinkAlertRef.current,
          setPostDeepLinkLastIdRef.current,
        );
        markDeepLinkHandled(postQuery, handledPostRef, inflightPostRef);
        return;
      }
      const engagementComplete =
        typeof found.likedByMe === "boolean" && typeof found.collectedByMe === "boolean";
      if (!engagementComplete) {
        inflightPostRef.current = postQuery;
        setPostDeepLinkAlertRef.current((alert) => (alert === null ? alert : null));
        setPostDeepLinkLastIdRef.current((id) => (id === postQuery ? id : postQuery));
        setPostDeepLinkBusyRef.current((busy) => (busy ? busy : true));
        let cancelled = false;
        void (async () => {
          try {
            const res = await getPostById(postQuery);
            if (cancelled) return;
            const row = res.post;
            if (res.status === "ok" && row?.id) {
              setDetailPostRef.current(mapApiPostToCommunityPost(row));
              clearDeepLinkUiState(
                setPostDeepLinkBusyRef.current,
                setPostDeepLinkAlertRef.current,
                setPostDeepLinkLastIdRef.current,
              );
            } else {
              openDeepLinkPost(
                found,
                setDetailPostRef.current,
                setPostDeepLinkBusyRef.current,
                setPostDeepLinkAlertRef.current,
                setPostDeepLinkLastIdRef.current,
              );
            }
            markDeepLinkHandled(postQuery, handledPostRef, inflightPostRef);
          } catch {
            if (!cancelled) {
              openDeepLinkPost(
                found,
                setDetailPostRef.current,
                setPostDeepLinkBusyRef.current,
                setPostDeepLinkAlertRef.current,
                setPostDeepLinkLastIdRef.current,
              );
              markDeepLinkHandled(postQuery, handledPostRef, inflightPostRef);
            }
          } finally {
            if (!cancelled) {
              stripPostQueryFromUrl();
              setPostDeepLinkBusyRef.current((busy) => (busy ? false : busy));
              inflightPostRef.current = null;
            }
          }
        })();
        return () => {
          cancelled = true;
        };
      }
      openDeepLinkPost(
        found,
        setDetailPostRef.current,
        setPostDeepLinkBusyRef.current,
        setPostDeepLinkAlertRef.current,
        setPostDeepLinkLastIdRef.current,
      );
      markDeepLinkHandled(postQuery, handledPostRef, inflightPostRef);
      return;
    }

    const showcasePost = findCommunityShowcasePostById(postQuery);
    if (showcasePost) {
      openDeepLinkPost(
        showcasePost,
        setDetailPostRef.current,
        setPostDeepLinkBusyRef.current,
        setPostDeepLinkAlertRef.current,
        setPostDeepLinkLastIdRef.current,
      );
      markDeepLinkHandled(postQuery, handledPostRef, inflightPostRef);
      return;
    }

    inflightPostRef.current = postQuery;
    setPostDeepLinkAlertRef.current((alert) => (alert === null ? alert : null));
    setPostDeepLinkLastIdRef.current((id) => (id === postQuery ? id : postQuery));
    setPostDeepLinkBusyRef.current((busy) => (busy ? busy : true));

    let cancelled = false;
    void (async () => {
      try {
        const res = await getPostById(postQuery);
        if (cancelled) return;
        const row = res.post;
        if (res.status === "ok" && row?.id) {
          setDetailPostRef.current(mapApiPostToCommunityPost(row));
          clearDeepLinkUiState(
            setPostDeepLinkBusyRef.current,
            setPostDeepLinkAlertRef.current,
            setPostDeepLinkLastIdRef.current,
          );
          markDeepLinkHandled(postQuery, handledPostRef, inflightPostRef);
        } else {
          setPostDeepLinkAlertRef.current({ kind: "unavailable" });
        }
      } catch (e) {
        if (cancelled) return;
        setPostDeepLinkAlertRef.current({
          kind: "load_failed",
          message: mapApiReadError(e, tRef.current, "community_postDeepLink_loadFailed"),
        });
      } finally {
        if (!cancelled) {
          stripPostQueryFromUrl();
          setPostDeepLinkBusyRef.current((busy) => (busy ? false : busy));
          inflightPostRef.current = null;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postQuery]);

  return { dismissPostDeepLinkIssue, retryPostDeepLinkFetch };
}
