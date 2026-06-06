"use client";



import type { GuideRegisterFieldKey } from "@/lib/guide/guideRegisterValidation";

import { ACCEPT_ID, ACCEPT_LANG } from "./constants";

import GuideRegisterFileField from "./GuideRegisterFileField";

import GuideRegisterStep1ProgressBar from "./GuideRegisterStep1ProgressBar";

import GuideRegisterWalletStepFlow from "./GuideRegisterWalletStepFlow";

import GuideRegisterInlineFieldError from "./GuideRegisterInlineFieldError";

import {

  guideRegFieldClass,

  guideRegFileMeta,

  guideRegLabel,

} from "./guideRegisterUiClasses";

import { TT_GUIDE_REGISTER_L5 } from "@/lib/guide/guideRegisterL5";



export type GuideRegisterDidIdentityCardProps = {

  t: (key: string) => string;

  fieldError: GuideRegisterFieldKey | null;

  fieldInlineError: (field: GuideRegisterFieldKey) => string | null;

  guideRegisterWalletInputId: string;

  guideRegisterWalletErrorId: string;

  guideLicenseHintId: string;

  walletAddress: string;

  setWalletAddress: (v: string) => void;

  realName: string;

  setRealName: (v: string) => void;

  idNumber: string;

  setIdNumber: (v: string) => void;

  pendingIdPhoto: string | null;

  idPhotoFile: File | null;

  setIdPhotoFile: (f: File | null) => void;

  pendingLangCert: string | null;

  languageCertFile: File | null;

  setLanguageCertFile: (f: File | null) => void;

  guideLicenseUrl: string;

  setGuideLicenseUrl: (v: string) => void;

  clearSubmitError: () => void;

  isConnected: boolean;

  connectedAddress: string | undefined;

  walletMatchConnected: boolean;

  copied: boolean;

  copyWalletBusy: boolean;

  walletVerified: boolean;

  walletVerifying: boolean;

  walletVerifyError: string | null;

  onWalletVerify: () => void;

  onUseConnectedWallet: () => void;

};



type P = GuideRegisterDidIdentityCardProps;



/** 向导注册：DID / 证件 / 执照 URL（Auth L5 字段族） */

export function GuideRegisterDidIdentityCard(p: P) {

  const {

    t,

    fieldError,

    fieldInlineError,

    guideRegisterWalletInputId,

    guideRegisterWalletErrorId,

    guideLicenseHintId,

    walletAddress,

    setWalletAddress,

    realName,

    setRealName,

    idNumber,

    setIdNumber,

    pendingIdPhoto,

    idPhotoFile,

    setIdPhotoFile,

    pendingLangCert,

    languageCertFile,

    setLanguageCertFile,

    guideLicenseUrl,

    setGuideLicenseUrl,

    clearSubmitError,

    isConnected,

    connectedAddress,

    walletMatchConnected,

    copied,

    copyWalletBusy,

    walletVerified,

    walletVerifying,

    walletVerifyError,

    onWalletVerify,

    onUseConnectedWallet,

  } = p;



  const step1Input = {

    walletAddress,

    realName,

    idNumber,

    idPhotoFile,

    pendingIdPhoto,

    walletVerified,

  };



  return (

    <section className={TT_GUIDE_REGISTER_L5.didSection} aria-labelledby="guide-reg-step1-title">

      <h2 id="guide-reg-step1-title" className={TT_GUIDE_REGISTER_L5.didSectionTitle}>

        {t("guideRegister_step1Title")}

        {realName || idNumber || walletAddress ? t("guideRegister_didInfoFromRegister") : ""}

      </h2>

      <p className="text-meta text-slate-300/95">{t("guideRegister_step1Lead")}</p>

      <GuideRegisterStep1ProgressBar t={t} input={step1Input} />



      <GuideRegisterWalletStepFlow

        t={t}

        walletInputId={guideRegisterWalletInputId}

        walletErrorId={guideRegisterWalletErrorId}

        walletAddress={walletAddress}

        setWalletAddress={setWalletAddress}

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

        fieldInlineError={fieldInlineError("wallet")}

      />



      <div className="flex flex-col gap-2">

        <label className={guideRegLabel}>

          {t("guideRegister_realName")} <span className="text-ref-coral">*</span>

        </label>

        <input

          type="text"

          value={realName}

          onChange={(e) => {

            setRealName(e.target.value);

            clearSubmitError();

          }}

          className={guideRegFieldClass(fieldError === "realName")}

          placeholder={t("guideRegister_placeholderPassport")}

          aria-invalid={fieldError === "realName" || undefined}

        />

        <GuideRegisterInlineFieldError message={fieldInlineError("realName")} />

      </div>



      <div className="flex flex-col gap-2">

        <label className={guideRegLabel}>

          {t("guideRegister_passportNumber")} <span className="text-ref-coral">*</span>

        </label>

        <input

          type="text"

          value={idNumber}

          onChange={(e) => {

            setIdNumber(e.target.value);

            clearSubmitError();

          }}

          className={guideRegFieldClass(fieldError === "passportNumber")}

          placeholder={t("guideRegister_placeholderPassportNum")}

          aria-invalid={fieldError === "passportNumber" || undefined}

        />

        <GuideRegisterInlineFieldError message={fieldInlineError("passportNumber")} />

      </div>



      <GuideRegisterFileField

        id="guide-reg-passport-photo"

        label={t("guideRegister_passportPhoto")}

        hint={t("guideRegister_passportPhotoHint")}

        accept={ACCEPT_ID}

        required

        file={idPhotoFile}

        pendingName={pendingIdPhoto}

        onPick={(f) => {

          setIdPhotoFile(f);

          clearSubmitError();

        }}

        onClear={() => {

          setIdPhotoFile(null);

          clearSubmitError();

        }}

        invalid={fieldError === "passportPhoto"}

        inlineError={fieldInlineError("passportPhoto")}

        t={t}

      />



      <GuideRegisterFileField

        id="guide-reg-lang-cert"

        label={t("guideRegister_languageCert")}

        accept={ACCEPT_LANG}

        file={languageCertFile}

        pendingName={pendingLangCert}

        onPick={(f) => {

          setLanguageCertFile(f);

          clearSubmitError();

        }}

        onClear={() => {

          setLanguageCertFile(null);

          clearSubmitError();

        }}

        t={t}

      />



      <div className="flex flex-col gap-2">

        <label className={guideRegLabel}>{t("guideRegister_licenseUrl")}</label>

        <input

          type="url"

          value={guideLicenseUrl}

          onChange={(e) => {

            setGuideLicenseUrl(e.target.value);

            clearSubmitError();

          }}

          maxLength={2048}

          className={guideRegFieldClass(false)}

          placeholder={t("guideRegister_licenseUrlPlaceholder")}

          aria-describedby={guideLicenseHintId}

        />

        <p id={guideLicenseHintId} className={guideRegFileMeta}>

          {t("guideRegister_licenseUrlHint")}

        </p>

      </div>

    </section>

  );

}


