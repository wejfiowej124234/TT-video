import { TT_MARKETING_CONSOLE_LINK_FOCUS } from "@/lib/marketingUi";
import {
  MeOnboardingStatusPill,
  MeOnboardingSummaryGrid,
  MeOnboardingSummaryItem,
  MeOnboardingTechnicalDetails,
} from "@/components/me/MeOnboardingSummaryPrimitives";
import { meOnboardingDevUiEnabled } from "@/lib/me/meOnboardingDevGate";
import type { OnboardingFlowPhase, OnboardingRoleConfirmView } from "@/lib/me/meOnboardingViewModel";
import {
  onboardingRoleTargetLabel,
  parseOnboardingPaymentIntentView,
  parseOnboardingQuoteView,
  parseOnboardingRoleConfirmView,
} from "@/lib/me/meOnboardingViewModel";
import { MeOnboardingWritesStageRail, type MeOnboardingWriteStageBlock } from "@/components/me/MeOnboardingWritesStageRail";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

import {
  ME_ONBOARDING_BTN_SECONDARY_CLASS,
  ME_ONBOARDING_SECTION_CARD_CLASS,
} from "./meOnboardingPageChrome";
import {
  onboardingCheckoutUrlFromResponse,
  onboardingClientSecretFromResponse,
  onboardingWriteRateLimited,
  onboardingWriteRetryable,
} from "./meOnboardingPageHelpers";
import { MeOnboardingUsdcFeePayment } from "@/components/me/onboarding/MeOnboardingUsdcFeePayment";
import { onboardingFeeUsdcPaymentConfigured } from "@/lib/onboarding/onboardingFeeEnv";
import { MeOnboardingLocalDevTools } from "./MeOnboardingLocalDevTools";
import { StripeOnboardingPayment } from "./StripeOnboardingPayment";
import type { OnboardingQuoteRole } from "@/lib/apiClient";
import { onboardingLocalDevToolsEnabled } from "./meOnboardingPageHelpers";
import type { UseMeOnboardingPageResult } from "./useMeOnboardingPage";

type T = UseMeOnboardingPageResult["t"];

export type MeOnboardingWritesSectionProps = {
  t: T;
  writesSectionId: string;
  quoteRole: OnboardingQuoteRole;
  flowPhase: OnboardingFlowPhase;
  hasActivePaid: boolean;
  roleConfirm?: OnboardingRoleConfirmView | null;
} & Pick<
  UseMeOnboardingPageResult,
  | "payLoading"
  | "payErr"
  | "payErrCode"
  | "payJson"
  | "onCreatePaymentIntent"
  | "roleLoading"
  | "roleErr"
  | "roleErrCode"
  | "roleJson"
  | "onRequestRoleConfirm"
  | "payRetrySecsLeft"
  | "roleRetrySecsLeft"
  | "loadEntitlements"
  | "quoteJson"
>;

