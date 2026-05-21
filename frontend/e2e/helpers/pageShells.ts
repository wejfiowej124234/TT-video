import type { Locator, Page } from "@playwright/test";

import {
  bookGuideCtaByKind,
  communityMeSurfaceSelector,
  dataTt,
  type BookGuideCtaKind,
  type CommunityMeDataState,
  type CommunityMeSurface,
} from "../../test-utils/dataTtSelectors";

export type { BookGuideCtaKind, CommunityMeDataState, CommunityMeSurface };

/** E2E page roots (`data-tt-*`)；选择器字符串真源 `test-utils/dataTtSelectors.ts`。 */
export const marketPageShell = (page: Page) => page.locator(dataTt.marketPage);
export const ordersPageShell = (page: Page) => page.locator(dataTt.ordersPage);
export const ordersNewPageShell = (page: Page) => page.locator(dataTt.ordersNewPage);
export const escrowDetailPageShell = (page: Page) => page.locator(dataTt.escrowDetailPage);
export const disputeDetailPageShell = (page: Page) => page.locator(dataTt.disputeDetailPage);
export const meOnboardingPageShell = (page: Page) => page.locator(dataTt.meOnboardingPage);
export const governanceHubPageShell = (page: Page) => page.locator(dataTt.governanceHubPage);
export const governanceProposalsPageShell = (page: Page) => page.locator(dataTt.governanceProposalsPage);
export const governanceProposalDetailPageShell = (page: Page) =>
  page.locator(dataTt.governanceProposalDetailPage);
export const governanceDelegatePageShell = (page: Page) => page.locator(dataTt.governanceDelegatePage);
export const governanceParamsPageShell = (page: Page) => page.locator(dataTt.governanceParamsPage);
export const governanceFeeRoutesPageShell = (page: Page) => page.locator(dataTt.governanceFeeRoutesPage);
export const governanceVaultForwardsPageShell = (page: Page) =>
  page.locator(dataTt.governanceVaultForwardsPage);
export const adminAppPageShell = (page: Page) => page.locator(dataTt.adminAppPage);
export const payRootPageShell = (page: Page) => page.locator(dataTt.payRoot);
export const escrowRatePageShell = (page: Page) => page.locator(dataTt.escrowRatePage);
export const communityMePageShell = (page: Page) => page.locator(dataTt.communityMePage);
export const communityMeReportsPageShell = (page: Page) => page.locator(dataTt.communityMeReportsPage);
export const communityMeNotesDrawerShell = (page: Page) => page.locator(dataTt.communityMeNotesDrawer);
export const communityReportTicketPageShell = (page: Page) => page.locator(dataTt.communityReportTicketPage);
export const communityFeedPageShell = (page: Page) => page.locator(dataTt.communityFeedPage);
export const communityExplorePageShell = (page: Page) => page.locator(dataTt.communityExplorePage);
export const communityActivityPageShell = (page: Page) => page.locator(dataTt.communityActivityPage);
export const communityTtPageShell = (page: Page) => page.locator(dataTt.communityTtPage);
export const communityFriendsPageShell = (page: Page) => page.locator(dataTt.communityFriendsPage);
export const communityMessagesPageShell = (page: Page) => page.locator(dataTt.communityMessagesPage);
export const communityFeedbackPageShell = (page: Page) => page.locator(dataTt.communityFeedbackPage);
export const communityUserPageShell = (page: Page) => page.locator(dataTt.communityUserPage);
export const communityMessagesThreadPageShell = (page: Page) =>
  page.locator(dataTt.communityMessagesThreadPage);
export const communityLoginForPublishShell = (page: Page) => page.locator(dataTt.communityLoginForPublish);
export const communityPublishDrawerShell = (page: Page) => page.locator(dataTt.communityPublishDrawer);
export const communityMeCollectsPageShell = (page: Page) => page.locator(dataTt.communityMeCollectsPage);
export const communityMePostsPageShell = (page: Page) => page.locator(dataTt.communityMePostsPage);
export const communityGuidelinesPageShell = (page: Page) => page.locator(dataTt.communityGuidelinesPage);
export const homePageShell = (page: Page) => page.locator(dataTt.homePage);
export const didRankPageShell = (page: Page) => page.locator(dataTt.didRankPage);
export const termsPageShell = (page: Page) => page.locator(dataTt.termsPage);
export const privacyPageShell = (page: Page) => page.locator(dataTt.privacyPage);
export const helpPageShell = (page: Page) => page.locator(dataTt.helpPage);
export const authRouteLoginShell = (page: Page) => page.locator(dataTt.authRouteLogin);
export const authRouteRegisterShell = (page: Page) => page.locator(dataTt.authRouteRegister);

/** 注册页主标题（h1）；勿用宽泛 `/Register|注册/`，会误命中「注册前，了解信任边界」等 h2。 */
export const registerPagePrimaryHeading = (registerShell: Locator) =>
  registerShell.getByRole("heading", { level: 1 });
