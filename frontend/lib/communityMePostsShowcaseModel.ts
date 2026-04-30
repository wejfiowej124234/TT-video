import type { CommunityPost } from "@/lib/communityPostTypes";

/**
 * 个人中心「社区帖子」弹层：展示型角标归类；**后端 `commerce_showcase_kind` 为权威**，缺省时才用正文/标签启发式（见 `isCommunityMePostsShowcaseKindFromApi`）。
 * 真实「在售行程 / 酒店 SKU / 收购单」以市场 `market_listings`、托管订单、向导工作台为 SSOT。
 */
export type CommunityMePostsShowcaseKind = "itinerary_led" | "lodging_led" | "acquisition_led" | "general_led";

export function communityMePostsShowcaseKindI18nKey(kind: CommunityMePostsShowcaseKind): string {
  switch (kind) {
    case "itinerary_led":
      return "community_me_posts_showcase_kind_itinerary";
    case "lodging_led":
      return "community_me_posts_showcase_kind_lodging";
    case "acquisition_led":
      return "community_me_posts_showcase_kind_acquisition";
    default:
      return "community_me_posts_showcase_kind_general";
  }
}

function haystack(post: CommunityPost): string {
  const tags = (post.tags ?? []).join(" ");
  const dest = post.destination ?? "";
  const body = post.content ?? "";
  const title = post.title ?? "";
  return `${tags} ${dest} ${body} ${title}`.toLowerCase();
}

/** 角标分类是否来自后端 `commerce_showcase_kind`（SSOT）；否则为客户端启发式推断。 */
export function isCommunityMePostsShowcaseKindFromApi(post: CommunityPost): boolean {
  const k = post.commerceShowcaseKind;
  return k === "itinerary_led" || k === "lodging_led" || k === "acquisition_led" || k === "general_led";
}

export function inferCommunityMePostsShowcaseKind(post: CommunityPost): CommunityMePostsShowcaseKind {
  const k = post.commerceShowcaseKind;
  if (k === "itinerary_led" || k === "lodging_led" || k === "acquisition_led" || k === "general_led") {
    return k;
  }
  const h = haystack(post);
  const lodgingHints = ["酒店", "住宿", "民宿", "客房", "hotel", "lodging", "hostel", "b&b"];
  if (lodgingHints.some((x) => h.includes(x))) return "lodging_led";
  const acqHints = ["收购", "带货", "帶貨", "跑腿", "捎带", "carry", "acquisition", "courier", "代买"];
  if (acqHints.some((x) => h.includes(x))) return "acquisition_led";
  const tripHints = [
    "行程",
    "线路",
    "向导",
    "包车",
    "目的地",
    "itinerary",
    "tour",
    "guide",
    "定制",
    "私家团",
  ];
  if (tripHints.some((x) => h.includes(x))) return "itinerary_led";
  if (post.type === "travel") return "itinerary_led";
  return "general_led";
}

export function formatPostsShowcaseCardTitle(post: CommunityPost, untitled: string): string {
  const d = (post.destination ?? "").trim();
  if (d) return d.length > 48 ? `${d.slice(0, 46)}…` : d;
  const raw = (post.content ?? "").trim().replace(/\s+/g, " ");
  if (raw) return raw.length > 48 ? `${raw.slice(0, 46)}…` : raw;
  const ti = (post.title ?? "").trim();
  if (ti) return ti.length > 48 ? `${ti.slice(0, 46)}…` : ti;
  return untitled;
}

export function pickPostsShowcaseCoverUrl(post: CommunityPost): string | null {
  const fromList = post.media_urls?.map((u) => u?.trim()).find(Boolean);
  if (fromList) return fromList;
  const single = (post.media_url ?? "").trim();
  if (single) return single;
  const cover = (post.cover_url ?? "").trim();
  return cover || null;
}

export function formatPostIdShort(id: string): string {
  const s = String(id ?? "").trim();
  if (!s) return "";
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}
