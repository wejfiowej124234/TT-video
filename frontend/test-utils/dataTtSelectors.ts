/**
 * `data-tt-*` 选择器字符串真源：Vitest / RTL / jsdom 与 Playwright `e2e/helpers/pageShells.ts` 共用。
 * 增删页面壳时须同步本文件与 `pageShells` 导出函数。
 */

export const dataTt = {
  acquisitionCarryStudio: '[data-tt-acquisition-carry-studio="1"]',
  adminAppPage: '[data-tt-admin-app-page="1"]',
  adminWorkspacePage: '[data-tt-admin-workspace-page="1"]',
  authRouteForgotPassword: '[data-tt-auth-route="forgot-password"]',
  authRouteLogin: '[data-tt-auth-route="login"]',
  authRouteRegister: '[data-tt-auth-route="register"]',
  authRouteResetPassword: '[data-tt-auth-route="reset-password"]',
  authRouteVerifyEmail: '[data-tt-auth-route="verify-email"]',
  authSurfaceRegisterFormFields: '[data-tt-auth-surface="register_form_fields"]',
  authSurfaceRegisterFormShell: '[data-tt-auth-surface="register_form_shell"]',
  bookGuideCtaItinerary: '[data-tt-book-guide-cta="itinerary"]',
  bookGuideCtaMarketCustom: '[data-tt-book-guide-cta="market_custom"]',
  bookGuideCtaPrimary: '[data-tt-book-guide-cta="primary"]',
  bookGuideModal: '[data-tt-book-guide-modal="1"]',
  communityActivityPage: '[data-tt-community-activity-page="1"]',
  communityExplorePage: '[data-tt-community-explore-page="1"]',
  communityFeedPage: '[data-tt-community-feed-page="1"]',
  communityFeedPublishEntry: '[data-tt-community-feed-publish-entry="1"]',
  communityFeedbackPage: '[data-tt-community-feedback-page="1"]',
  communityFriendsPage: '[data-tt-community-friends-page="1"]',
  communityGuidelinesPage: '[data-tt-community-guidelines-page="1"]',
  communityDeleteCommentConfirm: '[data-tt-community-delete-comment-confirm="1"]',
  communityDeletePostConfirm: '[data-tt-community-delete-post-confirm="1"]',
  communityLoginForPublish: '[data-tt-community-login-for-publish="1"]',
  communityOrderCancelConfirm: '[data-tt-community-order-cancel-confirm="1"]',
  communityUncollectConfirm: '[data-tt-community-uncollect-confirm="1"]',
  communityUnlikeConfirm: '[data-tt-community-unlike-confirm="1"]',
  communityMeQuickLinksDrawer: '[data-tt-community-me-quick-links-drawer="1"]',
  communityMeCollectsPage: '[data-tt-community-me-collects-page="1"]',
  communityMeLikesPage: '[data-tt-community-me-likes-page="1"]',
  communityMePageSessionPinNote: '[data-tt-community-me-session-pin-note="page"]',
  communityMeDrawerSessionPinNote: '[data-tt-community-me-session-pin-note="drawer"]',
  communityMeNotesDrawer: '[data-tt-community-me-notes-drawer="1"]',
  communityMePage: '[data-tt-community-me-page="1"]',
  communityMePostsPage: '[data-tt-community-me-posts-page="1"]',
  communityMeLoadMorePage: '[data-tt-community-me-load-more="page"]',
  communityMeLoadMoreDrawer: '[data-tt-community-me-load-more="drawer"]',
  communityMeReportsPage: '[data-tt-community-me-reports-page="1"]',
  communityMessagesPage: '[data-tt-community-messages-page="1"]',
  communityMessagesThreadPage: '[data-tt-community-messages-thread-page="1"]',
  communityPostDetailDrawer: '[data-tt-community-post-detail-drawer="1"]',
  communityPostDetailShowcase: '[data-tt-community-post-detail-showcase="1"]',
  communityPublishDrawer: '[data-tt-community-publish-drawer="1"]',
  communityReportDrawer: '[data-tt-community-report-drawer="1"]',
  communityReportTicketPage: '[data-tt-community-report-ticket-page="1"]',
  communityTtPage: '[data-tt-community-tt-page="1"]',
  communityUserPage: '[data-tt-community-user-page="1"]',
  communityVideoOverlay: '[data-tt-community-video-overlay="1"]',
  customItineraryDetailOverlay: '[data-tt-custom-itinerary-detail-overlay="1"]',
  customItineraryModal: '[data-tt-custom-itinerary-modal="1"]',
  didRankGuideModal: '[data-tt-did-rank-guide-modal="1"]',
  didRankPage: '[data-tt-did-rank-page="1"]',
  didRankRecordModal: '[data-tt-did-rank-record-modal="1"]',
  /** 排除 `aria-busy` 加载占位，避免与 `EscrowDetailSkeleton` / 路由回退 / `DisputeDetailLoading` 双命中（E2E `escrowDetailPageShell` / `disputeDetailPageShell`）。 */
  disputeDetailPage: '[data-tt-dispute-detail-page="1"]:not([aria-busy="true"])',
  disputesListPage: '[data-tt-disputes-list-page="1"]',
  escrowConfirmFinalPlanModal: '[data-tt-escrow-confirm-final-plan-modal="1"]',
  /** 同 **`disputeDetailPage`**：排除 **`aria-busy`** 骨架/路由占位，见 **`bilateralEscrowE2e`** 注释。 */
  escrowDetailPage: '[data-tt-escrow-detail-page="1"]:not([aria-busy="true"])',
  escrowFactoryCreateModal: '[data-tt-escrow-factory-create-modal="1"]',
  escrowRatePage: '[data-tt-escrow-rate-page="1"]',
  escrowTxModal: '[data-tt-escrow-tx-modal="1"]',
  governanceDelegatePage: '[data-tt-governance-delegate-page="1"]',
  governanceDistributionAccrualDetailPage: '[data-tt-governance-distribution-accrual-detail-page="1"]',
  governanceDistributionAccrualsPage: '[data-tt-governance-distribution-accruals-page="1"]',
  governanceFeeRoutesPage: '[data-tt-governance-fee-routes-page="1"]',
  governanceHubPage: '[data-tt-governance-hub-page="1"]',
  governanceParamsPage: '[data-tt-governance-params-page="1"]',
  governanceProposalDetailPage: '[data-tt-governance-proposal-detail-page="1"]',
  governanceProposalsPage: '[data-tt-governance-proposals-page="1"]',
  governanceVaultForwardsPage: '[data-tt-governance-vault-forwards-page="1"]',
  guideDetailBookCta: '[data-tt-guide-detail-book-cta="1"]',
  guideDetailDrawer: '[data-tt-guide-detail-drawer="1"]',
  guideDrawerBookCta: '[data-tt-guide-drawer-book-cta="1"]',
  guideRegisterPage: '[data-tt-guide-register-page="1"]',
  guideWorkspacePage: '[data-tt-guide-workspace-page="1"]',
  guidesDetailPage: '[data-tt-guides-detail-page="1"]',
  guidesPage: '[data-tt-guides-page="1"]',
  headerUserMenu: '[data-tt-header-user-menu="1"]',
  headerUserMenuDropdown: '[data-tt-header-user-menu-dropdown="1"]',
  helpPage: '[data-tt-help-page="1"]',
  /** `/` SSOT：`app/(home)/page.tsx` · `main[aria-label]`（无 `data-tt-home-page`） */
  homePage: "main[aria-label]",
  itineraryNewPage: '[data-tt-itinerary-new-page="1"]',
  /** `app/itinerary/new/loading.tsx` 骨架；勿与 `itineraryNewPage` 同钩，避免 E2E 命中双 main */
  itineraryNewLoading: '[data-tt-itinerary-new-loading="1"]',
  landingUnlockModal: '[data-tt-landing-unlock-modal="1"]',
  marketAcquisitionOpenStudio: '[data-tt-market-acquisition-open-studio="1"]',
  marketAcquisitionPage: '[data-tt-market-acquisition-page="1"]',
  marketPage: '[data-tt-market-page="1"]',
  marketProviderOpenStudio: '[data-tt-market-provider-open-studio="1"]',
  marketProviderPage: '[data-tt-market-provider-page="1"]',
  marketSubsiteListingDrawer: '[data-tt-market-subsite-listing-drawer="1"]',
  meOnboardingPage: '[data-tt-me-onboarding-page="1"]',
  mePasswordPage: '[data-tt-me-password-page="1"]',
  meSecurityPage: '[data-tt-me-security-page="1"]',
  merchantShowcaseStudio: '[data-tt-merchant-showcase-studio="1"]',
  orderDetailDrawer: '[data-tt-order-detail-drawer="1"]',
  orderDrawerEscrow: '[data-tt-order-drawer-escrow="1"]',
  orderDrawerPay: '[data-tt-order-drawer-pay="1"]',
  ordersNewPage: '[data-tt-orders-new-page="1"]',
  ordersPage: '[data-tt-orders-page="1"]',
  payMockPayOk: '[data-tt-pay-mock-pay-ok="1"]',
  payMockPaySubmit: '[data-tt-pay-mock-pay-submit="1"]',
  payRoot: '[data-tt-pay-root="1"]',
  privacyPage: '[data-tt-privacy-page="1"]',
  stakingPage: '[data-tt-staking-page="1"]',
  termsPage: '[data-tt-terms-page="1"]',
  termsCommunityGuidelinesPage: '[data-tt-terms-community-guidelines-page="1"]',
  traveltrustNetworkPage: '[data-tt-traveltrust-network-page="1"]',
  trustPage: '[data-tt-trust-page="1"]',
  walletStatusMiniDropdown: '[data-tt-wallet-status-mini-dropdown="1"]',
  walletStatusMiniTrigger: '[data-tt-wallet-status-mini-trigger="1"]',
} as const;