export const authRouteForgotPasswordShell = (page: Page) => page.locator(dataTt.authRouteForgotPassword);
export const authRouteResetPasswordShell = (page: Page) => page.locator(dataTt.authRouteResetPassword);
export const authRouteVerifyEmailShell = (page: Page) => page.locator(dataTt.authRouteVerifyEmail);
export const guidesPageShell = (page: Page) => page.locator(dataTt.guidesPage);
export const itineraryNewPageShell = (page: Page) => page.locator(dataTt.itineraryNewPage);
export const disputesListPageShell = (page: Page) => page.locator(dataTt.disputesListPage);
export const stakingPageShell = (page: Page) => page.locator(dataTt.stakingPage);
export const traveltrustNetworkPageShell = (page: Page) => page.locator(dataTt.traveltrustNetworkPage);
export const guideRegisterPageShell = (page: Page) => page.locator(dataTt.guideRegisterPage);
export const guideWorkspacePageShell = (page: Page) => page.locator(dataTt.guideWorkspacePage);
export const mePasswordPageShell = (page: Page) => page.locator(dataTt.mePasswordPage);
export const guidesDetailPageShell = (page: Page) => page.locator(dataTt.guidesDetailPage);
export const adminWorkspacePageShell = (page: Page) => page.locator(dataTt.adminWorkspacePage);

/** Auth surfaces (`/auth/register` hydrate 后出现). */
export const authRegisterFormShell = (page: Page) => page.locator(dataTt.authSurfaceRegisterFormShell);
export const authRegisterFormFieldsShell = (page: Page) =>
  page.locator(dataTt.authSurfaceRegisterFormFields);

/** `/community/me*` 内 `data-tt-community-me-surface` + 可选 `data-tt-data-state`（相对页壳或父 Locator）. */
export const communityMeSurfaceShell = (
  root: Page | Locator,
  surface: CommunityMeSurface,
  dataState?: CommunityMeDataState,
): Locator => root.locator(communityMeSurfaceSelector(surface, dataState));

/** Market drawers / modals / subsite entry shells. */
export const bookGuideModalShell = (page: Page) => page.locator(dataTt.bookGuideModal);
export const guideDetailDrawerShell = (root: Page | Locator) => root.locator(dataTt.guideDetailDrawer);
export const orderDetailDrawerShell = (root: Page | Locator) => root.locator(dataTt.orderDetailDrawer);
export const guideDrawerBookCtaShell = (root: Page | Locator) => root.locator(dataTt.guideDrawerBookCta);
export const guideDetailBookCtaShell = (page: Page) => page.locator(dataTt.guideDetailBookCta);
export const customItineraryModalShell = (page: Page) => page.locator(dataTt.customItineraryModal);
export const marketProviderPageShell = (page: Page) => page.locator(dataTt.marketProviderPage);
export const marketProviderOpenStudioShell = (root: Page | Locator) =>
  root.locator(dataTt.marketProviderOpenStudio);
export const marketAcquisitionPageShell = (page: Page) => page.locator(dataTt.marketAcquisitionPage);
export const marketAcquisitionOpenStudioShell = (root: Page | Locator) =>
  root.locator(dataTt.marketAcquisitionOpenStudio);
export const merchantShowcaseStudioShell = (page: Page) => page.locator(dataTt.merchantShowcaseStudio);
export const acquisitionCarryStudioShell = (page: Page) => page.locator(dataTt.acquisitionCarryStudio);

/** Community post drawer, feed CTA, trust / extra governance / pay / chrome. */
export const communityPostDetailDrawerShell = (page: Page) =>
  page.locator(dataTt.communityPostDetailDrawer);
export const communityFeedPublishEntryShell = (root: Page | Locator) =>
  root.locator(dataTt.communityFeedPublishEntry);
export const trustPageShell = (page: Page) => page.locator(dataTt.trustPage);
export const governanceDistributionAccrualsPageShell = (page: Page) =>
  page.locator(dataTt.governanceDistributionAccrualsPage);
export const governanceDistributionAccrualDetailPageShell = (page: Page) =>
  page.locator(dataTt.governanceDistributionAccrualDetailPage);
export const payMockPaySubmitShell = (page: Page) => page.locator(dataTt.payMockPaySubmit);
export const payMockPayOkShell = (page: Page) => page.locator(dataTt.payMockPayOk);
export const meSecurityPageShell = (page: Page) => page.locator(dataTt.meSecurityPage);
export const headerUserMenuShell = (page: Page) => page.locator(dataTt.headerUserMenu);
export const headerUserMenuDropdownShell = (page: Page) => page.locator(dataTt.headerUserMenuDropdown);

/** `BookGuideModal` 内次要 CTA（与 `expectBookGuideModalDeepLinks` 同源）. */
export const bookGuideCtaShell = (page: Page, kind: BookGuideCtaKind) =>
  page.locator(bookGuideCtaByKind[kind]);

/** 顶栏 `WalletStatusMini`（`injectedWallet` 联调）. */
export const walletStatusMiniTriggerShell = (page: Page) =>
  page.locator("header").locator(dataTt.walletStatusMiniTrigger);
export const walletStatusMiniDropdownShell = (page: Page) =>
  page.locator("header").locator(dataTt.walletStatusMiniDropdown);
