/**
 * API 客户端统一入口（与 04 §三、14 一致；业务数据同源 01 §9）
 * 按域拆分为 core / meta / guides / orders / discover / itineraries / me / disputes / auth / didRank，单文件 ≤400 行。
 */

export {
  isComplianceError,
  fetchJsonWithApiStatusLog,
  getAuthHeaders,
  writeRequestHeaders,
  getIdempotencyKey,
  clearClientAuthStorage,
  AUTH_SESSION_TOKEN_KEY,
  AUTH_USER_ID_KEY,
  throwUnlessApiOk,
} from "./core";
export type { AuthHeaders } from "./core";

export { getMeta, getMetaBuild, readMetaBuild, readMetaBuildRoot } from "./meta";
export type { MetaBuildInfo } from "./meta";
export { getGuides, getGuide, getGuideAvailability, postGuideUploadDoc, postGuide, postGuideStake } from "./guides";
export type {
  OrdersListResult,
  OrderListItem,
  OrderReviewListItem,
  OrderReviewsListMeta,
  OrderReviewsListResult,
  OrderReviewWeightBreakdown,
} from "./orders";
export {
  getOrders,
  postOrder,
  getOrder,
  getOrderChainSyncStatus,
  patchOrderItinerary,
  orderAccept,
  orderCancel,
  orderMockPay,
  orderConfirmCompletion,
  orderConfirmBilateral,
  orderConfirmRating,
  postOrderConfirmFinalPlan,
  postOrderSetEscrowAddress,
  getOrderReviews,
  postReview,
  postOrderDispute,
  postOrderConfirmCompletionIntent,
  postOrderOpenDisputeIntent,
} from "./orders";
export type { DiscoverOrdersResult } from "./discover";
export { getDiscoverOrders } from "./discover";
export { postItineraryCreate, postItineraryCustom } from "./itineraries";
export type { CustomItineraryBody } from "./itineraries";
export { getMe, clearGetMeCache, getMeStats, putMe, putMePassword } from "./me";
export {
  getDisputes,
  getDispute,
  getOrderEvidence,
  postOrderEvidence,
  postDisputeResolve,
  postDisputeExecuteResolutionIntent,
} from "./disputes";
export { postMediaSignedUrls, getMediaAccess } from "./media";
export type { MediaSignedUrlScope, PostMediaSignedUrlsBody, PostMediaSignedUrlsResult } from "./media";
export { getOrderMessages, postOrderMessage } from "./messages";
export {
  applyClientSessionAfterAuth,
  applyLocalLogoutAfterServerOk,
  postSeedTestAccounts,
  postLogin,
  postRegister,
  postLogout,
  postRefresh,
  postVerifyEmail,
  postForgotPassword,
  postResetPassword,
} from "./auth";
export { getGovernanceProposal, getGovernanceVotingPower, postGovernanceProposalVote } from "./governance";
export type {
  GovernanceProposalDetail,
  GovernanceProposalDetailResponse,
  GovernanceProposalVoteResult,
  GovernanceVoteSemantics,
  GovernanceVotingPowerResponse,
} from "./governance";
export {
  getGovernanceDelegate,
  postGovernanceDelegate,
  deleteGovernanceDelegate,
} from "./governanceDelegate";
export type {
  GovernanceDelegateGetResponse,
  GovernanceDelegateWriteResponse,
} from "./governanceDelegate";
export {
  getDidRankTravelers,
  getDidRankGuides,
  getDidRankItineraries,
} from "./didRank";
export {
  getFeed,
  getPostById,
  deletePost,
  createPost,
  postLike,
  deleteLike,
  postComment,
  getPostComments,
  getConversations,
  getConversationMessages,
  postConversationMessage,
  getMeFollowing,
  getMeFollowers,
  getFriendsList,
  getFriendsRequests,
  postUserFollow,
  deleteUserFollow,
  postFriendsRequest,
  postFriendsAccept,
  getMeCollects,
  postCollect,
  deleteCollect,
  postCommunityReport,
  getMyCommunityReports,
  getCommunityReport,
  postCommunityReportAppeal,
} from "./community";
export type {
  CommunityCommentSort,
  CommunityReportReasonCode,
  CommunityConversationRow,
  CommunityDmMessageRow,
  CommunityWriteJsonResponse,
  CommunityCommentListRow,
  CommunityReportTicketRow,
  CommunityGetMyReportsResponse,
  CommunityGetReportDetailResponse,
  CommunityReportAppealResponse,
  CommunityPatchPostVisibilityResponse,
  CommunityApiPostDetailRow,
  CommunityGetPostByIdResponse,
} from "./community";
