"use client";

import Link from "next/link";
import { useEffect, useId, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { MeOnboardingConsoleProgress } from "@/components/me/MeOnboardingConsoleProgress";
import { MeOnboardingDonePanel } from "@/components/me/MeOnboardingDonePanel";
import { MeOnboardingNextStep } from "@/components/me/MeOnboardingNextStep";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { accountFooterLinkClass, TT_MARKETING_ACCOUNT_PAGE_SHELL } from "@/lib/accountUi";
import { meOnboardingDevUiEnabled } from "@/lib/me/meOnboardingDevGate";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import {
  deriveOnboardingFlowPhase,
  deriveOnboardingConsoleProgressAllComplete,
  deriveOnboardingConsoleProgressStep,
  deriveOnboardingGuestPreviewProgressStep,
  onboardingEntitlementPaidForRole,
  onboardingRoleConfirmViewFromMe,
  parseOnboardingEntitlementsView,
  parseOnboardingQuoteView,
  parseOnboardingRoleConfirmView,
} from "@/lib/me/meOnboardingViewModel";

import { MeOnboardingEntitlementsSection } from "./MeOnboardingEntitlementsSection";
import { MeOnboardingSessionContextBanner } from "./MeOnboardingSessionContextBanner";
import { MeOnboardingQuoteSection } from "./MeOnboardingQuoteSection";
import { MeOnboardingWritesLoginGate } from "./MeOnboardingWritesLoginGate";
import { MeOnboardingWritesProbeShell } from "./MeOnboardingWritesProbeShell";
import { MeOnboardingWritesSection } from "./MeOnboardingWritesSection";
import { MeOnboardingGuestEntryNotice } from "./MeOnboardingGuestEntryNotice";
import { MeOnboardingWorkspaceReturnLink } from "@/components/me/onboarding/MeOnboardingWorkspaceReturnLink";
import { MERCHANT_WORKSPACE_HREF } from "@/lib/workspace/workspaceIdentityModel";
import {
  isMeOnboardingFromContext,
  isMeOnboardingGuestEntryAllowed,
} from "./meOnboardingGuestAccess";
import { buildMeOnboardingAuthReturnPath } from "./meOnboardingLoginReturn";
import { useMeOnboardingClientWalletConnected } from "./useMeOnboardingClientWalletConnected";
import { useMeOnboardingPage } from "./useMeOnboardingPage";
import MeOnboardingLoading from "./loading";

/** 96-18 准入页（商家 Console · ①）：报价 / 资格 / USDC 支付。主理人 USDC → `stewardAdmissionNav` 工作台 A 轨（本页 `role=region_steward` 仅 redirect）。 */
export default function MeOnboardingPageMain() {
  const mainTitleId = useId();
  const quoteSectionId = useId();
  const entSectionId = useId();
  const writesSectionId = useId();
  const footerLinkClass = accountFooterLinkClass();

  const router = useRouter();
  const searchParams = useSearchParams();
  const walletConnected = useMeOnboardingClientWalletConnected();
  const guestEntryAllowed = isMeOnboardingGuestEntryAllowed(searchParams);
  const fromRaw = searchParams.get("from");
  const fromContext = isMeOnboardingFromContext(fromRaw) ? fromRaw : null;
  const vm = useMeOnboardingPage();
  const {
    t,
    loggedIn,
    quoteRole,
    setQuoteRole,
    quoteJson,
    quoteErr,
    quoteErrCode,
    quoteLoading,
    loadQuote,
    quoteRetrySecsLeft,
    sessionChecked,
    sessionChecking,
    entJson,
    entErr,
    entLoading,
    loadEntitlements,
    payLoading,
    payErr,
    payErrCode,
    payJson,
    onCreatePaymentIntent,
    roleLoading,
    roleErr,
    roleErrCode,
    roleJson,
    onRequestRoleConfirm,
    payRetrySecsLeft,
    roleRetrySecsLeft,
    entAutoSyncing,
    mePayload,
    roleConfirmedPersisted,
    roleLocked,
  } = vm;

  const authReturnPath = useMemo(
    () => buildMeOnboardingAuthReturnPath(searchParams, quoteRole),
    [searchParams, quoteRole],
  );

  useEffect(() => {
    if (quoteRole !== "region_steward") return;
    router.replace(authReturnPath);
  }, [authReturnPath, quoteRole, router]);

  const pendingSessionGate = !sessionChecked || sessionChecking;
  const needsLoginGate =
    fromRaw !== "settings" &&
    sessionChecked &&
    !sessionChecking &&
    !loggedIn &&
    !guestEntryAllowed;

  useEffect(() => {
    if (!needsLoginGate) return;
    router.replace(`/auth/login?returnUrl=${encodeURIComponent(authReturnPath)}`);
  }, [needsLoginGate, authReturnPath, router]);

  if (quoteRole === "region_steward") {
    return <MeOnboardingLoading data-tt-me-onboarding-steward-redirect="1" />;
  }

  const quote = parseOnboardingQuoteView(quoteJson, quoteRole);
  const entitlements = parseOnboardingEntitlementsView(entJson);
  const roleConfirm =
    parseOnboardingRoleConfirmView(roleJson) ??
    onboardingRoleConfirmViewFromMe(mePayload, quoteRole);
  const roleConfirmed = roleConfirm?.userRole != null || roleConfirmedPersisted;
  const hasActivePaidForRole = onboardingEntitlementPaidForRole(entitlements, quoteRole);
  const flowPhase = deriveOnboardingFlowPhase({
    loggedIn,
    quoteReady: quote != null && !quoteErr,
    hasActivePaid: hasActivePaidForRole,
    hasPaymentDraft: payJson != null,
    roleConfirmed,
  });
  const entitlementsSyncing =
    loggedIn && (entAutoSyncing || payLoading || flowPhase === "pay_pending");
  const entitlementsAwaitingPayment =
    loggedIn &&
    !hasActivePaidForRole &&
    (flowPhase === "pay" || flowPhase === "pay_pending") &&
    !entitlementsSyncing;
  const loginPhaseGuest = !sessionChecking && flowPhase === "login" && !loggedIn;
  const integrateWalletSessionInNextStep = loginPhaseGuest && walletConnected;
  const showWalletSessionHintInNextStep = loginPhaseGuest && !walletConnected;
  const guestQuotePreview =
    guestEntryAllowed && !loggedIn && sessionChecked && !sessionChecking && quote != null && !quoteErr;
  const consoleProgressStep = guestQuotePreview
    ? deriveOnboardingGuestPreviewProgressStep(quoteRole)
    : deriveOnboardingConsoleProgressStep(flowPhase, quoteRole);
  const progressCompactLabelOverride =
    flowPhase === "confirm" ? t("me_onboarding_progressConfirmProvider") : undefined;
  const hideConfirmNextStep = loggedIn && flowPhase === "confirm";

  if (pendingSessionGate || needsLoginGate) {
    return <MeOnboardingLoading data-tt-me-onboarding-gate-redirect="1" />;
  }

  const fromSettings = fromRaw === "settings";

  const pageIntro = fromSettings ? (
    <MeSettingsSubpageHeader
      t={t}
      titleId={mainTitleId}
      eyebrowKey="me_settings_section_account_security"
      titleKey="me_onboarding_title"
      subtitleKey="me_onboarding_subtitle"
    />
  ) : (
    <div>
      <h1 id={mainTitleId} className="text-h3 font-semibold text-ink-900">
        {t("me_onboarding_title")}
      </h1>
      <p className="mt-2 max-w-2xl text-kicker leading-relaxed text-ink-600">{t("me_onboarding_subtitle")}</p>
    </div>
  );

  const inner = (
    <div className={fromSettings ? "flex flex-col gap-6" : TT_ME_ONBOARDING_L5.pageSectionStack}>
        {fromSettings ? <MeSettingsHubBackLink t={t} /> : null}
        <div>
          {pageIntro}
          {meOnboardingDevUiEnabled() ? (
            <p
              className="mt-3 rounded-[var(--radius-sm)] border border-warning/30 bg-warning/10 p-3 text-small text-ink-800"
              role="note"
            >
              {t("me_onboarding_devNotice")}
            </p>
          ) : null}
          <MeOnboardingSessionContextBanner
            t={t}
            sessionChecking={sessionChecking}
            sessionChecked={sessionChecked}
            loggedIn={loggedIn}
          />
          {sessionChecked &&
          !loggedIn &&
          fromContext &&
          !integrateWalletSessionInNextStep &&
          !guestQuotePreview ? (
            <MeOnboardingGuestEntryNotice t={t} from={fromContext} />
          ) : null}
          {fromContext === "provider_pending" && quoteRole === "provider" ? (
            <MeOnboardingWorkspaceReturnLink
              t={t}
              href={MERCHANT_WORKSPACE_HREF}
              labelKey="me_onboarding_return_provider_workbench"
            />
          ) : null}
          <MeOnboardingConsoleProgress
            role={quoteRole}
            currentStep={consoleProgressStep}
            allComplete={deriveOnboardingConsoleProgressAllComplete(flowPhase)}
            className="mt-5"
            defaultExpanded={false}
            sessionChecking={sessionChecking}
            guestQuotePreview={guestQuotePreview}
            compactLabelOverride={progressCompactLabelOverride}
          />
          {!hideConfirmNextStep ? (
            <div className="mt-4">
              <MeOnboardingNextStep
                t={t}
                phase={flowPhase}
                quoteRole={quoteRole}
                loggedIn={loggedIn}
                sessionChecking={sessionChecking}
                showWalletSessionHint={showWalletSessionHintInNextStep}
                integrateWalletSession={integrateWalletSessionInNextStep}
                guestQuotePreview={guestQuotePreview}
                authReturnPath={authReturnPath}
                writesSectionId={writesSectionId}
              />
            </div>
          ) : null}
          {flowPhase === "done" ? <MeOnboardingDonePanel t={t} quoteRole={quoteRole} /> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <MeOnboardingQuoteSection
            t={t}
            quoteSectionId={quoteSectionId}
            quoteRole={quoteRole}
            setQuoteRole={setQuoteRole}
            roleLocked={roleLocked}
            quoteJson={quoteJson}
            quoteErr={quoteErr}
            quoteErrCode={quoteErrCode}
            quoteLoading={quoteLoading}
            loadQuote={loadQuote}
            quoteRetrySecsLeft={quoteRetrySecsLeft}
          />

          <MeOnboardingEntitlementsSection
            t={t}
            entSectionId={entSectionId}
            footerLinkClass={footerLinkClass}
            quoteRole={quoteRole}
            writesSectionId={writesSectionId}
            hideEmptyPaymentCta={
              flowPhase === "pay" || flowPhase === "pay_pending" || flowPhase === "confirm"
            }
            entitlementsSyncing={entitlementsSyncing}
            entitlementsAwaitingPayment={entitlementsAwaitingPayment}
            sessionChecking={sessionChecking}
            sessionChecked={sessionChecked}
            loggedIn={loggedIn}
            entJson={entJson}
            entErr={entErr}
            entLoading={entLoading}
            loadEntitlements={loadEntitlements}
            entAutoSyncing={entAutoSyncing}
          />
        </div>

        {sessionChecking || !sessionChecked ? (
          <MeOnboardingWritesProbeShell t={t} />
        ) : loggedIn ? (
          <MeOnboardingWritesSection
            t={t}
            writesSectionId={writesSectionId}
            quoteRole={quoteRole}
            flowPhase={flowPhase}
            hasActivePaid={hasActivePaidForRole}
            payLoading={payLoading}
            payErr={payErr}
            payErrCode={payErrCode}
            payJson={payJson}
            onCreatePaymentIntent={onCreatePaymentIntent}
            roleLoading={roleLoading}
            roleErr={roleErr}
            roleErrCode={roleErrCode}
            roleJson={roleJson}
            roleConfirm={roleConfirm}
            onRequestRoleConfirm={onRequestRoleConfirm}
            payRetrySecsLeft={payRetrySecsLeft}
            roleRetrySecsLeft={roleRetrySecsLeft}
            loadEntitlements={loadEntitlements}
            quoteJson={quoteJson}
          />
        ) : (
          <MeOnboardingWritesLoginGate t={t} quoteRole={quoteRole} />
        )}

        <p className="flex flex-wrap gap-4">
          {fromSettings ? (
            <Link
              href="/me/settings"
              className={`${TT_ME_SETTINGS_L5.backLink} ${TT_ME_ONBOARDING_L5.footerBackLink}`}
            >
              {t("me_settings_back_hub")}
            </Link>
          ) : null}
          <Link href="/me/identities" className={`${footerLinkClass} ${TT_ME_ONBOARDING_L5.footerBackLink}`}>
            {t("me_onboarding_backIdentities")}
          </Link>
        </p>

        {!fromSettings ? (
          <div className="border-t border-ink-200 pt-6">
            <ProductCrossNav
              ariaLabelKey="me_onboarding_relatedNav_aria"
              showGuides
              hideFeeRouterLinks
              linkClassName={footerLinkClass}
            />
          </div>
        ) : null}
      </div>
  );

  if (fromSettings) {
    return (
      <MeSettingsL5FlowPage
        aria-labelledby={mainTitleId}
        route="onboarding"
        dataAttrs={{
          "data-tt-me-settings-route": "onboarding",
          "data-tt-me-onboarding-from-settings": "1",
          ...TT_ME_ONBOARDING_L5.pageAttrs,
        }}
        showMinimalFooter={false}
      >
        {inner}
      </MeSettingsL5FlowPage>
    );
  }

  return (
    <main
      className={TT_MARKETING_ACCOUNT_PAGE_SHELL}
      aria-labelledby={mainTitleId}
      {...TT_ME_ONBOARDING_L5.pageAttrs}
    >
      {inner}
    </main>
  );
}
