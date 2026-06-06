import type { CommunityPostType } from "@/lib/communityMockData";

/** ① staging / smoke 帖 · 是否像内部 slug（非用户可读地名） */
export function communityFeedIsStagingSlug(value: string): boolean {
  const s = value.trim();
  if (!s) return true;
  return (
    /^(c\d+[-_])?(staging|img|video|delivery|playback)/i.test(s) ||
    /^#?c\d+[-_]/.test(s) ||
    /^c\d+\s*(video|image|photo|img)?$/i.test(s) ||
    /[-_]?\d{10,}\b/.test(s)
  );
}

/** 去掉 staging 前缀 · 保留可读片段 */
export function communityFeedSanitizeStagingLabel(raw: string): string {
  let s = raw.trim();
  if (!s || communityFeedIsStagingSlug(s)) return "";

  s = s
    .replace(/^(c\d+-)?staging[-_]/gi, "")
    .replace(/[-_]?(delivery|playback|image|img|video)[-_]?\d*/gi, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!s || communityFeedIsStagingSlug(s) || s.length > 40) return "";
  return s;
}

const TYPE_SHARE_I18N: Partial<Record<CommunityPostType, string>> = {
  food: "community_type_food",
  travel: "community_type_travel",
  video: "community_type_video",
  photo: "community_type_photo",
  text: "community_type_text",
};

function firstReadableContentSnippet(raw: string | null | undefined, maxLen = 48): string {
  if (!raw?.trim()) return "";
  const lines = raw
    .split(/\r?\n/)
    .map((line) => communityFeedSanitizeStagingLabel(line.trim()))
    .filter(Boolean);
  const joined = lines.join(" · ").trim();
  if (!joined) return "";
  return joined.length > maxLen ? `${joined.slice(0, maxLen - 1)}…` : joined;
}

/** 瀑布卡标题 · 美团式可读（隐藏 staging id · 优先目的地/正文/POI/话题/作者） */
export function communityFeedMasonryDisplayTitle(
  post: {
    title?: string | null;
    content?: string | null;
    type?: CommunityPostType;
    destination?: string | null;
    venueName?: string | null;
    authorNickname?: string | null;
    tags?: string[] | null;
  },
  t: (key: string) => string,
): string {
  const dash = t("ui_em_dash");
  const titleClean = communityFeedSanitizeStagingLabel(post.title?.trim() || "");
  if (titleClean) return titleClean.slice(0, 48);

  const contentSnippet = firstReadableContentSnippet(post.content);
  if (contentSnippet) return contentSnippet;

  const venue = post.venueName?.trim();
  if (venue && !communityFeedIsStagingSlug(venue)) return venue.slice(0, 48);

  const dest = post.destination?.trim();
  if (dest && !communityFeedIsStagingSlug(dest)) return dest.slice(0, 48);

  const readableTag = (post.tags ?? []).find((raw) => {
    const tg = raw.trim().replace(/^#/, "");
    return tg.length > 0 && !communityFeedIsStagingSlug(tg);
  });
  if (readableTag) {
    const label = readableTag.trim().replace(/^#/, "");
    return `#${label}`.slice(0, 48);
  }

  const author = post.authorNickname?.trim();
  if (author && !communityFeedIsStagingSlug(author)) return author.slice(0, 48);

  const typeKey = post.type ? TYPE_SHARE_I18N[post.type] : undefined;
  if (typeKey) return t(typeKey);
  return dash;
}

/** 定位 pill 名称 · 目的地 > 可读 tag > 类型兜底 */
export function communityFeedMasonryLocationDisplayName(opts: {
  destinationLabel?: string | null;
  destination?: string | null;
  tags?: string[] | null;
  type?: CommunityPostType;
  t: (key: string) => string;
}): string | null {
  if (opts.destinationLabel?.trim()) return opts.destinationLabel.trim();
  if (opts.destination?.trim()) return opts.destination.trim();

  for (const tag of opts.tags ?? []) {
    const trimmed = tag.trim().replace(/^#/, "");
    if (trimmed && !communityFeedIsStagingSlug(trimmed)) {
      return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    }
  }

  const typeKey = opts.type ? TYPE_SHARE_I18N[opts.type] : undefined;
  return typeKey ? opts.t(typeKey) : opts.t("community_feed_nearby_spot");
}
