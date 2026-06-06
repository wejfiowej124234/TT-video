"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PublishPayload } from "@/components/community/PublishDrawer/types";
import { createPost as apiCreatePost } from "@/lib/apiClient/community";
import type { CommunityMeUser } from "@/components/community/CommunityAuthContext";
import type { CommunityPost } from "@/lib/communityMockData";
import { communityCommentAuthorFromMeUser } from "@/lib/communityDrawerCommentSend";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import {
  feedbackMediaEmbeddedPolicyViolationCode,
  isAllowedCommunityVideoCoverUrl,
} from "@/lib/communityPostMediaEmbeddedUrlPolicy";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import {
  COMMUNITY_PUBLISH_COVER_POLICY,
  COMMUNITY_PUBLISH_MEDIA_POLICY,
  COMMUNITY_PUBLISH_MISSING_MEDIA,
  COMMUNITY_PUBLISH_OFFLINE,
  CommunityPublishSubmitRejectedError,
  isCommunityPublishParentOwnedError,
} from "@/lib/communityPublishSubmitError";

type CommunityFeedTFunc = (key: string, vars?: LocaleInterpolationVars) => string;

export function useCommunityFeedPublishSubmit(options: {
  t: CommunityFeedTFunc;
  dash: string;
  communityUser: CommunityMeUser | null;
  feedApiRefetch: () => void;
  setLocalPosts: Dispatch<SetStateAction<CommunityPost[]>>;
  setPublishSendFailed: Dispatch<SetStateAction<boolean>>;
  setPublishErrorMessage: Dispatch<SetStateAction<string | null>>;
  setPublishFieldMessages: Dispatch<SetStateAction<Record<string, string> | null>>;
  setToast: Dispatch<SetStateAction<string | null>>;
  setToastBodyOverride: Dispatch<SetStateAction<string | null>>;
  setToastHint: Dispatch<SetStateAction<string | null>>;
  scheduleToastClear: (ms: number) => void;
  onPublishSuccess?: (payload: PublishPayload) => void;
}) {
  const {
    t,
    dash,
    communityUser,
    feedApiRefetch,
    setLocalPosts,
    setPublishSendFailed,
    setPublishErrorMessage,
    setPublishFieldMessages,
    setToast,
    setToastBodyOverride,
    setToastHint,
    scheduleToastClear,
    onPublishSuccess,
  } = options;

  const clearPublishSendError = useCallback(() => {
    setPublishSendFailed(false);
    setPublishErrorMessage(null);
    setPublishFieldMessages(null);
  }, [setPublishErrorMessage, setPublishFieldMessages, setPublishSendFailed]);

  const handlePublishSubmit = useCallback(
    async (payload: PublishPayload) => {
      setPublishSendFailed(false);
      setPublishErrorMessage(null);
      setPublishFieldMessages(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setPublishErrorMessage(t("community_publish_offline"));
        setPublishSendFailed(true);
        throw new Error(COMMUNITY_PUBLISH_OFFLINE);
      }
      const urls =
        payload.type === "text"
          ? []
          : (payload.mediaUrls ?? []).map((u) => String(u).trim()).filter((u) => u.length > 0);
      if (payload.type !== "text" && urls.length === 0) {
        setPublishErrorMessage(t("community_api_msg_media_required"));
        setPublishSendFailed(true);
        throw new Error(COMMUNITY_PUBLISH_MISSING_MEDIA);
      }
      /** 带 **`media_asset_id`** 时 **`media_urls[0]`** 为服务端 **`ready`** 资产 **`playback_url`**，与 **`POST …/posts`** 门禁同源；勿再用 **`NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES`** 误拦 CDN。 */
      const mediaViol =
        payload.type === "video" && payload.mediaAssetId?.trim()
          ? null
          : feedbackMediaEmbeddedPolicyViolationCode(urls);
      if (mediaViol) {
        const { topMessage, fieldMessages } = interpretCommunityWriteError(
          { status: "error", error: mediaViol, message: mediaViol, errors: { media_urls: mediaViol } },
          t,
          "community_publish_failed",
        );
        setPublishErrorMessage(topMessage);
        setPublishFieldMessages(Object.keys(fieldMessages).length > 0 ? fieldMessages : null);
        setPublishSendFailed(true);
        throw new Error(COMMUNITY_PUBLISH_MEDIA_POLICY);
      }
      const coverOpt = payload.coverUrl?.trim();
      if (payload.type === "video" && coverOpt && !isAllowedCommunityVideoCoverUrl(coverOpt)) {
        const s = coverOpt.trim();
        const looksHttp =
          (s.length >= 7 && s.slice(0, 7).toLowerCase() === "http://") ||
          (s.length >= 8 && s.slice(0, 8).toLowerCase() === "https://");
        if (looksHttp) {
          const cv = feedbackMediaEmbeddedPolicyViolationCode([s]);
          if (cv) {
            const { topMessage, fieldMessages } = interpretCommunityWriteError(
              { status: "error", error: cv, message: cv, errors: { cover_url: cv } },
              t,
              "community_publish_failed",
            );
            setPublishErrorMessage(topMessage);
            setPublishFieldMessages(Object.keys(fieldMessages).length > 0 ? fieldMessages : null);
          } else {
            const msg = t("community_publish_video_cover_invalid");
            setPublishErrorMessage(msg);
            setPublishFieldMessages({ cover_url: msg });
          }
        } else {
          const msg = t("community_publish_video_cover_invalid");
          setPublishErrorMessage(msg);
          setPublishFieldMessages({ cover_url: msg });
        }
        setPublishSendFailed(true);
        throw new Error(COMMUNITY_PUBLISH_COVER_POLICY);
      }
      const newPost: CommunityPost = {
        id: `post-local-${Date.now()}`,
        type: payload.type,
        content: payload.content,
        media_url: urls[0] ?? "",
        media_urls: urls.length > 1 ? urls : undefined,
        is_video: payload.type === "video",
        ...(coverOpt ? { cover_url: coverOpt } : {}),
        tags: [...(payload.tags ?? [])],
        ...(payload.destination?.trim() ? { destination: payload.destination.trim() } : {}),
        author: communityCommentAuthorFromMeUser(communityUser, dash),
        likes: 0,
        comments: 0,
        collects: 0,
        created_at: new Date().toISOString(),
      };
      setLocalPosts((prev) => [newPost, ...prev]);
      try {
        const res = await apiCreatePost({
          body: payload.content,
          post_type: payload.type,
          media_urls: payload.type === "text" ? [] : urls,
          ...(payload.mediaAssetId?.trim() ? { media_asset_id: payload.mediaAssetId.trim() } : {}),
          ...(coverOpt ? { cover_url: coverOpt } : {}),
          ...(payload.tags && payload.tags.length > 0 ? { tags: payload.tags } : {}),
          ...(payload.destination?.trim() ? { destination: payload.destination.trim() } : {}),
        });
        if (res?.status === "ok" && res.id) {
          setLocalPosts((prev) =>
            prev.map((p) => {
              if (p.id !== newPost.id) return p;
              let next: CommunityPost = { ...p, id: res.id! };
              const echoed = Array.isArray(res.media_urls)
                ? res.media_urls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
                : null;
              if (echoed && echoed.length > 0) {
                next = {
                  ...next,
                  media_url: echoed[0] ?? "",
                  media_urls: echoed.length > 1 ? echoed : undefined,
                };
              }
              if (res.cover_url !== undefined) {
                if (typeof res.cover_url === "string" && res.cover_url.trim()) {
                  next = { ...next, cover_url: res.cover_url.trim() };
                } else if (res.cover_url === null || res.cover_url === "") {
                  const { cover_url: _c, ...rest } = next;
                  next = rest as CommunityPost;
                }
              }
              const pt = typeof res.post_type === "string" ? res.post_type.trim().toLowerCase() : "";
              if (pt === "photo" || pt === "video" || pt === "text" || pt === "food" || pt === "travel") {
                next = {
                  ...next,
                  type: pt,
                  is_video: pt === "video",
                };
              }
              const echoedTags = Array.isArray(res.tags)
                ? res.tags.filter((x): x is string => typeof x === "string")
                : null;
              if (echoedTags && echoedTags.length > 0) {
                next = { ...next, tags: echoedTags };
              }
              return next;
            }),
          );
          feedApiRefetch();
          setToastBodyOverride(null);
          setToastHint(null);
          setToast("community_publish_success");
          setToastHint("community_publish_success_hint");
          scheduleToastClear(3400);
          onPublishSuccess?.(payload);
          return;
        }
        setLocalPosts((prev) => prev.filter((p) => p.id !== newPost.id));
        const { topMessage, fieldMessages } = interpretCommunityWriteError(res, t, "community_publish_failed");
        setPublishErrorMessage(topMessage);
        setPublishFieldMessages(Object.keys(fieldMessages).length > 0 ? fieldMessages : null);
        setPublishSendFailed(true);
        if (topMessage) {
          setToastBodyOverride(topMessage);
          setToastHint(null);
          setToast("community_publish_failed");
          scheduleToastClear(5200);
        }
        throw new CommunityPublishSubmitRejectedError();
      } catch (e) {
        if (isCommunityPublishParentOwnedError(e)) {
          throw e;
        }
        if (typeof window !== "undefined") {
          console.error("useCommunityFeedPublishSubmit handlePublishSubmit:", e);
        }
        setLocalPosts((prev) => prev.filter((p) => p.id !== newPost.id));
        setPublishErrorMessage(null);
        setPublishFieldMessages(null);
        setPublishSendFailed(true);
        throw e instanceof Error ? e : new Error("publish_failed");
      }
    },
    [
      communityUser,
      dash,
      feedApiRefetch,
      scheduleToastClear,
      setLocalPosts,
      setPublishErrorMessage,
      setPublishFieldMessages,
      setPublishSendFailed,
      setToast,
      setToastBodyOverride,
      setToastHint,
      onPublishSuccess,
      t,
    ],
  );

  return { handlePublishSubmit, clearPublishSendError };
}
