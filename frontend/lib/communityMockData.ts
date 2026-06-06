/**
 * TT 社区类型与空占位导出（`lib/communityMockData/*` 中数组均为空；主流程走 API + 空态）。
 */
export type {
  CommunityPostType,
  CommunityPostVisibility,
  CommunityPostUserVisibility,
  CommunityPostAuthor,
  CommunityPost,
  CommunityComment,
  CommunityConversation,
  CommunityUserItem,
  FriendRequestItem,
} from "./communityMockData/index";
export {
  MOCK_CURRENT_USER_ID,
  pick,
  MOCK_COMMUNITY_POSTS,
  MOCK_COMMUNITY_COMMENTS,
  MOCK_CONVERSATIONS,
  getConversationIdByPeerId,
  MOCK_FOLLOWING,
  MOCK_FOLLOWERS,
  MOCK_FRIENDS,
  getAuthorById,
  MOCK_REQUESTS_SENT,
  MOCK_REQUESTS_RECEIVED,
} from "./communityMockData/index";
