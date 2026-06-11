/**
 * 31 TT社区：模拟 UGC 数据统一入口（按最佳实践拆分为 types/constants/posts/comments/conversations/users/friendRequests）
 */

export type {
  CommunityPostType,
  CommunityPostVisibility,
  CommunityPostUserVisibility,
  CommunityCommentVisibility,
  CommunityCommerceShowcaseKind,
  CommunityPostAuthor,
  CommunityPost,
  CommunityComment,
  CommunityConversation,
  CommunityUserItem,
  FriendRequestItem,
} from "./types";

export { MOCK_CURRENT_USER_ID, pick } from "./constants";
export { MOCK_COMMUNITY_POSTS } from "./posts";
export { MOCK_COMMUNITY_COMMENTS } from "./comments";
export { MOCK_CONVERSATIONS, getConversationIdByPeerId } from "./conversations";
export { MOCK_FOLLOWING, MOCK_FOLLOWERS, MOCK_FRIENDS, getAuthorById } from "./users";
export { MOCK_REQUESTS_SENT, MOCK_REQUESTS_RECEIVED } from "./friendRequests";
