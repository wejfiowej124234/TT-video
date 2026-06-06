"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommunityMediaCapabilities } from "@/lib/apiClient/community/mediaCapabilities";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

/** 视频 multipart / MinIO 未就绪时在 Feed 顶栏提示（与 PublishDrawer capabilities 同源） */
export function CommunityFeedMediaCapabilitiesBanner({ t }: { t: (key: string) => string }) {
  const q = useQuery({
    queryKey: ["community", "media", "capabilities", "feed-banner"],
    queryFn: getCommunityMediaCapabilities,
    staleTime: 120_000,
    retry: 1,
  });
  if (q.isLoading || q.isError || !q.data) return null;
  if (q.data.public_video_publish_ready) return null;
  return (
    <div
      className={`${TT_COMMUNITY_DRAWER_L5.feedInlineAlertSoft} mb-3 text-small text-slate-200`}
      role="status"
      data-testid="community-feed-media-capabilities-banner"
    >
      {t("community_feed_video_storage_banner")}
    </div>
  );
}
