/**
 * **社区 API**（**50-O-31** / **51-31-9**；**`crates/api/src/routes/community/*`**；**31** 附录、**04** §3.3 机器码 ↔ **`community_api_msg_*`**）。
 *
 * **数据依赖**：多数读写经 **`state.chain_off.as_ref().and_then(|c| c.db_pool)`**。**无 PG 池**时常见 **200** envelope **`status:error`** **`service_unavailable`**（与 **auth** 域 **HTTP 503 `chain_off_unavailable`** **不同**；见 **`posts.rs`** 等）。有池时返回真实行集；读列表空即为空态（前端不再用本地 MOCK 兜底）。
 *
 * **结构**：按域拆为 `community/*`（feed、posts、comments、messaging、social、feedback、types、constants、internal），入口仍 **`@/lib/apiClient/community`**。
 */

export {
  COMMUNITY_ME_DRAWER_LIST_ID_CAP,
  COMMUNITY_FEED_LIST_DEFAULT_PAGE,
  COMMUNITY_FEED_LIST_API_MAX,
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  communityPostTagWithinServerUtf8Limit,
  communityPostTagExceedsServerUtf8Limit,
  communityPostTagUtf8ByteLenTrimmed,
  COMMUNITY_POST_TAGS_MAX_COUNT,
  COMMUNITY_COMMENT_LIST_API_MAX,
  COMMUNITY_COMMENT_CHRONO_ROOT_PAGE_MAX,
  COMMUNITY_ME_REPORTS_LIST_API_MAX,
} from "./constants";

export type {
  CommunityWriteJsonResponse,
  CommunityPatchPostVisibilityResponse,
  CommunityCommentListRow,
  CommunityApiPostDetailRow,
  CommunityGetPostByIdResponse,
  CommunityCommentSort,
  CommunityCommentSortQueryInput,
  CommunityConversationRow,
  CommunityDmMessageRow,
  CommunityPublicUserRow,
  CommunityFriendRequestReceivedRow,
  CommunityFriendRequestSentRow,
  CommunityReportReasonCode,
  CommunityReportTargetType,
  CommunityReportTicketRow,
  CommunityGetMyReportsResponse,
  CommunityGetReportDetailResponse,
  CommunityReportAppealResponse,
  CommunityFeedPostListRow,
} from "./types";

export { getFeed, getUserPosts, getPublicPostsByTagCount, getMyPosts } from "./feed";
export { getMeActivity, getMeNotifications, getExploreDestinations } from "./activityAndExplore";
export type { CommunityActivityEventRow, ExploreDestinationCountRow } from "./activityAndExplore";
export {
  getPostById,
  deletePost,
  patchPostVisibility,
  uploadCommunityPostMedia,
  createPost,
} from "./posts";
export { getCommunityMediaCapabilities, type CommunityMediaCapabilities } from "./mediaCapabilities";
export {
  CommunityMultipartUploadError,
  COMMUNITY_MEDIA_MULTIPART_PART_SIZE_BYTES_DEFAULT,
  createCommunityMediaUploadSession,
  presignCommunityMediaAssetParts,
  putCommunityMediaPresignedPart,
  completeCommunityMediaAssetSession,
  getCommunityMediaAssetStatus,
  uploadCommunityVideoMultipart,
} from "./mediaAssetsMultipart";
export type {
  CommunityMultipartProgress,
  CommunityMediaSessionCreateOk,
  CommunityMediaPresignedPart,
  CommunityMediaCompleteOk,
  CommunityMediaAssetStatusOk,
} from "./mediaAssetsMultipart";
export {
  postLike,
  deleteLike,
  postComment,
  deleteComment,
  communityCommentIdempotencyKey,
  COMMUNITY_COMMENT_OPTIMISTIC_DELETE_FORBIDDEN,
  buildCommunityPostCommentsQueryString,
  getPostComments,
} from "./comments";
export { getConversations, getConversationMessages, postConversationMessage } from "./messaging";
export {
  getMeFollowing,
  getMeFollowers,
  getFriendsList,
  getFriendsRequests,
  getFriendsRequestsSent,
  getMeLikesReceived,
  postUserFollow,
  deleteUserFollow,
  postFriendsRequest,
  postFriendsAccept,
  postFriendsReject,
  getMeCollects,
  getMeLikes,
  postCollect,
  deleteCollect,
} from "./social";
export {
  getFeedbackList,
  postFeedback,
  postCommunityReport,
  getMyCommunityReports,
  getCommunityReport,
  postCommunityReportAppeal,
} from "./feedbackAndReports";
