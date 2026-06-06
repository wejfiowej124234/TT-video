/**
 * 社区 API 客户端：共享类型（与 **`crates/api/src/routes/community/*`**、**04** §3.4 对拍）。
 */

/** Feed / 用户帖 / 我的帖 列表行（与 `communityFeedMappers.ApiPostInput` 对齐） */
export type CommunityFeedPostListRow = {
  id: string;
  user_id: string;
  body: string;
  post_type: string;
  destination?: string;
  tags: string[];
  media_urls: string[];
  /** 视频 S3 multipart 发帖；与 **`media_urls[0]`** 同源（04 POST/GET 对拍） */
  primary_media_asset_id?: string | null;
  created_at: string;
  like_count?: number;
  comment_count?: number;
  collect_count?: number;
  liked_by_me?: boolean;
  collected_by_me?: boolean;
  /** 07 §五 5.3B：批量作者展示 */
  author_nickname?: string | null;
  author_avatar_url?: string | null;
  author_role?: string | null;
  author_is_escrow_guide?: boolean | null;
  author_default_wallet?: string | null;
  cover_url?: string | null;
  evidence_anchored?: boolean | null;
  /** ① enrich · ② DB POI 真源 */
  venue_name?: string | null;
  venue_lat?: number | null;
  venue_lng?: number | null;
  distance_m?: number | null;
  is_sponsored?: boolean | null;
  commerce_showcase_kind?: string | null;
  commerce_market_listing_id?: string | null;
};

/**
 * 社区写操作常见 JSON（`community.rs`：`status` + 可选 `message` / `errors` / `note`；
 * 评论成功可带 `id`、`visibility_status`、`risk_level`）。
 */
export type CommunityWriteJsonResponse = {
  status: string;
  /** **`POST …/like`** / **`POST …/collect`**：插入新行时为 **`true`**，幂等重复为 **`false`**（与 **`posts/likes.rs`** / **`collects_likes.rs`** 同源）。 */
  created?: boolean;
  message?: string;
  errors?: Record<string, string>;
  note?: string;
  id?: string | null;
  visibility_status?: string;
  risk_level?: number;
  /** **HTTP 429** 反刷：由客户端从 **`Retry-After`** 注入（**`interpretCommunityWriteError`** 展示） */
  retry_after_sec?: number;
  /** 与全局限流体、网关 JSON 同源；展示用 **`coalesceRetryAfterSecondsFromJson`**（**`retry_after_sec`** 优先） */
  retry_after_seconds?: number;
};

/** 31 §2.3：`PATCH …/posts/:id` 成功响应带服务端回显 `visibility_status`（`community.rs`） */
export type CommunityPatchPostVisibilityResponse = CommunityWriteJsonResponse & {
  visibility_status?: string;
};

/** 31 §2.2：GET …/comments 列表行（含作者 enrichment、可见性/风控字段） */
export type CommunityCommentListRow = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  body: string;
  created_at: string;
  visibility_status?: string;
  risk_level?: number | string;
  body_is_redacted?: boolean;
  author_nickname?: string;
  author_avatar_url?: string | null;
  author_role?: string | null;
  author_is_escrow_guide?: boolean | null;
  author_default_wallet?: string | null;
};

/**
 * GET …/posts/:id 内嵌 `post`（`community.rs` get_post_detail；与 Feed 行、`ApiPostInput` 对齐，便于 `mapApiPostToCommunityPost`）。
 * HTTP 非 2xx 或根级 **`status !== "ok"`** 时抛错（**`communityReadOk`**）；成功时 **`post`** 可为 **`null`**（未找到/无权限等由后端以 **`status: "ok"`** 表达时仍返回体，否则进错误 envelope 并抛错）。
 */
