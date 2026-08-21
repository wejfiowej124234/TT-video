/** 社区 API 路径（50-O-31）；由 routes.ts 聚合。 */
export const routesCommunity = {
    feed: "/api/v1/community/feed",
    /** 31 §2.1：话题下公开帖子总数 */
    statsPostsByTag: "/api/v1/community/stats/posts-by-tag",
    posts: "/api/v1/community/posts",
    /** 31：发帖前媒体落盘（`content_base64` → `/api/v1/uploads/community-posts/…`） */
    postsUploadMedia: "/api/v1/community/posts/upload-media",
    /** 社区视频上传能力（multipart / 小体上限）；与后端 `community_media_object_storage_configured` 同源 */
    mediaCapabilities: "/api/v1/community/media/capabilities",
    /** 270 Phase1：视频 S3 multipart（须 `COMMUNITY_MEDIA_S3_*`；Runbook `COMMUNITY-MEDIA-OBJECT-STORAGE`） */
    mediaAssetsSessions: "/api/v1/community/media-assets/sessions",
    mediaAssetsSessionParts: (assetId: string) =>
      `/api/v1/community/media-assets/sessions/${assetId}/parts`,
    mediaAssetsSessionComplete: (assetId: string) =>
      `/api/v1/community/media-assets/sessions/${assetId}/complete`,
    mediaAssetById: (assetId: string) => `/api/v1/community/media-assets/${assetId}`,
    postById: (id: string) => `/api/v1/community/posts/${id}`,
    postLike: (postId: string) => `/api/v1/community/posts/${postId}/like`,
    postComments: (postId: string) => `/api/v1/community/posts/${postId}/comments`,
    postCommentById: (postId: string, commentId: string) =>
      `/api/v1/community/posts/${postId}/comments/${commentId}`,
    conversations: "/api/v1/community/conversations",
    /** 51-31-6：与对端幂等创建会话（须 Bearer） */
    conversationsEnsure: "/api/v1/community/conversations/ensure",
    conversationMessages: (id: string) =>
      `/api/v1/community/conversations/${id}/messages`,
    /** 指定用户公开帖子（游标分页） */
    userPosts: (userId: string) => `/api/v1/community/users/${userId}/posts`,
    userFollow: (userId: string) => `/api/v1/community/users/${userId}/follow`,
    meFollowing: "/api/v1/community/me/following",
    meFollowers: "/api/v1/community/me/followers",
    meLikesReceived: "/api/v1/community/me/likes-received",
    /** 当前用户赞过的帖子 id 列表（与 `get_me_collects` 对称；F-019 / `communityMeDrawerListContracts`） */
    meLikes: "/api/v1/community/me/likes",
    friendsRequest: "/api/v1/community/friends/request",
    friendsAccept: "/api/v1/community/friends/accept",
    friendsReject: "/api/v1/community/friends/reject",
    friendsList: "/api/v1/community/friends/list",
    friendsRequests: "/api/v1/community/friends/requests",
    friendsRequestsSent: "/api/v1/community/friends/requests/sent",
    postCollect: (postId: string) =>
      `/api/v1/community/posts/${postId}/collect`,
    meCollects: "/api/v1/community/me/collects",
    mePosts: "/api/v1/community/me/posts",
    meReports: "/api/v1/community/me/reports",
    /** 55-S10 / 54-S19 反馈/建议 */
    feedback: "/api/v1/community/feedback",
    /** 160：社区举报 */
    reports: "/api/v1/community/reports",
    reportById: (id: string) => `/api/v1/community/reports/${id}`,
    reportAppeals: (id: string) => `/api/v1/community/reports/${id}/appeals`,
} as const;
