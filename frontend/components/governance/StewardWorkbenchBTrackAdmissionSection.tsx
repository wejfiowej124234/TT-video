"use client";

import { useId } from "react";
import { FOCUS_RING } from "@/components/me/constants";
import { MeOnboardingLocalDevTools } from "@/app/me/onboarding/MeOnboardingLocalDevTools";
import {
  onboardingWriteRateLimited,
  onboardingWriteRetryable,
} from "@/app/me/onboarding/meOnboardingPageHelpers";
import { MeOnboardingUsdcFeePayment } from "@/components/me/onboarding/MeOnboardingUsdcFeePayment";
import { onboardingFeeUsdcPaymentConfigured } from "@/lib/onboarding/onboardingFeeEnv";
import { STEWARD_B_TRACK_ADMISSION_ANCHOR, STEWARD_A_TRACK_CONFIRM_ANCHOR, STEWARD_A_TRACK_PAYMENT_ANCHOR } from "@/lib/steward/stewardBTrackModel";
import type { useStewardOnboardingBTrack } from "@/lib/steward/useStewardOnboardingBTrack";
import {
  buildStewardAdmissionQuoteDisplay,
  resolveStewardAdmissionPrimaryJurisdiction,
} from "@/lib/steward/stewardAdmissionQuoteDisplayModel";
import StewardWorkbenchAdmissionQuotePanel from "@/components/governance/StewardWorkbenchAdmissionQuotePanel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type StewardWorkbenchBTrackAdmissionSectionProps = {
  bTrack: ReturnType<typeof useStewardOnboardingBTrack>;
  /** 顶栏进度条已展示状态时，去掉重复 badge / 说明 / 步骤摘要 */
  slimCompanion?: boolean;
  primaryJurisdiction?: string | null;
};

