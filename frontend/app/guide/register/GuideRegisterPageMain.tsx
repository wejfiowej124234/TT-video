"use client";

import Link from "next/link";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import GuideRegisterContextBanners from "./GuideRegisterContextBanners";
import GuideRegisterDonePanel from "./GuideRegisterDonePanel";
import GuideRegisterAlreadyGuidePanel from "./GuideRegisterAlreadyGuidePanel";
import GuideRegisterPendingPanel from "./GuideRegisterPendingPanel";
import GuideRegisterRejectedGate from "./GuideRegisterRejectedGate";
import GuideRegisterSuspendedPanel from "./GuideRegisterSuspendedPanel";
import GuideRegisterLoginGate from "./GuideRegisterLoginGate";
import GuideRegisterMainForm from "./GuideRegisterMainForm";
import { useGuideRegisterPage } from "./useGuideRegisterPage";
import { guideRegisterL5MainDataAttrs, TT_GUIDE_REGISTER_L5 } from "@/lib/guide/guideRegisterL5";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { guideRegLink, guideRegFocusRing } from "./guideRegisterUiClasses";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export function GuideRegisterPageMain() {
  const {
    t,
    step,
    goToStep,
    fieldError,
    fieldInlineError,
    kycBlocksSubmit,
    walletVerify,
    uploadPhase,
    guideRegisterLoginReturnUrl,
    guideRegisterBackHref,
    realName,
    setRealName,
    idNumber,
    setIdNumber,
    walletAddress,
    setWalletAddress,
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
    pendingLangCert,
    idPhotoFile,
    setIdPhotoFile,
    languageCertFile,
    setLanguageCertFile,
    guideLicenseUrl,
    setGuideLicenseUrl,
    agreePrivacy,
    setAgreePrivacy,
    loading,
    error,
    setError,
    done,
    isAlreadyGuide,
    isPendingGuide,
    guideSuspended,
    showRejectedGate,
    rejectionCodes,
    rejectionMessage,
    unlockReapply,
    isLoggedIn,
    meCheckReady,
    copied,
    copyWalletBusy,
    sessionDraftRestored,
    isConnected,
    connectedAddress,
    walletMatchConnected,
    successFocusRef,
    guideRegisterWalletInputId,
    guideRegisterWalletErrorId,
    guideLicenseHintId,
    guideRegisterFormErrorId,
    clearSubmitError,
    handleSubmit,
    handleUseConnectedWallet,
  } = useGuideRegisterPage();

  if (!meCheckReady && isLoggedIn === true) {
    return (
      <main
        className={TT_GUIDE_REGISTER_L5.pageShell}
        aria-busy="true"
        aria-label={t("guideRegister_title")}
        {...guideRegisterL5MainDataAttrs()}
      >
        <AuthL5PageBackdrop />
        <div className={TT_GUIDE_REGISTER_L5.pageColumn} aria-hidden>
          <div className={`${TT_AUTH_L5_FORM.loadingSkeletonCard} w-full max-w-lg p-7`}>
            <div className={`h-9 w-48 ${TT_AUTH_L5_FORM.loadingPulse}`} />
          </div>
        </div>
      </main>
    );
  }

  if (done) {
    return <GuideRegisterDonePanel successFocusRef={successFocusRef} t={t} />;
  }
  if (isAlreadyGuide && isLoggedIn === true) {
    return <GuideRegisterAlreadyGuidePanel successFocusRef={successFocusRef} t={t} />;
  }
  if (isPendingGuide && isLoggedIn === true) {
    return <GuideRegisterPendingPanel successFocusRef={successFocusRef} t={t} />;
  }
  if (guideSuspended && isLoggedIn === true) {
    return <GuideRegisterSuspendedPanel successFocusRef={successFocusRef} t={t} />;
  }
  if (showRejectedGate && isLoggedIn === true) {
    return (
      <GuideRegisterRejectedGate
        successFocusRef={successFocusRef}
        t={t}
        rejectionCodes={rejectionCodes}
        rejectionMessage={rejectionMessage}
        onReapply={unlockReapply}
      />
    );
  }

  const loginHref = `/auth/login?returnUrl=${encodeURIComponent(guideRegisterLoginReturnUrl)}`;
  const showLoginGate = isLoggedIn === false;

  return (
    <main
      className={TT_GUIDE_REGISTER_L5.pageShell}
      aria-label={t("guideRegister_title")}
      {...guideRegisterL5MainDataAttrs()}
    >
      <AuthL5PageBackdrop />
      <div className={TT_GUIDE_REGISTER_L5.pageColumn}>
        <AuthL5Card maxWidth="wide" surface="guide_register">
          <Link
            href={guideRegisterBackHref}
            className={TT_AUTH_L5_FORM.backButton}
            data-tt-guide-register-back="1"
          >
            {t("auth_register_back")}
          </Link>
          <header className={TT_GUIDE_REGISTER_L5.headerBlock}>
            <p className={TT_GUIDE_REGISTER_L5.eyebrow}>{t("guideRegister_eyebrow")}</p>
            <h1 className={TT_GUIDE_REGISTER_L5.title}>{t("guideRegister_title")}</h1>
          </header>
          {showLoginGate ? <GuideRegisterLoginGate t={t} loginHref={loginHref} /> : null}
          {!showLoginGate ? (
            <GuideRegisterContextBanners
              t={t}
              pendingIdPhoto={pendingIdPhoto}
              pendingLangCert={pendingLangCert}
              sessionDraftRestored={sessionDraftRestored}
            />
          ) : null}
          <GuideRegisterMainForm
            t={t}
            step={step}
            goToStep={goToStep}
            fieldError={fieldError}
            fieldInlineError={fieldInlineError}
            kycBlocksSubmit={kycBlocksSubmit}
            walletVerified={walletVerify.walletVerified}
            walletVerifying={walletVerify.verifying}
            walletVerifyError={walletVerify.error}
            onWalletVerify={() => void walletVerify.runVerify()}
            onUseConnectedWallet={handleUseConnectedWallet}
            uploadPhase={uploadPhase}
            guideRegisterWalletInputId={guideRegisterWalletInputId}
            guideRegisterWalletErrorId={guideRegisterWalletErrorId}
            guideLicenseHintId={guideLicenseHintId}
            guideRegisterFormErrorId={guideRegisterFormErrorId}
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            realName={realName}
            setRealName={setRealName}
            idNumber={idNumber}
            setIdNumber={setIdNumber}
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
            pendingIdPhoto={pendingIdPhoto}
            idPhotoFile={idPhotoFile}
            setIdPhotoFile={setIdPhotoFile}
            pendingLangCert={pendingLangCert}
            languageCertFile={languageCertFile}
            setLanguageCertFile={setLanguageCertFile}
            guideLicenseUrl={guideLicenseUrl}
            setGuideLicenseUrl={setGuideLicenseUrl}
            agreePrivacy={agreePrivacy}
            setAgreePrivacy={setAgreePrivacy}
            loading={loading}
            error={error}
            setError={setError}
            isLoggedIn={isLoggedIn}
            isConnected={isConnected}
            connectedAddress={connectedAddress}
            walletMatchConnected={walletMatchConnected}
            copied={copied}
            copyWalletBusy={copyWalletBusy}
            clearSubmitError={clearSubmitError}
            onSubmit={handleSubmit}
          />
        </AuthL5Card>
        <nav className={TT_GUIDE_REGISTER_L5.footerLinks} aria-label={t("guide_register_relatedNav_aria")}>
          <Link href="/me/identities" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>
            {t("header_multiIdentity")}
          </Link>
          <Link href="/guides" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>
            {t("guideRegister_guideList")}
          </Link>
          <Link href="/me/settings/profile" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>
            {t("guideRegister_me")}
          </Link>
        </nav>
        <AuthL5CrossNavFooter />
      </div>
    </main>
  );
}
