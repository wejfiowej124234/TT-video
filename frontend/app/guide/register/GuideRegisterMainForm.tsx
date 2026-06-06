"use client";



import { useId, type FormEvent } from "react";

import ApiErrorAlert from "@/components/ApiErrorAlert";

import type { GuideRegisterFieldKey, GuideRegisterStep } from "@/lib/guide/guideRegisterValidation";

import type { GuideRegisterUploadPhase } from "./useGuideRegisterPage";

import { GuideRegisterDidIdentityCard } from "./GuideRegisterDidIdentityCard";

import GuideRegisterServiceFields from "./GuideRegisterServiceFields";

import GuideRegisterConfirmSection from "./GuideRegisterConfirmSection";

import {

  guideRegFocusRing,

  guideRegPrimaryCta,

  guideRegSecondaryBtn,

} from "./guideRegisterUiClasses";

import { TT_GUIDE_REGISTER_L5 } from "@/lib/guide/guideRegisterL5";



export type GuideRegisterMainFormProps = {

  t: (key: string) => string;

  step: GuideRegisterStep;

  goToStep: (s: GuideRegisterStep) => void;

  guideRegisterWalletInputId: string;

  guideRegisterWalletErrorId: string;

  guideLicenseHintId: string;

  guideRegisterFormErrorId: string;

  fieldError: GuideRegisterFieldKey | null;

  fieldInlineError: (field: GuideRegisterFieldKey) => string | null;

  kycBlocksSubmit: boolean;

  walletVerified: boolean;

  walletVerifying: boolean;

  walletVerifyError: string | null;

  onWalletVerify: () => void;

  onUseConnectedWallet: () => void;

  walletAddress: string;

  setWalletAddress: (v: string) => void;

  realName: string;

  setRealName: (v: string) => void;

  idNumber: string;

  setIdNumber: (v: string) => void;

  city: string;

  setCity: (v: string) => void;

  countryCode: string;

  setCountryCode: (v: string) => void;

  languages: string;

  setLanguages: (v: string) => void;

  serviceTypes: string;

  setServiceTypes: (v: string) => void;

  bio: string;

  setBio: (v: string) => void;

  pendingIdPhoto: string | null;

  idPhotoFile: File | null;

  setIdPhotoFile: (f: File | null) => void;

  pendingLangCert: string | null;

  languageCertFile: File | null;

  setLanguageCertFile: (f: File | null) => void;

  guideLicenseUrl: string;

  setGuideLicenseUrl: (v: string) => void;

  agreePrivacy: boolean;

  setAgreePrivacy: (v: boolean) => void;

  loading: boolean;

  uploadPhase: GuideRegisterUploadPhase;

  error: string | null;

  setError: (v: string | null) => void;

  isLoggedIn: boolean | null;

  isConnected: boolean;

  connectedAddress: string | undefined;

  walletMatchConnected: boolean;

  copied: boolean;

  copyWalletBusy: boolean;

  clearSubmitError: () => void;

  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;

};



