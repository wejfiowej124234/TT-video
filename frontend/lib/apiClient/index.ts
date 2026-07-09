/**
 * API 客户端统一入口（与 04 §三、14 一致；业务数据同源 01 §9）
 * 按域拆分为 core / meta / guides / orders / discover / itineraries / me / disputes / auth / didRank，单文件 ≤400 行。
 */

export {
  isComplianceError,
  fetchJsonWithApiStatusLog,
  getAuthHeaders,
  getApiRetryAfterSeconds,
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
export { getMeProviderApplication, postProviderApplication } from "./providerApplications";
export { getMeStewardApplication, postStewardApplication, getStewardStakeQuote, getStewardStakeStatus, getMeStewardSeat, postStewardResignNotice, postStewardFinalizeResign } from "./stewardApplications";
export type { StewardStakeStatusResponse } from "./stewardApplications";
export type {
  OrdersListResult,
  OrderListItem,
  OrderReviewListItem,
  OrderReviewsListMeta,
  OrderReviewsListResult,
  OrderReviewPostResult,
  OrderReviewWeightBreakdown,
  OrderReviewJsonContractMeta,
  OrderReviewSubmitReview,
  OrderReviewSubmitOk,
} from "./orders";
export type { ReviewJsonContractClientView, ReviewJsonContractDegrade } from "../reviewJsonContract";
export { parseReviewJsonContractMeta, CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED } from "../reviewJsonContract";
export {
  getOrders,
  postOrder,
  getOrder,
  getOrderChainSyncStatus,
  patchOrderItinerary,
  patchOrderGuide,
  patchOrderTripDates,
  orderAccept,
  orderCancel,
  orderMockPay,
  orderConfirmCompletion,
  orderConfirmServiceCompletion,
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
export {
  getMe,
  clearGetMeCache,
  getMeFull,
  isMeFullRequestError,
} from "./me/meFetch";
export type { GetMeFullOptions } from "./me/meFetch";
export {
  getMeStats,
  putMe,
  putMePassword,
  postMeProfileAvatar,
} from "./me/meWrite";
export { getMeWallets, getMeRoleApplications } from "./me/meIdentityPhase15";
export type { MeWalletRow } from "./me/meIdentityPhase15";
export type { MeRoleApplicationRow } from "../me/roleApplications";
export {
  postMeAcquisitionPublishBond,
  postMeAcquisitionFulfillmentBond,
  getWalletVerificationStatus,
  postWalletVerifyChallenge,
  postWalletVerifyConfirm,
} from "./me";
export type {
  WalletVerificationStatus,
  WalletVerifyChallengeResponse,
} from "./me";
export {
  getMeSessions,
  getMeSecurityNotifications,
  deleteMeSessionCurrent,
  deleteMeSessionBySuffix,
} from "./meSecurity";
export type { GetMeSecurityNotificationsParams } from "./meSecurity";
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
  syncClientSessionUserIdCookieFromStorage,
  postSeedTestAccounts,
  postLogin,
  postRegister,
  postRegisterSendVerificationCode,
  postLogout,
  postRefresh,
  postVerifyEmail,
  postResendVerificationEmail,
  postForgotPassword,
  postResetPassword,
} from "./auth";
export {
  getReferralValidate,
  getAdminReferralCodes,
  postAdminReferralCode,
  patchAdminReferralCode,
} from "./growth/http";
export type { ReferralValidateResponse, AdminReferralCodeRow } from "./growth/http";
export {
  getAdminContentCountries,
  postAdminContentCountry,
  patchAdminContentCountry,
  postAdminContentCountryWorkflow,
  getAdminContentCities,
  postAdminContentCity,
  patchAdminContentCity,
  postAdminContentCityWorkflow,
  getAdminContentPois,
  postAdminContentPoi,
  patchAdminContentPoi,
  postAdminContentPoiWorkflow,
  getAdminContentPricing,
  getAdminContentIntercityRoutes,
  getAdminContentPublishQueue,
  getAdminContentPoiImageBatches,
  getAdminContentPoiImageBatch,
  getAdminContentPoiImageCandidates,
  patchAdminContentPoiImageCandidate,
  postAdminContentPoiImageSelect,
  postAdminContentPoiImageWorkflow,
  getAdminContentHotelTiers,
  getAdminContentTransportRegionRules,
  getAdminContentMediaAssets,
  getAdminContentMediaAsset,
  postAdminContentMediaAsset,
  patchAdminContentMediaAsset,
  postAdminContentMediaAssetWorkflow,
  postAdminCatalogEntityWorkflow,
  getAdminContentTranslations,
  postAdminContentTranslation,
  patchAdminContentTranslation,
  postAdminContentTranslationWorkflow,
  getAdminContentSeo,
  postAdminContentSeo,
  patchAdminContentSeo,
  postAdminContentSeoWorkflow,
  getAdminContentLandingAmbient,
  patchAdminContentLandingAmbient,
  getAdminContentRevisionDetails,
  getAdminContentRevisionCompare,
  getAdminContentRollbackHistory,
  getAdminContentImportHistory,
  postAdminContentImportTrigger,
  getAdminContentCatalogParity,
  getAdminContentCatalogObservability,
  getAdminContentCatalogGeoValidation,
  getAdminContentCatalogGeoValidationHistory,
  getAdminContentCatalogGeoMetaParity,
} from "./content/http";
export {
  getAdminContentAnnouncements,
  postAdminContentAnnouncement,
  patchAdminContentAnnouncement,
  postAdminContentAnnouncementWorkflow,
  getPublicCmsAnnouncements,
  getPublicCmsAnnouncementsPulse,
} from "./content/announcements";
export {
  getAdminRoadmapSection,
  patchAdminRoadmapSection,
  postAdminRoadmapSectionWorkflow,
  getAdminRoadmapMilestones,
  postAdminRoadmapMilestone,
  patchAdminRoadmapMilestone,
  postAdminRoadmapMilestoneWorkflow,
  getPublicRoadmap,
} from "./content/roadmap";
export {
  getAdminOfficialAccounts,
  postAdminOfficialAccount,
  patchAdminOfficialAccount,
  postAdminOfficialAccountSubmitReview,
  postAdminOfficialAccountRequestPublish,
  postAdminOfficialAccountPublish,
  postAdminOfficialAccountBindReferral,
  getAdminOfficialGuides,
  postAdminOfficialGuide,
  patchAdminOfficialGuide,
  postAdminOfficialGuideSubmitReview,
  postAdminOfficialGuideRequestPublish,
  postAdminOfficialGuidePublish,
  postAdminOfficialGuideArchive,
  getAdminOfficialItineraryTemplates,
  postAdminOfficialItineraryTemplate,
  postAdminOfficialItineraryTemplateSubmitReview,
  postAdminOfficialItineraryTemplateRequestPublish,
  postAdminOfficialItineraryTemplatePublish,
  getAdminOfficialColdStartCampaigns,
  postAdminOfficialColdStartCampaign,
  postAdminOfficialColdStartCampaignItem,
  postAdminOfficialColdStartCampaignSubmitReview,
  postAdminOfficialColdStartCampaignRequestDeploy,
  postAdminOfficialColdStartCampaignDeploy,
  postAdminOfficialColdStartCampaignRollback,
  getAdminOfficialPublicOperationsStats,
  getAdminOfficialPublicOperationsPublishQueue,
  postAdminOfficialPublicOperationsPublish,
  postAdminOfficialPublicOperationsUnpublish,
  patchAdminOfficialPublicOperationsFeatured,
  patchAdminOfficialPublicOperationsPriority,
  patchAdminOfficialPublicOperationsSurfaces,
  patchAdminOfficialPublicOperationsSchedule,
  getAdminOfficialPublicOperationsPreview,
  getAdminOfficialPublicOperationsHistory,
  getAdminOfficialPublicOperationsPolicy,
  patchAdminOfficialPublicOperationsPolicy,
  getAdminOfficialPublicOperationsCampaigns,
  postAdminOfficialPublicOperationsCampaign,
  postAdminOfficialPublicOperationsCampaignItem,
  postAdminOfficialPublicOperationsCampaignSubmitReview,
  postAdminOfficialPublicOperationsCampaignRequestDeploy,
  postAdminOfficialPublicOperationsCampaignDeploy,
  postAdminOfficialPublicOperationsCampaignRollback,
  getAdminOfficialPublicOperationsCampaignPreview,
} from "./official/http";
export { getAdminPlatformBackupStatus } from "./platform/backupHttp";
export type {
  AdminCatalogCountryRow,
  AdminCatalogCityRow,
  AdminCatalogPoiRow,
  AdminCatalogPricingRow,
  AdminCatalogRouteRow,
  AdminCatalogPublishQueueRow,
  AdminPoiImageBatchRow,
  AdminPoiImageCandidateRow,
  AdminPoiImageBatchStatus,
  AdminPoiImageCandidateReviewStatus,
  AdminCatalogHotelTierRow,
  AdminCatalogTransportRuleRow,
  AdminCatalogMediaAssetRow,
  AdminCountryLandingAmbientRow,
  AdminCatalogRevisionDetailRow,
  AdminCatalogImportBatchRow,
  AdminCatalogParityCheckRow,
  AdminCatalogObservabilityRow,
  AdminCatalogGeoFlagStatus,
  AdminCatalogGeoReadSourceStatus,
  AdminCatalogMetaProductCountriesParityRow,
  AdminCatalogGeoDriftRow,
  AdminCatalogGeoValidationSummary,
  AdminCatalogGeoValidationHistoryRow,
} from "./content/http";
export type {
  AdminOfficialAccountRow,
  AdminOfficialGuideRow,
  AdminOfficialItineraryTemplateRow,
  AdminColdStartCampaignRow,
  AdminColdStartItemRow,
} from "./official/http";
export {
  getAdminRewardLedger,
  getAdminRewardLedgerReconcile,
  postAdminRewardLedgerReconcileFix,
  patchAdminRewardLedgerFraud,
} from "./growth/ledgerHttp";
export type { AdminGrowthLedgerRow, GrowthReconcileRow } from "./growth/ledgerHttp";
export {
  getAdminGrowthFraudRules,
  getAdminGrowthFraudSignals,
  getAdminGrowthFraudUsers,
  getAdminGrowthFraudScanRuns,
  patchAdminGrowthFraudUser,
} from "./growth/fraudHttp";
export type {
  GrowthFraudRuleRow,
  GrowthFraudSignalRow,
  GrowthFraudUserRow,
  GrowthFraudScanRunRow,
} from "./growth/fraudHttp";
export {
  getAdminCountryMarketLaunches,
  postAdminCountryMarketLaunch,
} from "./content/countryMarketHttp";
export type { CountryMarketLaunchRow } from "./content/countryMarketHttp";
export {
  getAdminAirdropCampaigns,
  postAdminAirdropCampaign,
  postAdminAirdropSnapshot,
  postAdminAirdropCalculate,
  postAdminAirdropRecalculate,
  getAdminAirdropReconcile,
  getAdminAirdropExport,
  downloadAirdropExportCsv,
} from "./growth/airdropHttp";
export type {
  AirdropCampaignRow,
  AirdropReconcileSummary,
  AirdropExportRow,
} from "./growth/airdropHttp";
export {
  getAdminEarlyBirdStages,
  patchAdminEarlyBirdStage,
  getAdminEarlyBirdReconcile,
} from "./growth/earlyBirdHttp";
export type {
  EarlyBirdStageRow,
  EarlyBirdStageStats,
  EarlyBirdReconcileSummary,
} from "./growth/earlyBirdHttp";
export { getMeReferrals } from "./growth/meReferralsHttp";
export type {
  MeReferralsSummary,
  MeReferralStats,
  MeEarlyBirdSummary,
  MeReferralEventSummary,
  MeGrowthLedgerSummaryRow,
} from "./growth/meReferralsHttp";
export {
  getAdminGrowthAnalyticsOverview,
  getAdminGrowthAnalyticsFunnel,
  getAdminGrowthAnalyticsTopReferrers,
  getAdminGrowthKolCenter,
  getAdminGrowthKolCenterDetail,
} from "./growth/analyticsHttp";
export type {
  GrowthAnalyticsOverview,
  GrowthAnalyticsFunnel,
  TopReferrerRow,
  KolContributionRow,
  KolContributionDetail,
} from "./growth/analyticsHttp";
export {
  getGovernanceProposal,
  getGovernanceProposalStatus,
  getGovernanceVotingPower,
  postGovernanceProposalVote,
} from "./governance";
export type {
  GovernanceProposalDetail,
  GovernanceProposalDetailResponse,
  GovernanceProposalStatusRead,
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
  getAdminCrossCheck,
  getAdminDriftSummary,
  readAdminJsonStatus,
  normalizeCrossCheckSlot,
  normalizeAdminCrossCheckRead,
  normalizeAdminDriftSummaryRead,
} from "./adminCrossCheck";
export type {
  AdminCrossCheckResponse,
  AdminCrossCheckSourceKind,
  AdminDriftSummaryResponse,
  CrossCheckSlot,
  NormalizedAdminCrossCheck,
  NormalizedAdminDriftSummary,
  NormalizedCrossCheckDriftSummary,
  NormalizedCrossCheckSlot,
} from "./adminCrossCheck";
export {
  getDidRankTravelers,
  getDidRankGuides,
  getDidRankItineraries,
  getDidRankProviders,
  getDidRankAcquisitions,
} from "./didRank";
export { getDidRankPrizePool } from "./didRankPrizePool";
export type { DidRankPrizePoolResponse } from "./didRankPrizePool";
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
export type { OnboardingQuoteRole, OnboardingPaymentIntentBody } from "./onboarding";
export {
  getOnboardingQuote,
  getOnboardingEntitlementsMe,
  postOnboardingPaymentIntent,
  postOnboardingRoleConfirm,
} from "./onboarding";