export type BookGuideCtaKind = "primary" | "itinerary" | "market_custom";

export const bookGuideCtaByKind: Record<BookGuideCtaKind, (typeof dataTt)[keyof typeof dataTt]> = {
  primary: dataTt.bookGuideCtaPrimary,
  itinerary: dataTt.bookGuideCtaItinerary,
  market_custom: dataTt.bookGuideCtaMarketCustom,
};

/** 与 `data-tt-community-me-surface` 生产埋点一致（含 `CommunityMeDataStateSurface` 的 `analyticsSurface`）. */
export type CommunityMeSurface =
  | "community_me_auth_gate"
  | "community_me_collects_auth_gate"
  | "community_me_collects_list"
  | "community_me_likes_auth_gate"
  | "community_me_likes_list"
  | "community_me_posts_auth_gate"
  | "community_me_posts_list"
  | "community_me_profile"
  | "community_me_report_detail"
  | "community_me_reports_auth_gate"
  | "community_me_reports_list"
  | "community_me_social_stats";

export type CommunityMeDataState = "invalid" | "success" | "error" | "empty";

export function communityMeSurfaceSelector(surface: CommunityMeSurface, dataState?: CommunityMeDataState): string {
  if (dataState === undefined) {
    return `[data-tt-community-me-surface="${surface}"]`;
  }
  return `[data-tt-community-me-surface="${surface}"][data-tt-data-state="${dataState}"]`;
}
