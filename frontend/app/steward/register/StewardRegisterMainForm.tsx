"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { StewardRegisterWizardProgress } from "@/components/steward/StewardRegisterWizardProgress";
import GuideRegisterInlineFieldError from "@/app/guide/register/GuideRegisterInlineFieldError";
import GuideRegisterWalletStepFlow from "@/app/guide/register/GuideRegisterWalletStepFlow";
import { getStewardStakeStatus } from "@/lib/apiClient/stewardApplications";
import { cumulativeStewardStakeBps, cumulativeTtgUnitsRequired } from "@/lib/governance/protocolSsot.v1";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_STEWARD_REGISTER_L5, formatStewardCumulativeStakeDisplay, formatStewardEmptyStakePreview } from "@/lib/steward/stewardRegisterL5";
import {
  stewardJurisdictionOptions,
  stewardRegisterStep2BlockReason,
} from "@/lib/steward/stewardRegisterValidation";
import {
  guideRegFocusRing,
  guideRegPrimaryCta,
  guideRegSecondaryBtn,
} from "@/app/guide/register/guideRegisterUiClasses";
import type { useStewardRegisterPage } from "./useStewardRegisterPage";
import { StewardRegisterWalletSection } from "./StewardRegisterWalletSection";

type Page = ReturnType<typeof useStewardRegisterPage>;

