/**
 * 社区 UGC 领域类型（帖子、评论、会话、好友等），与 `GET/POST …/community/*` 契约对齐。
 * 实现仍位于 `communityMockData/types.ts`（历史目录名）；业务代码应从此模块导入类型，避免 `communityMockData` 命名误导为「运行时假数据」。
 */
export type {
  CommunityPostType,
  CommunityPostVisibility,
  CommunityCommerceShowcaseKind,
  CommunityPostAuthor,
  CommunityPost,
  CommunityComment,
  CommunityConversation,
  CommunityUserItem,
  FriendRequestItem,
} from "./communityMockData/types";
