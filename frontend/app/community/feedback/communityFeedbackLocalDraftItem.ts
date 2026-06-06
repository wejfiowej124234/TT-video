import type { FeedbackMediaItem } from "@/lib/communityFeedbackDisplay";
import type { FeedbackItem } from "./communityFeedbackPageModel";

export function buildLocalFeedbackDraftItem(
  category: string,
  contentTrimmed: string,
  mediaPreviews: FeedbackMediaItem[]
): FeedbackItem {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    category,
    content: contentTrimmed,
    created_at: new Date().toISOString(),
    local: true,
    media: mediaPreviews.length ? [...mediaPreviews] : undefined,
  };
}