export function StewardRegisterMainForm(page: Page) {
  const {
    t,
    step,
    goToStep,
    selected,
    toggleJurisdiction,
    legalName,
    setLegalName,
    contactEmail,
    setContactEmail,
    wallet,
    setWallet,
    motivation,
    setMotivation,
    submitting,
    error,
    fieldInlineError,
    clearSubmitError,
    walletVerify,
    walletInputId,
    walletErrorId,
    isConnected,
    connectedAddress,
    walletMatchConnected,
    handleUseConnectedWallet,
    handleNextFromStep1,
    handleNextFromStep2,
    handleSubmit,
  } = page;

  const options = useMemo(() => stewardJurisdictionOptions(), []);
  const cumulativeBps = cumulativeStewardStakeBps(selected);
  const cumulativeTtg = cumulativeTtgUnitsRequired(selected);
  const stakeSummaryLine = formatStewardCumulativeStakeDisplay(cumulativeBps, cumulativeTtg);
  const emptyStakePreview = formatStewardEmptyStakePreview();
  const walletTrimmed = wallet.trim();
  const walletValid = /^0x[a-fA-F0-9]{40}$/.test(walletTrimmed);
  const [chainStakeByJurisdiction, setChainStakeByJurisdiction] = useState<
    Record<string, boolean | "checking" | "error">
  >({});
  const formTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  useEffect(() => {
    if (step === 2) {
      document.getElementById("steward-legal-name")?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (step !== 3 || !walletValid || selected.length === 0) {
      setChainStakeByJurisdiction({});
      return;
    }
    const ids = [...selected];
    setChainStakeByJurisdiction(Object.fromEntries(ids.map((id) => [id, "checking"])));
    let cancelled = false;
    void Promise.all(
      ids.map(async (id) => {
        try {
          const s = await getStewardStakeStatus(id, walletTrimmed);
          return [id, s.has_jurisdiction_stake] as const;
        } catch {
          return [id, "error"] as const;
        }
      }),
    ).then((rows) => {
      if (cancelled) return;
      const next: Record<string, boolean | "error"> = {};
      for (const [id, v] of rows) next[id] = v === "error" ? "error" : v;
      setChainStakeByJurisdiction(next);
    });
    return () => {
      cancelled = true;
    };
  }, [step, selected, walletTrimmed, walletValid]);

  const onForm = step === 1 ? handleNextFromStep1 : step === 2 ? handleNextFromStep2 : handleSubmit;
  const submitLabel =
    step === 3
      ? submitting
        ? t("steward_register_submitting")
        : t("steward_register_submit")
      : t("stewardRegister_next");

  const step1Blocked = step === 1 && selected.length === 0;
  const step2BlockReason =
    step === 2
      ? stewardRegisterStep2BlockReason({
          legal_name: legalName,
          contact_email: contactEmail,
          wallet_address: wallet,
          wallet_verified: walletVerify.walletVerified,
        })
      : null;
  const step2Blocked = step2BlockReason != null;
  const submitBlocked = step1Blocked || step2Blocked;
  const submitMuted = submitBlocked && !submitting;
  const chainStakeChecking =
    step === 3 &&
    walletValid &&
    selected.length > 0 &&
    selected.some((id) => chainStakeByJurisdiction[id] === "checking");

  const selectedLabels = useMemo(
    () => options.filter((o) => selected.includes(o.id)).map((o) => o.label),
    [options, selected],
  );

  return (
    <form
      className={TT_STEWARD_REGISTER_L5.formSection}
      onSubmit={onForm}
      data-tt-steward-register-form="1"
      data-tt-steward-register-step={String(step)}
      noValidate
    >
      <div ref={formTopRef} className="scroll-mt-24" aria-hidden="true" />
      <StewardRegisterWizardProgress currentStep={step} className="mb-4" />

      <p className="sr-only" aria-live="polite">
        {t("stewardRegister_stepIndicator").replace("{step}", String(step))}
      </p>

      {error &&
      !fieldInlineError("jurisdictions") &&
      !fieldInlineError("legalName") &&
      !fieldInlineError("contactEmail") &&
      !fieldInlineError("wallet") ? (
        <div className="mb-4">
          <ApiErrorAlert message={error} tone="dark" />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <p className={TT_AUTH_L5_FORM.sectionTitle}>{t("stewardRegister_wizardStep1Title")}</p>
          <fieldset className="flex flex-col gap-3">
            <legend className={TT_AUTH_L5_FORM.label}>{t("steward_register_jurisdictions")}</legend>
            <div className="flex flex-wrap gap-2">
              {options.map((o) => {
                const checked = selected.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className={`${TT_STEWARD_REGISTER_L5.jurisdictionChip} ${
                      checked
                        ? TT_STEWARD_REGISTER_L5.jurisdictionChipSelected
                        : TT_STEWARD_REGISTER_L5.jurisdictionChipUnselected
                    }`}
                    data-tt-steward-jurisdiction-chip={o.id}
                    data-tt-selected={checked ? "true" : "false"}
                    aria-pressed={checked}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleJurisdiction(o.id)}
                      aria-label={o.label}
                    />
                    <span aria-hidden>{checked ? "✓ " : ""}</span>
                    <span>{o.label}</span>
                  </label>
                );
              })}
            </div>
            <GuideRegisterInlineFieldError message={fieldInlineError("jurisdictions")} />
          </fieldset>

          {selected.length > 0 ? (
            <div className={TT_STEWARD_REGISTER_L5.stakeCallout} data-tt-steward-stake-quote="1">
              <p className="font-medium text-ref-sun/90">{t("steward_register_stake_summary")}</p>
              <p className="mt-1 text-small text-slate-200">{stakeSummaryLine}</p>
            </div>
          ) : (
            <div className={TT_STEWARD_REGISTER_L5.jurisdictionEmptyHint} id="steward-jurisdiction-empty-hint">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="font-medium text-slate-400">{t("steward_register_stake_summary")}</span>
                <span className="text-small font-medium text-slate-300">{emptyStakePreview}</span>
              </div>
              <p className="mt-2 text-meta text-slate-400">{t("stewardRegister_jurisdictionEmptyHint")}</p>
            </div>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <p className={TT_AUTH_L5_FORM.sectionTitle}>{t("stewardRegister_wizardStep2Title")}</p>
          {selected.length > 0 ? (
            <div className={`${TT_STEWARD_REGISTER_L5.stakeCallout} text-meta text-slate-300`} data-tt-steward-step2-stake-quote="1">
              {selectedLabels.join(" · ")} — {stakeSummaryLine}
            </div>
          ) : null}
          <div className={TT_AUTH_L5_FORM.fieldGroup}>
            <label className={TT_AUTH_L5_FORM.label} htmlFor="steward-legal-name">
              {t("steward_register_legal_name")} <span className="text-ref-coral">*</span>
            </label>
            <input
              id="steward-legal-name"
              autoComplete="organization"
              className={`${TT_AUTH_L5_FORM.field} ${TT_AUTH_L5_FORM.fieldFocus}`}
              value={legalName}
              onChange={(e) => {
                setLegalName(e.target.value);
                clearSubmitError();
              }}
            />
            <GuideRegisterInlineFieldError message={fieldInlineError("legalName")} />
          </div>
          <div className={TT_AUTH_L5_FORM.fieldGroup}>
            <label className={TT_AUTH_L5_FORM.label} htmlFor="steward-email">
              {t("steward_register_email")} <span className="text-ref-coral">*</span>
            </label>
            <input
              id="steward-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className={`${TT_AUTH_L5_FORM.field} ${TT_AUTH_L5_FORM.fieldFocus}`}
              value={contactEmail}
              onChange={(e) => {
                setContactEmail(e.target.value);
                clearSubmitError();
              }}
            />
            <GuideRegisterInlineFieldError message={fieldInlineError("contactEmail")} />
          </div>
          <StewardRegisterWalletSection>
            <GuideRegisterWalletStepFlow
              t={t}
              walletInputId={walletInputId}
              walletErrorId={walletErrorId}
              walletAddress={wallet}
              setWalletAddress={setWallet}
              clearSubmitError={clearSubmitError}
              isConnected={isConnected}
              connectedAddress={connectedAddress}
              walletMatchConnected={walletMatchConnected}
              copied={false}
              copyWalletBusy={false}
              walletVerified={walletVerify.walletVerified}
              walletVerifying={walletVerify.verifying}
              walletVerifyError={walletVerify.error}
              onWalletVerify={() => void walletVerify.runVerify()}
              onUseConnectedWallet={handleUseConnectedWallet}
              fieldInlineError={fieldInlineError("wallet")}
            />
            {walletTrimmed && /^0x[a-fA-F0-9]{40}$/.test(walletTrimmed) && !walletVerify.walletVerified ? (
              <p className="text-meta text-ref-sun/85" role="status" data-tt-steward-wallet-need-verify="1">
                {t("stewardRegister_walletFilledNeedVerify")}
              </p>
            ) : null}
          </StewardRegisterWalletSection>
          <div className={TT_AUTH_L5_FORM.fieldGroup}>
            <label className={TT_AUTH_L5_FORM.label} htmlFor="steward-motivation">
              {t("steward_register_motivation")}
            </label>
            <textarea
              id="steward-motivation"
              rows={3}
              className={TT_AUTH_L5_FORM.textarea}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
            />
          </div>
          <button type="button" className={guideRegSecondaryBtn} onClick={() => goToStep(1)}>
            {t("stewardRegister_back")}
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <p className={TT_AUTH_L5_FORM.sectionTitle}>{t("stewardRegister_wizardStep3Title")}</p>
          <p className="text-meta text-slate-400">{t("stewardRegister_confirmHint")}</p>
          <dl
            className={`${TT_STEWARD_REGISTER_L5.stakeCallout} space-y-2 text-small`}
            data-tt-steward-confirm-summary="1"
            aria-live="polite"
          >
            <div>
              <dt className="text-slate-500">{t("steward_register_jurisdictions")}</dt>
              <dd className="text-slate-100">{selectedLabels.join(" · ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("steward_register_stake_summary")}</dt>
              <dd className="text-slate-100">{stakeSummaryLine}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("steward_register_legal_name")}</dt>
              <dd className="text-slate-100">{legalName.trim() || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("steward_register_email")}</dt>
              <dd className="text-slate-100">{contactEmail.trim() || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("steward_register_wallet")}</dt>
              <dd className="break-all font-mono text-xs text-slate-100">{walletTrimmed || "—"}</dd>
            </div>
            {walletVerify.walletVerified ? (
              <div data-tt-steward-wallet-verified-summary="1">
                <dt className="text-slate-500">{t("steward_register_wallet_verify_status")}</dt>
                <dd className="text-ref-sun/90">{t("guideRegister_walletVerifiedOk")}</dd>
              </div>
            ) : null}
            {motivation.trim() ? (
              <div>
                <dt className="text-slate-500">{t("steward_register_motivation")}</dt>
                <dd className="text-slate-100">{motivation.trim()}</dd>
              </div>
            ) : null}
            {step === 3 && walletValid && selected.length > 0 ? (
              <div data-tt-steward-stake-status="1">
                <dt className="text-slate-500">{t("steward_register_chain_stake_per_jurisdiction")}</dt>
                <dd className="mt-1 space-y-1">
                  {chainStakeChecking ? (
                    <span className="text-slate-400" aria-busy="true">
                      {t("stewardRegister_chainStakeChecking")}
                    </span>
                  ) : (
                    <ul className="space-y-1" data-tt-steward-stake-by-jurisdiction="1">
                      {selected.map((id) => {
                        const st = chainStakeByJurisdiction[id];
                        let label = t("stewardRegister_chainStakeStatusUnknown");
                        if (st === true) label = t("steward_register_chain_stake_confirmed_short");
                        else if (st === false) label = t("steward_register_chain_stake_pending_short");
                        else if (st === "error") label = t("stewardRegister_chainStakeStatusError");
                        return (
                          <li key={id} className="flex justify-between gap-2 text-ref-sun/90">
                            <span className="font-mono text-xs text-slate-300">{id}</span>
                            <span>{label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {selected.length > 1 && !chainStakeChecking ? (
                    <p className="mt-2 text-meta text-slate-400">{t("stewardRegister_chainStakeMultiHint")}</p>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>
          <button type="button" className={guideRegSecondaryBtn} onClick={() => goToStep(2)}>
            {t("stewardRegister_back")}
          </button>
        </div>
      ) : null}

      {submitBlocked && !submitting ? (
        <p
          id={step1Blocked ? "steward-cta-blocked-hint" : "steward-step2-blocked-hint"}
          className={TT_STEWARD_REGISTER_L5.ctaBlockedHint}
          role="status"
        >
          {step1Blocked
            ? t("stewardRegister_ctaBlockedStep1")
            : step2BlockReason === "legal_name"
              ? t("stewardRegister_ctaBlockedStep2LegalName")
              : step2BlockReason === "contact_email"
                ? t("stewardRegister_ctaBlockedStep2Email")
                : step2BlockReason === "wallet"
                  ? t("stewardRegister_ctaBlockedStep2Wallet")
                  : step2BlockReason === "wallet_verify"
                    ? t("stewardRegister_ctaBlockedStep2WalletVerify")
                    : t("stewardRegister_ctaBlockedStep2")}
        </p>
      ) : null}

      <button
        type="submit"
        className={`${submitBlocked && !submitting ? "mt-2" : "mt-6"} w-full ${guideRegFocusRing} ${
          submitMuted ? TT_STEWARD_REGISTER_L5.primaryCtaMuted : guideRegPrimaryCta
        } ${submitting ? "disabled:cursor-not-allowed disabled:opacity-50" : ""}`}
        disabled={submitting || submitBlocked}
        aria-disabled={submitBlocked ? true : undefined}
        aria-describedby={
          step1Blocked ? "steward-jurisdiction-empty-hint steward-cta-blocked-hint" : step2Blocked ? "steward-step2-blocked-hint" : undefined
        }
      >
        {submitting ? (
          <>
            <span className={TT_AUTH_L5_FORM.primaryCtaSpinner} aria-hidden />
            {submitLabel}
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