/** 主理人工作台 · B 轨 USDC 准入费（96-18 · 操作面 only） */
export default function StewardWorkbenchBTrackAdmissionSection({
  bTrack,
  slimCompanion = false,
  primaryJurisdiction = null,
}: StewardWorkbenchBTrackAdmissionSectionProps) {
  const sectionId = useId();
  const {
    t,
    loading,
    quote,
    quoteErr,
    quoteLoading,
    loadQuote,
    entErr,
    loadEntitlements,
    bTrackComplete,
    bTrackPaid,
    flowPhase,
    hasActivePaid,
    payLoading,
    payErr,
    payErrCode,
    payJson,
    onCreatePaymentIntent,
    roleLoading,
    roleErr,
    roleErrCode,
    onRequestRoleConfirm,
    payRetrySecsLeft,
    roleRetrySecsLeft,
  } = bTrack;

  const usdcConfigured = onboardingFeeUsdcPaymentConfigured();
  const showPaymentActions = !bTrackComplete && (flowPhase === "pay" || flowPhase === "pay_pending");
  const showConfirm = !bTrackComplete && flowPhase === "confirm";
  const canConfirmRole = hasActivePaid && showConfirm;
  const jurisdiction = resolveStewardAdmissionPrimaryJurisdiction(
    primaryJurisdiction ? [primaryJurisdiction] : null,
  );
  const quoteDisplay = quote
    ? buildStewardAdmissionQuoteDisplay({ quote, primaryJurisdiction: jurisdiction })
    : null;

  return (
    <section
      id={STEWARD_B_TRACK_ADMISSION_ANCHOR}
      className={`${TT_WORKSPACE_L5.sectionCard} scroll-mt-24`}
      aria-labelledby={sectionId}
      data-tt-steward-workbench-b-track="1"
      data-tt-steward-workbench-b-track-complete={bTrackComplete ? "1" : "0"}
      data-tt-steward-workbench-b-track-slim={slimCompanion ? "1" : "0"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-meta uppercase tracking-wider text-ref-sun/70">
            {t("steward_workbench_b_track_label")}
          </p>
          <h2 id={sectionId} className={TT_WORKSPACE_L5.sectionTitle}>
            {t("steward_workbench_b_track_title")}
          </h2>
          {!slimCompanion ? (
            <p className={`mt-2 ${TT_WORKSPACE_L5.sectionSubtitle}`}>
              {t("steward_workbench_b_track_subtitle")}
            </p>
          ) : null}
        </div>
        {!slimCompanion ? (
          bTrackComplete ? (
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-meta font-medium text-emerald-200">
              {t("steward_workbench_b_track_status_complete")}
            </span>
          ) : bTrackPaid ? (
            <span className="rounded-full border border-ref-sun/30 bg-ref-sun/10 px-3 py-1 text-meta font-medium text-ref-sun">
              {t("steward_workbench_b_track_status_paid_pending_confirm")}
            </span>
          ) : (
            <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-meta font-medium text-amber-100">
              {t("steward_workbench_b_track_status_pending")}
            </span>
          )
        ) : null}
      </div>

      {!slimCompanion ? (
        <div
          className="mt-4 rounded-xl border border-ref-sun/15 bg-ref-sun/[0.04] p-3 text-meta leading-relaxed text-slate-400"
          role="note"
          data-tt-steward-workbench-dual-track-disclosure="1"
        >
          <p className="font-semibold text-slate-200">{t("me_onboarding_stewardFeeClarifyTitle")}</p>
          <p className="mt-1">{t("steward_workbench_b_track_disclosure_body")}</p>
        </div>
      ) : null}

      {loading && !quote ? (
        <p className={`mt-4 ${TT_WORKSPACE_L5.sectionSubtitle}`} aria-busy="true">
          {t("common_loading")}
        </p>
      ) : null}

      {quoteErr ? (
        <div className={`mt-4 ${TT_WORKSPACE_L5.errorPanel}`}>
          <p className="text-small text-danger" role="alert">
            {quoteErr}
          </p>
          <button
            type="button"
            className={`${TT_WORKSPACE_L5.secondaryBtn} mt-3 ${FOCUS_RING}`}
            onClick={() => loadQuote()}
          >
            {t("common_retry")}
          </button>
        </div>
      ) : null}

      {quoteDisplay && slimCompanion ? (
        <StewardWorkbenchAdmissionQuotePanel t={t} display={quoteDisplay} />
      ) : null}

      {quote && !slimCompanion ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-3" data-tt-steward-workbench-b-track-quote="1">
          <div className={`${TT_WORKSPACE_L5.statTile} min-w-0 text-left`}>
            <dt className={TT_WORKSPACE_L5.statLabel}>{t("me_onboarding_summaryAmount")}</dt>
            <dd className={`${TT_WORKSPACE_L5.statValueAccent} text-base sm:text-h3`}>{quote.amountLabel}</dd>
          </div>
          <div className={`${TT_WORKSPACE_L5.statTile} min-w-0 text-left`}>
            <dt className={TT_WORKSPACE_L5.statLabel}>{t("me_onboarding_summarySku")}</dt>
            <dd className="mt-1 break-all font-mono text-meta leading-snug text-[#fde9a8]" title={quote.sku}>
              {quote.sku}
            </dd>
          </div>
          <div className={`${TT_WORKSPACE_L5.statTile} min-w-0 text-left`}>
            <dt className={TT_WORKSPACE_L5.statLabel}>{t("me_onboarding_summaryFeeSchedule")}</dt>
            <dd className="mt-1 break-all font-mono text-meta leading-snug text-[#fde9a8]">
              {quote.feeScheduleVersion}
            </dd>
          </div>
        </dl>
      ) : null}

      {entErr ? (
        <p className="mt-3 text-small text-danger" role="alert">
          {entErr}
        </p>
      ) : null}

      {!bTrackComplete ? (
        <div className="mt-4 space-y-4" data-tt-steward-workbench-b-track-writes="1">
          {bTrackPaid && !showPaymentActions ? (
            <div
              id={STEWARD_A_TRACK_PAYMENT_ANCHOR}
              className="scroll-mt-28 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3"
              data-tt-steward-workbench-a-track-stage="payment-complete"
            >
              <p className="text-meta font-semibold text-emerald-200">
                {t("steward_workbench_a_track_step_pay_done_title")}
              </p>
              <p className="mt-1 text-meta leading-relaxed text-slate-400">
                {t("steward_workbench_a_track_step_pay_done_body", {
                  amount: quote?.amountLabel ?? "—",
                })}
              </p>
            </div>
          ) : null}
          {showPaymentActions ? (
            <div
              id={STEWARD_A_TRACK_PAYMENT_ANCHOR}
              className="scroll-mt-28 rounded-xl border border-ref-sun/28 bg-ref-sun/[0.05] p-4 ring-1 ring-ref-sun/20"
              data-tt-steward-workbench-b-track-stage="payment"
            >
              <p className="text-meta font-medium text-ref-sun/90">{t("steward_workbench_a_track_pay_here_banner")}</p>
              <h3 className="mt-2 text-small font-semibold text-ref-sun/90">
                {t("steward_workbench_b_track_step_pay_title")}
              </h3>
              {!slimCompanion ? (
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-meta text-slate-400">
                  <li>{t("me_onboarding_payFlowStep1")}</li>
                  <li>{t("me_onboarding_payFlowStep2")}</li>
                  <li>{t("me_onboarding_payFlowStep3")}</li>
                </ol>
              ) : (
                <p className="mt-2 text-meta text-slate-400">{t("steward_workbench_b_track_step_pay_hint_short")}</p>
              )}
              {!payJson ? (
                <button
                  type="button"
                  className={`${TT_WORKSPACE_L5.primaryBtn} mt-4 min-h-[44px] w-full sm:w-auto ${FOCUS_RING}`}
                  aria-busy={payLoading}
                  disabled={payLoading || quoteLoading || !quote}
                  onClick={() => void onCreatePaymentIntent()}
                  data-testid="steward-workbench-b-track-create-intent"
                >
                  {payLoading ? t("common_loading") : t("me_onboarding_createPaymentIntent")}
                </button>
              ) : null}
              {payErr ? (
                <div className="mt-3 space-y-2">
                  <p className="text-small text-danger" role="alert">
                    {payErr}
                  </p>
                  {onboardingWriteRetryable(payErrCode) ? (
                    <button
                      type="button"
                      className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}
                      disabled={
                        payLoading ||
                        (onboardingWriteRateLimited(payErrCode) &&
                          payRetrySecsLeft != null &&
                          payRetrySecsLeft > 0)
                      }
                      onClick={() => void onCreatePaymentIntent()}
                    >
                      {t("me_onboarding_retryAction")}
                    </button>
                  ) : null}
                </div>
              ) : null}
              {usdcConfigured && quote && payJson ? (
                <div className="mt-4">
                  <MeOnboardingUsdcFeePayment
                    t={t}
                    amountMinor={quote.amountMinor}
                    amountLabel={quote.amountLabel}
                    onAfterSubmit={() => void loadEntitlements()}
                  />
                </div>
              ) : null}
              <MeOnboardingLocalDevTools t={t} payJson={payJson} loadEntitlements={loadEntitlements} />
            </div>
          ) : null}

          {(showConfirm || (hasActivePaid && !bTrackComplete)) && flowPhase !== "pay" ? (
            <div
              id={STEWARD_A_TRACK_CONFIRM_ANCHOR}
              className="scroll-mt-28 rounded-xl border border-ref-sun/28 bg-ref-sun/[0.05] p-4 ring-1 ring-ref-sun/15"
              data-tt-steward-workbench-b-track-stage="confirm"
            >
              <h3 className="text-small font-semibold text-ref-sun/90">
                {t("steward_workbench_b_track_step_confirm_title")}
              </h3>
              <p className="mt-2 text-meta text-slate-400">{t("me_onboarding_roleConfirmHintSteward")}</p>
              <button
                type="button"
                className={`${canConfirmRole ? TT_WORKSPACE_L5.primaryBtn : TT_WORKSPACE_L5.secondaryBtn} mt-4 min-h-[44px] w-full sm:w-auto ${FOCUS_RING}`}
                aria-busy={roleLoading}
                disabled={roleLoading || !canConfirmRole}
                onClick={() => void onRequestRoleConfirm()}
                data-testid="steward-workbench-b-track-role-confirm"
              >
                {roleLoading ? t("common_loading") : t("me_onboarding_requestRoleConfirm")}
              </button>
              {roleErr ? (
                <p className="mt-3 text-small text-danger" role="alert">
                  {roleErr}
                  {onboardingWriteRetryable(roleErrCode) && roleRetrySecsLeft != null && roleRetrySecsLeft > 0
                    ? ` (${roleRetrySecsLeft}s)`
                    : ""}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
