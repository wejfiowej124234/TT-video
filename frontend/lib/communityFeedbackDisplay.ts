/**
 * 社区反馈页纯展示逻辑（54-S19），便于单测与 API 映射复用。
 */

export type FeedbackMediaItem = { type: "image" | "video"; url: string };

export function mediaUrlsToItems(urls: string[] | undefined): FeedbackMediaItem[] | undefined {
  if (!urls?.length) return undefined;
  return urls.map((url) => ({
    type:
      url.startsWith("data:video") || /\.(mp4|webm)(\?|#|$)/i.test(url) ? ("video" as const) : ("image" as const),
    url,
  }));
}

export function formatFeedbackListDate(iso: string): string {
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { dateStyle: "short" });
  } catch {
    return iso;
  }
}