export type CommunityApiPostDetailRow = {
  id: string;
  user_id: string;
  body: string;
  post_type: string;
  destination?: string;
  tags: string[];
  media_urls: string[];
  /** 视频 S3 multipart 发帖；与 **`media_urls[0]`** 同源（04 POST/GET 对拍） */
  primary_media_asset_id?: string | null;
  created_at: string;
  like_count?: number;
  comment_count?: number;
  collect_count?: number;
  liked_by_me?: boolean;
  collected_by_me?: boolean;
  author_nickname?: string | null;
  author_avatar_url?: string | null;
  author_role?: string | null;
  author_is_escrow_guide?: boolean | null;
  author_default_wallet?: string | null;
  cover_url?: string | null;
  evidence_anchored?: boolean | null;
  visibility_status?: string | null;
  venue_name?: string | null;
  venue_lat?: number | null;
  venue_lng?: number | null;
  distance_m?: number | null;
  is_sponsored?: boolean | null;
};

export type CommunityGetPostByIdResponse = {
  status: string;
  post?: CommunityApiPostDetailRow | null;
  note?: string;
  message?: string;
};

/** 31 §2.2：GET comments `?sort=` */
export type CommunityCommentSort = "chronological" | "latest" | "hot";

/**
 * 与 **`common::normalize_comment_sort`** 同源：**`hottest`** 为 **`hot`** 别名；查询串统一发 **`sort=hot`**（与 **04**、**`posts.rs`** **`CommentsQuery`** 对拍）。
 */
export type CommunityCommentSortQueryInput = CommunityCommentSort | "hottest";

/** GET …/conversations 单行（`community.rs` list_conversations_enriched） */
export type CommunityConversationRow = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  last_message?: string;
  last_message_at?: string | null;
  last_sender_id?: string | null;
  unread_count?: number;
  peer_id?: string;
  peer_nickname?: string;
  peer_avatar_url?: string | null;
  peer_role?: string | null;
  peer_is_escrow_guide?: boolean | null;
  peer_default_wallet?: string | null;
};

/** GET …/conversations/:id/messages 单行 */
export type CommunityDmMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

/** 关注/粉丝/好友列表项（`community.rs` `user_ids_to_json_profiles` / 04 §3.4） */
export type CommunityPublicUserRow = {
  id: string;
  nickname?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  is_escrow_guide?: boolean | null;
  default_wallet_address?: string | null;
};

/** GET …/friends/requests：他人发来的待处理申请 */
export type CommunityFriendRequestReceivedRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at?: string;
  from_nickname?: string;
  from_avatar_url?: string | null;
  from_role?: string | null;
  from_is_escrow_guide?: boolean | null;
  from_default_wallet?: string | null;
};

/** GET …/friends/requests/sent：我发出的待处理申请 */
export type CommunityFriendRequestSentRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at?: string;
  to_nickname?: string;
  to_avatar_url?: string | null;
  to_role?: string | null;
  to_is_escrow_guide?: boolean | null;
  to_default_wallet?: string | null;
};

/** 160：`POST /api/v1/community/reports` 与 04 §3.4 一致 */
export type CommunityReportReasonCode =
  | "spam"
  | "harassment"
  | "scam"
  | "illegal"
  | "hate"
  | "other";

export type CommunityReportTargetType = "post" | "user" | "comment" | "message" | "other";

/** 160：`GET …/me/reports` 行 / `GET …/reports/:id` 的 `report`（`community.rs`） */
export type CommunityReportTicketRow = {
  id: string;
  target_type: string;
  target_id: string;
  reason_code: string;
  details?: string | null;
  evidence_ref?: string | null;
  status: string;
  /** 运营结案对外口径（与 Admin PATCH `disposition` 同源；**不含**内部 `admin_notes`） */
  disposition?: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityGetMyReportsResponse = {
  status: string;
  items?: CommunityReportTicketRow[];
  message?: string;
};

export type CommunityGetReportDetailResponse = {
  status: string;
  report?: CommunityReportTicketRow;
  message?: string;
};

/** `POST …/reports/:id/appeals` 成功时可带 `report_id` */
export type CommunityReportAppealResponse = CommunityWriteJsonResponse & {
  report_id?: string;
};
