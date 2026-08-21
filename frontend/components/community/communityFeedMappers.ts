/**

 * 社区 Feed API 与前端展示类型映射，供 useCommunityFeed、useCommunityFeedApi、me/posts、me/collects 共用。

 * 51-F1 / 51-31-9；52 §7.5 P2 拆出以解循环依赖 — 本文件为 barrel，实现见同目录子模块。

 */

export type { ApiPostInput, ApiCommentInput } from "./communityFeedMappersPostComment";

export {

  mapApiPostToCommunityPost,

  mapApiCommentToCommunityComment,

  communityCommentUseModerationPlaceholder,

  communityCommentModerationPlaceholderI18nKey,

} from "./communityFeedMappersPostComment";



export {

  displayLikeCountFromServerAndUi,

  displayCollectCountFromServerAndUi,

  engagementLikesDeltaAfterWriteOk,

  engagementCollectsDeltaAfterWriteOk,

  communityDrawerCommentCountFromPost,

  communityDrawerCommentCountHonest,
  communityDrawerCommentCountHonestWithApiCache,

  communityVideoOverlayCommentDisplayCount,

  communityFeedCardCommentDisplayCount,

  communityFeedListCardCommentCount,
  communityFeedListCardCommentCountHonest,
  communityFeedCardCommentDisplayCountHonest,

  withPostServerCommentCountBumped,
  withPostServerCommentCountDecremented,

} from "./communityFeedMappersCounts";



export {

  mapApiUserRoleToCommunity,

  communityStoredRolePillClassName,

  resolveCommunityPostPlayableVideoUrl,

  communityPostGridThumbRaw,

} from "./communityFeedMappersRoleAndMedia";

