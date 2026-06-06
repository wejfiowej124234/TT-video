/**
 * 31 TT社区：UGC 帖子、评论、会话、用户、好友申请等类型
 */

export type CommunityPostType = "photo" | "video" | "food" | "travel" | "text";

/** 31 §2.3：与 API `visibility_status` 一致 */
export type CommunityPostVisibility = "public" | "private" | "archived" | "hidden";

/** 作者可改可见性（不含 moderation `hidden`） */
export type CommunityPostUserVisibility = "public" | "private" | "archived";

export type CommunityCommerceShowcaseKind =
  | "acquisition_led"
  | "market_listing"
  | "sponsored"
  | string;

export interface CommunityPostAuthor {
  id: string;
  nickname: string;
  avatar_url: string | null;
  /** `users.role` 规范小写（700：`traveler`/`provider`/…）；UI 文案见 `communityStoredRoleLabelI18nKey` */
  role: string;
  isEscrowGuide?: boolean;
  bio?: string;
  link?: string;
  did?: string;
  wallet?: string;
}

export interface CommunityPost {
  id: string;
  type: CommunityPostType;
  title?: string;
  content: string;
  media_url: string;
  media_urls?: string[];
  /** 视频帖可选封面图 URL（API `cover_url`；31 §2.1） */
  cover_url?: string | null;
  is_video?: boolean;
  destination?: string;
  tags: string[];
  author: CommunityPostAuthor;
  likes: number;
  comments: number;
  collects: number;
  created_at: string;
  /** 后端可选：链上/存证锚定（31 §2.4） */
  evidenceAnchored?: boolean;
  /** 已登录时 Feed/详情 API 可选：当前用户是否已点赞 */
  likedByMe?: boolean;
  /** 已登录时 Feed/详情 API 可选：当前用户是否已收藏 */
  collectedByMe?: boolean;
  /** 已登录且作者非本人时 API 可选：当前用户是否已关注该帖作者（与 `GET …/me/following` 对读；B-076） */
  authorFollowedByMe?: boolean;
  /** 31 §2.3：缺省按 `public` 展示 */
  visibilityStatus?: CommunityPostVisibility;
  /** S3 multipart 视频资产（04 · `primary_media_asset_id`） */
  primaryMediaAssetId?: string;
  /** 04 · `commerce_showcase_kind` */
  commerceShowcaseKind?: CommunityCommerceShowcaseKind;
  /** 04 · `commerce_market_listing_id`（市场 listing 弱关联） */
  commerceMarketListingId?: string;
  /** POI / 到店名（API `venue_name` · ② 真源） */
  venueName?: string | null;
  venueLat?: number | null;
  venueLng?: number | null;
  /** 与锚点距离（米）；有值时 UI 不再用占位 hash */
  distanceM?: number | null;
  /** 信息流赞助/广告帖（API `is_sponsored`） */
  isSponsored?: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author: CommunityPostAuthor;
  content: string;
  parent_id?: string;
  created_at: string;
}

export interface CommunityConversation {
  id: string;
  peer: CommunityPostAuthor;
  last_message: string;
  last_at: string;
  unread: number;
}

export interface CommunityUserItem extends CommunityPostAuthor {
  follow_status?: "following" | "follower" | "friend";
}

export interface FriendRequestItem {
  id: string;
  from: CommunityPostAuthor;
  to_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}