export function MeOnboardingWritesSection({
  t,
  writesSectionId,
  quoteRole,
  flowPhase,
  hasActivePaid,
  roleConfirm: roleConfirmProp,
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
  loadEntitlements,
  quoteJson,
}: MeOnboardingWritesSectionProps) {
  const payment = parseOnboardingPaymentIntentView(payJson);
  const quoteView = parseOnboardingQuoteView(quoteJson, quoteRole);
  const usdcFeePrimary = onboardingFeeUsdcPaymentConfigured();
  const roleConfirm = roleConfirmProp ?? parseOnboardingRoleConfirmView(roleJson);
  const canConfirmRole = hasActivePaid && flowPhase !== "done";
  const showDevLoop = meOnboardingDevUiEnabled();
  const checkoutUrl = onboardingCheckoutUrlFromResponse(payJson);
  const clientSecret = onboardingClientSecretFromResponse(payJson);
  const hasPayFlowPanel = Boolean(checkoutUrl || clientSecret);
  const showPaymentStage = flowPhase === "pay" || flowPhase === "pay_pending";
  const showCreatePaymentButton = showPaymentStage && !hasPayFlowPanel;
  const confirmIsPrimary = flowPhase === "confirm";
  const paymentStageState =
    flowPhase === "confirm" || flowPhase === "done" ? "done" : showPaymentStage ? "active" : "pending";
  const confirmStageState =
    flowPhase === "done" ? "done" : flowPhase === "confirm" ? "active" : "pending";
  const writeStageShell = (state: typeof paymentStageState) =>
    `${TT_ME_ONBOARDING_L5.writeStage} ${
      state === "active"
        ? TT_ME_ONBOARDING_L5.writeStageActive
        : state === "done"
          ? TT_ME_ONBOARDING_L5.writeStageDone
          : ""
    }`.trim();

  const writeStages: MeOnboardingWriteStageBlock[] = [];

  if (flowPhase !== "done" && showPaymentStage) {
    writeStages.push({
      step: 1,
      state: paymentStageState,
      title: t("me_onboarding_writesPaymentStage"),
      hint: showCreatePaymentButton
        ? t("me_onboarding_writesPaymentStageHintCompact")
        : t("me_onboarding_writesPaymentStageHint"),
      shellClass: writeStageShell(paymentStageState),
      dataStage: "payment",
      children: (
        <>
          {quoteRole === "region_steward" ? (
            <div
              className="mb-3 rounded-[var(--radius-sm)] border border-ref-sun/25 bg-ref-sun/5 p-3 text-meta leading-relaxed text-ink-700"
              role="note"
              data-tt-me-onboarding-steward-fee-clarify="1"
            >
              <p className="font-semibold text-ink-900">{t("me_onboarding_stewardFeeClarifyTitle")}</p>
              <p className="mt-1">{t("me_onboarding_stewardFeeClarifyBody")}</p>
              {!onboardingLocalDevToolsEnabled() ? (
                <p className="mt-2 text-ink-600">{t("me_onboarding_stewardFeeLocalDevHint")}</p>
              ) : null}
            </div>
          ) : (
            <div
              className="mb-3 rounded-[var(--radius-sm)] border border-ref-sun/25 bg-ref-sun/5 p-3 text-meta leading-relaxed text-ink-700"
              role="note"
              data-tt-me-onboarding-provider-fee-clarify="1"
            >
              <p className="font-semibold text-ink-900">{t("me_onboarding_providerFeeClarifyTitle")}</p>
              <p className="mt-1">{t("me_onboarding_providerFeeClarifyBody")}</p>
            </div>
          )}
          {showCreatePaymentButton ? (
            <div className={TT_ME_ONBOARDING_L5.actionStack}>
              <ol
                className="mb-3 list-decimal space-y-1 pl-5 text-meta leading-relaxed text-ink-700"
                data-tt-me-onboarding-pay-flow-steps="1"
              >
                <li>{t("me_onboarding_payFlowStep1")}</li>
                <li>{t("me_onboarding_payFlowStep2")}</li>
                <li>{t("me_onboarding_payFlowStep3")}</li>
                <li>{t("me_onboarding_payFlowStep4")}</li>
              </ol>
              <button
                type="button"
                className={TT_ME_ONBOARDING_L5.actionPrimaryBlock}
                aria-busy={payLoading}
                disabled={payLoading}
                onClick={() => void onCreatePaymentIntent()}
                data-testid="me-onboarding-create-intent"
              >
                {payLoading ? t("me_onboarding_loading") : t("me_onboarding_createPaymentIntent")}
              </button>
            </div>
          ) : null}
          {payErr ? (
            <div className="mt-3 space-y-2">
              <p className="text-small text-danger" role="alert">
                {payErr}
              </p>
              {onboardingWriteRetryable(payErrCode) ? (
                <div className="flex flex-wrap items-center gap-2">
                  {onboardingWriteRateLimited(payErrCode) && payRetrySecsLeft != null ? (
                    <p className="text-meta text-ink-600" aria-live="polite">
                      {t("me_onboarding_retryAfterCountdown", { n: payRetrySecsLeft })}
                    </p>
                  ) : null}
                  <p className="text-meta text-ink-600">{t("me_onboarding_retryHintWriteConflictOrRate")}</p>
                  <button
                    type="button"
                    className={ME_ONBOARDING_BTN_SECONDARY_CLASS}
                    aria-busy={payLoading}
                    disabled={
                      payLoading ||
                      (onboardingWriteRateLimited(payErrCode) &&
                        payRetrySecsLeft != null &&
                        payRetrySecsLeft > 0)
                    }
                    onClick={() => void onCreatePaymentIntent()}
                    data-testid="me-onboarding-retry-payment-intent"
                  >
                    {t("me_onboarding_retryAction")}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {payment ? (
            <>
              <MeOnboardingSummaryGrid>
                <MeOnboardingSummaryItem
                  label={t("me_onboarding_summaryPaymentChannel")}
                  value={
                    payment.hasCheckout ? (
                      <MeOnboardingStatusPill status={t("me_onboarding_channelCheckout")} variant="pending" />
                    ) : payment.hasClientSecret ? (
                      <MeOnboardingStatusPill status={t("me_onboarding_channelElements")} variant="pending" />
                    ) : (
                      <MeOnboardingStatusPill status={t("me_onboarding_channelPending")} variant="neutral" />
                    )
                  }
                />
              </MeOnboardingSummaryGrid>
              {showDevLoop ? (
                <MeOnboardingTechnicalDetails label={t("me_onboarding_technicalDetails")} json={payJson} />
              ) : null}
            </>
          ) : showDevLoop && payJson != null ? (
            <MeOnboardingTechnicalDetails label={t("me_onboarding_technicalDetails")} json={payJson} />
          ) : null}
          {usdcFeePrimary && quoteView ? (
            <MeOnboardingUsdcFeePayment
              t={t}
              amountMinor={quoteView.amountMinor}
              amountLabel={quoteView.amountLabel}
              onAfterSubmit={() => void loadEntitlements()}
            />
          ) : null}
          {!usdcFeePrimary && checkoutUrl ? (
            <div className={TT_ME_ONBOARDING_L5.stripePanel}>
              <h4 className="text-small font-semibold text-ink-900">{t("me_onboarding_stripeCheckoutTitle")}</h4>
              <p className="mt-1 text-meta text-ink-600">{t("me_onboarding_stripeCheckoutHint")}</p>
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${TT_ME_ONBOARDING_L5.actionPrimaryBlock} mt-3 inline-flex items-center justify-center no-underline`}
              >
                {t("me_onboarding_stripeCheckoutOpen")}
                <span className="sr-only"> {t("me_onboarding_stripeCheckoutNewTabSrOnly")}</span>
              </a>
            </div>
          ) : null}
          {!usdcFeePrimary && clientSecret ? (
            <div className={TT_ME_ONBOARDING_L5.stripePanel}>
              <h4 className="text-small font-semibold text-ink-900">{t("me_onboarding_stripePayTitle")}</h4>
              <p className="mt-1 text-meta text-ink-600">{t("me_onboarding_stripePayHint")}</p>
              <StripeOnboardingPayment
                clientSecret={clientSecret}
                onComplete={() => void loadEntitlements()}
                submitLabel={t("me_onboarding_stripeSubmit")}
                submitBusyLabel={t("me_onboarding_loading")}
                missingPkMessage={t("me_onboarding_stripeMissingPk")}
              />
            </div>
          ) : null}
          <MeOnboardingLocalDevTools t={t} payJson={payJson} loadEntitlements={loadEntitlements} />
        </>
      ),
    });
  }

  if (flowPhase !== "done") {
    writeStages.push({
      step: 2,
      state: confirmStageState,
      title: t("me_onboarding_writesConfirmStage"),
      hint: t(
        quoteRole === "region_steward"
          ? "me_onboarding_roleConfirmHintSteward"
          : "me_onboarding_roleConfirmHintProvider",
      ),
      shellClass: writeStageShell(confirmStageState),
      dataStage: "confirm",
      children: (
        <>
          {!canConfirmRole ? (
            <p id={`${writesSectionId}-confirm-hint`} className={TT_ME_ONBOARDING_L5.confirmBlockedCallout}>
              {t("me_onboarding_roleConfirmBlockedHint")}
            </p>
          ) : null}
          <div className={TT_ME_ONBOARDING_L5.actionStack}>
            <button
              type="button"
              className={
                confirmIsPrimary && canConfirmRole
                  ? TT_ME_ONBOARDING_L5.actionPrimaryBlock
                  : confirmIsPrimary
                    ? TT_ME_ONBOARDING_L5.actionPrimaryLocked
                    : ME_ONBOARDING_BTN_SECONDARY_CLASS
              }
              aria-busy={roleLoading}
              disabled={roleLoading || !canConfirmRole}
              aria-describedby={!canConfirmRole ? `${writesSectionId}-confirm-hint` : undefined}
              aria-disabled={!canConfirmRole}
              data-tt-me-onboarding-confirm-locked={!canConfirmRole ? "1" : undefined}
              onClick={() => void onRequestRoleConfirm()}
              data-testid="me-onboarding-role-confirm"
            >
              {!canConfirmRole ? (
                <span className="inline-flex items-center justify-center">
                  <span className={TT_ME_ONBOARDING_L5.confirmLockedBadge}>{t("me_onboarding_confirmLockedBadge")}</span>
                  {t("me_onboarding_requestRoleConfirm")}
                </span>
              ) : roleLoading ? (
                t("me_onboarding_loading")
              ) : (
                t("me_onboarding_requestRoleConfirm")
              )}
            </button>
          </div>
          {roleErr ? (
            <div className="mt-3 space-y-2">
              <p className="text-small text-danger" role="alert">
                {roleErr}
              </p>
              {onboardingWriteRetryable(roleErrCode) ? (
                <div className="flex flex-wrap items-center gap-2">
                  {onboardingWriteRateLimited(roleErrCode) && roleRetrySecsLeft != null ? (
                    <p className="text-meta text-ink-600" aria-live="polite">
                      {t("me_onboarding_retryAfterCountdown", { n: roleRetrySecsLeft })}
                    </p>
                  ) : null}
                  <p className="text-meta text-ink-600">{t("me_onboarding_retryHintWriteConflictOrRate")}</p>
                  <button
                    type="button"
                    className={ME_ONBOARDING_BTN_SECONDARY_CLASS}
                    aria-busy={roleLoading}
                    disabled={
                      roleLoading ||
                      (onboardingWriteRateLimited(roleErrCode) &&
                        roleRetrySecsLeft != null &&
                        roleRetrySecsLeft > 0)
                    }
                    onClick={() => void onRequestRoleConfirm()}
                    data-testid="me-onboarding-retry-role-confirm"
                  >
                    {t("me_onboarding_retryAction")}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ),
    });
  }

  return (
    <section
      id={writesSectionId}
      className={ME_ONBOARDING_SECTION_CARD_CLASS}
      aria-labelledby={`${writesSectionId}-title`}
    >
      <h2 id={`${writesSectionId}-title`} className="text-h4 font-semibold text-ink-900">
        {t("me_onboarding_writesSection")}
      </h2>
      {flowPhase === "done" ? (
        <p className="mt-2 text-meta text-ink-700" role="status">
          {t("me_onboarding_writesDoneSummary")}
        </p>
      ) : null}
      {showDevLoop ? (
        <details className="mt-4 rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/50 p-3">
          <summary
            className={`cursor-pointer text-small font-semibold text-ink-900 ${TT_MARKETING_CONSOLE_LINK_FOCUS} focus-visible:ring-offset-bg-console rounded-[var(--radius-sm)] px-1 -mx-1 py-0.5`}
          >
            {t("me_onboarding_localLoopTitle")}
          </summary>
          <p className="mt-2 whitespace-pre-line text-meta leading-relaxed text-ink-700">
            {t("me_onboarding_localLoopIntro")}
          </p>
        </details>
      ) : null}

      {writeStages.length > 0 ? <MeOnboardingWritesStageRail stages={writeStages} /> : null}

      {roleConfirm ? (
        <>
          <MeOnboardingSummaryGrid>
            {roleConfirm.role ? (
              <MeOnboardingSummaryItem
                label={t("me_onboarding_summaryRole")}
                value={onboardingRoleTargetLabel(roleConfirm.role, t)}
              />
            ) : null}
            {roleConfirm.userRole ? (
              <MeOnboardingSummaryItem
                label={t("me_onboarding_summaryUserRole")}
                value={
                  <MeOnboardingStatusPill
                    status={onboardingRoleTargetLabel(roleConfirm.userRole, t)}
                    variant="paid"
                  />
                }
              />
            ) : null}
          </MeOnboardingSummaryGrid>
          {showDevLoop ? (
            <MeOnboardingTechnicalDetails label={t("me_onboarding_technicalDetails")} json={roleJson} />
          ) : null}
        </>
      ) : showDevLoop && roleJson != null ? (
        <MeOnboardingTechnicalDetails label={t("me_onboarding_technicalDetails")} json={roleJson} />
      ) : null}
    </section>
  );
}
