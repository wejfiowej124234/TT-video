"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { useTranslation } from "@/components/LocaleProvider";
import { buildCommunityPostShareUrl } from "@/lib/communityPostShareUrl";

export function useCommunityConversationPageSharePrefill(
  id: string,
  sharePostIdFromQuery: string | null,
  t: ReturnType<typeof useTranslation>["t"],
  setInputValue: Dispatch<SetStateAction<string>>
) {
  const sharePrefilledRef = useRef(false);

  useEffect(() => {
    sharePrefilledRef.current = false;
  }, [id]);

  /** 31 §2.2：从 Feed「发给好友」进入时预填帖子链接，并去掉 URL 参数 */
  useEffect(() => {
    if (!sharePostIdFromQuery || sharePrefilledRef.current) return;
    if (typeof window === "undefined") return;
    sharePrefilledRef.current = true;
    const url = buildCommunityPostShareUrl(window.location.origin, sharePostIdFromQuery);
    const line = t("community_share_post_prefill").replace(/\{\{url\}\}/g, url);
    setInputValue((prev) => (prev.trim() ? prev : line));
    const u = new URL(window.location.href);
    u.searchParams.delete("sharePostId");
    const qs = u.search || "";
    window.history.replaceState({}, "", `${u.pathname}${qs}`);
  }, [sharePostIdFromQuery, t, setInputValue]);
}