export default function GuideRegisterMainForm(p: GuideRegisterMainFormProps) {

  const agreeId = useId();

  const {

    t,

    step,

    goToStep,

    guideRegisterWalletInputId,

    guideRegisterWalletErrorId,

    guideLicenseHintId,

    guideRegisterFormErrorId,

    fieldError,

    fieldInlineError,

    kycBlocksSubmit,

    walletVerified,

    walletVerifying,

    walletVerifyError,

    onWalletVerify,

    onUseConnectedWallet,

    walletAddress,

    setWalletAddress,

    realName,

    setRealName,

    idNumber,

    setIdNumber,

    city,

    setCity,

    countryCode,

    setCountryCode,

    languages,

    setLanguages,

    serviceTypes,

    setServiceTypes,

    bio,

    setBio,

    pendingIdPhoto,

    idPhotoFile,

    setIdPhotoFile,

    pendingLangCert,

    languageCertFile,

    setLanguageCertFile,

    guideLicenseUrl,

    setGuideLicenseUrl,

    agreePrivacy,

    setAgreePrivacy,

    loading,

    uploadPhase,

    error,

    setError,

    isLoggedIn,

    isConnected,

    connectedAddress,

    walletMatchConnected,

    copied,

    copyWalletBusy,

    clearSubmitError,

    onSubmit,

  } = p;



  const step1Incomplete = step === 1 && (!walletVerified || kycBlocksSubmit);
  const stepNextDisabled =
    loading ||
    isLoggedIn !== true ||
    (step === 1 && (!walletVerified || kycBlocksSubmit));

  const submitDisabled =
    loading ||
    isLoggedIn === false ||
    !agreePrivacy ||
    !walletAddress.trim() ||
    !walletVerified ||
    kycBlocksSubmit ||
    step !== 3;



  const submitLabel =

    uploadPhase === "uploading"

      ? t("guideRegister_uploading")

      : uploadPhase === "submitting"

        ? t("guideRegister_submitting")

        : t("guideRegister_submit");



  return (

    <form onSubmit={onSubmit} className={TT_GUIDE_REGISTER_L5.formSection} data-tt-guide-register-form="1">

      <nav className="flex flex-wrap items-center gap-2 text-meta" aria-label={t("guideRegister_stepNavAria")}>

        {([1, 2, 3] as const).map((n) => {

          const canJump = n < step;

          const cls =

            step === n

              ? "rounded-full border border-ref-sun/45 bg-ref-sun/15 px-2.5 py-0.5 text-ref-sun"

              : canJump

                ? "rounded-full border border-ref-sun/28 px-2.5 py-0.5 text-ref-sun/80 hover:bg-ref-sun/10"

                : "rounded-full border border-ref-sun/18 px-2.5 py-0.5 text-slate-400";

          if (canJump) {

            return (

              <button

                key={n}

                type="button"

                className={`${cls} ${guideRegFocusRing}`}

                onClick={() => goToStep(n)}

              >

                {t(`guideRegister_step${n}Badge` as "guideRegister_step1Badge")}

              </button>

            );

          }

          return (

            <span key={n} className={cls} aria-current={step === n ? "step" : undefined}>

              {t(`guideRegister_step${n}Badge` as "guideRegister_step1Badge")}

            </span>

          );

        })}

      </nav>



      {step === 1 ? (

        <GuideRegisterDidIdentityCard

          t={t}

          fieldError={fieldError}

          fieldInlineError={fieldInlineError}

          guideRegisterWalletInputId={guideRegisterWalletInputId}

          guideRegisterWalletErrorId={guideRegisterWalletErrorId}

          guideLicenseHintId={guideLicenseHintId}

          walletAddress={walletAddress}

          setWalletAddress={setWalletAddress}

          realName={realName}

          setRealName={setRealName}

          idNumber={idNumber}

          setIdNumber={setIdNumber}

          pendingIdPhoto={pendingIdPhoto}

          idPhotoFile={idPhotoFile}

          setIdPhotoFile={setIdPhotoFile}

          pendingLangCert={pendingLangCert}

          languageCertFile={languageCertFile}

          setLanguageCertFile={setLanguageCertFile}

          guideLicenseUrl={guideLicenseUrl}

          setGuideLicenseUrl={setGuideLicenseUrl}

          clearSubmitError={clearSubmitError}

          isConnected={isConnected}

          connectedAddress={connectedAddress}

          walletMatchConnected={walletMatchConnected}

          copied={copied}

          copyWalletBusy={copyWalletBusy}

          walletVerified={walletVerified}

          walletVerifying={walletVerifying}

          walletVerifyError={walletVerifyError}

          onWalletVerify={onWalletVerify}

          onUseConnectedWallet={onUseConnectedWallet}

        />

      ) : null}



      {step === 2 ? (

        <GuideRegisterServiceFields

          t={t}

          fieldError={fieldError}

          fieldInlineError={fieldInlineError}

          city={city}

          setCity={setCity}

          countryCode={countryCode}

          setCountryCode={setCountryCode}

          languages={languages}

          setLanguages={setLanguages}

          serviceTypes={serviceTypes}

          setServiceTypes={setServiceTypes}

          bio={bio}

          setBio={setBio}

          clearSubmitError={clearSubmitError}

        />

      ) : null}



      {step === 3 ? (

        <GuideRegisterConfirmSection

          t={t}

          agreeId={agreeId}

          fieldError={fieldError}

          walletAddress={walletAddress}

          realName={realName}

          idNumber={idNumber}

          city={city}

          countryCode={countryCode}

          languages={languages}

          serviceTypes={serviceTypes}

          bio={bio}

          idPhotoFile={idPhotoFile}

          pendingIdPhoto={pendingIdPhoto}

          languageCertFile={languageCertFile}

          pendingLangCert={pendingLangCert}

          agreePrivacy={agreePrivacy}

          setAgreePrivacy={setAgreePrivacy}

          loading={loading}

        />

      ) : null}



      {error && fieldError === "login" ? (

        <p className="text-meta text-ref-coral/95" role="alert">

          {error}

        </p>

      ) : null}



      {error && fieldError !== "login" ? (

        <div id={guideRegisterFormErrorId} className="space-y-2" role="alert" aria-live="polite">

          <ApiErrorAlert message={error} tone="dark" />

          <button

            type="button"

            onClick={() => setError(null)}

            className={`${guideRegSecondaryBtn} text-meta ${guideRegFocusRing}`}

          >

            {t("common_closeAlert")}

          </button>

        </div>

      ) : null}



      <div className="flex flex-wrap gap-3 pt-2">

        {step > 1 ? (

          <button

            type="button"

            onClick={() => goToStep((step - 1) as GuideRegisterStep)}

            className={`${guideRegSecondaryBtn} min-h-[44px] px-5 ${guideRegFocusRing}`}

          >

            {t("guideRegister_stepBack")}

          </button>

        ) : null}

        {step < 3 ? (

          <button

            type="button"

            disabled={stepNextDisabled}

            onClick={() => goToStep((step + 1) as GuideRegisterStep)}

            className={`${guideRegPrimaryCta} min-h-[44px] px-5 disabled:cursor-not-allowed disabled:opacity-50 ${guideRegFocusRing}`}

            aria-disabled={stepNextDisabled || undefined}

            title={step1Incomplete ? t("guideRegister_stepNextBlockedHint") : undefined}

          >

            {t("guideRegister_stepNext")}

          </button>

        ) : (

          <button

            type="submit"

            disabled={submitDisabled}

            className={`${guideRegPrimaryCta} min-h-[44px] px-5 ${guideRegFocusRing}`}

            aria-busy={loading ? true : undefined}

            aria-describedby={error ? guideRegisterFormErrorId : undefined}

            data-tt-guide-register-submit="1"

          >

            {loading ? (

              <>

                <span

                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1a120c]/25 border-t-[#1a120c]"

                  aria-hidden

                />

                {submitLabel}

              </>

            ) : (

              t("guideRegister_submit")

            )}

          </button>

        )}

      </div>

    </form>

  );

}


