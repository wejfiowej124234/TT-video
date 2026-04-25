"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useId, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { postGuide, postGuideUploadDoc, getAuthHeaders } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import { useTranslation } from "@/components/LocaleProvider";
import { PENDING_GUIDE_KEY } from "@/lib/constants";
import { COUNTRY_OPTIONS, MAX_FILE_SIZE, ACCEPT_ID, ACCEPT_LANG } from "./constants";
import { isValidWalletAddress, walletToDidEthr, fileToBase64 } from "./utils";
import type { PendingGuide } from "./types";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";
import { GuideRegisterRouteSuspense } from "@/components/guide/GuideRegisterRouteSuspense";

const guideRegConsoleFocus = `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

function GuideRegisterPageInner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const guideRegisterLoginReturnUrl = useMemo(
    () => buildLoginReturnPathWithQuery(pathname, searchParams?.toString() ?? "", "/guide/register"),
    [pathname, searchParams],
  );
  const [realName, setRealName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [languages, setLanguages] = useState("");
  const [serviceTypes, setServiceTypes] = useState("");
  const [bio, setBio] = useState("");
  const [pendingIdPhoto, setPendingIdPhoto] = useState<string | null>(null);
  const [pendingLangCert, setPendingLangCert] = useState<string | null>(null);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [languageCertFile, setLanguageCertFile] = useState<File | null>(null);
  const [guideLicenseUrl, setGuideLicenseUrl] = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isAlreadyGuide, setIsAlreadyGuide] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyWalletBusy, setCopyWalletBusy] = useState(false);
  const [sessionDraftRestored, setSessionDraftRestored] = useState(false);
  const { address: connectedAddress, isConnected } = useAccount();
  const successFocusRef = useRef<HTMLDivElement>(null);

  const handleUseConnectedWallet = useCallback(() => {
    if (connectedAddress) setWalletAddress(connectedAddress);
  }, [connectedAddress]);

  const clearSubmitError = useCallback(() => setError(null), []);

  const handleCopyWallet = useCallback(async () => {
    if (!walletAddress.trim() || !isValidWalletAddress(walletAddress)) return;
    setCopyWalletBusy(true);
    try {
      await navigator.clipboard.writeText(walletAddress.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("GuideRegisterPage copy wallet:", err);
      }
    } finally {
      setCopyWalletBusy(false);
    }
  }, [walletAddress]);

  const walletMatchConnected =
    connectedAddress &&
    walletAddress.trim() &&
    walletAddress.trim().toLowerCase() === connectedAddress.toLowerCase();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasUser = !!getAuthHeaders()["X-User-Id"] || !!localStorage.getItem("traveltrust_user_id");
    setIsLoggedIn(hasUser);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(PENDING_GUIDE_KEY);
      if (!raw) return;
      setSessionDraftRestored(true);
      const data = JSON.parse(raw) as PendingGuide;
      if (data.realName) setRealName(data.realName);
      if (data.idNumber) setIdNumber(data.idNumber);
      if (data.walletAddress) setWalletAddress(data.walletAddress);
      if (data.city) setCity(data.city);
      if (data.countryCode) setCountryCode(data.countryCode);
      if (data.languages) setLanguages(data.languages);
      if (data.serviceTypes) setServiceTypes(data.serviceTypes);
      setBio(data.bio ?? "");
      if (data.idPhotoName) setPendingIdPhoto(data.idPhotoName);
      if (data.languageCertName) setPendingLangCert(data.languageCertName);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (done || isAlreadyGuide) {
      const t = setTimeout(() => successFocusRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [done, isAlreadyGuide]);

  const guideRegisterWalletInputId = useId();
  const guideRegisterWalletErrorId = useId();
  const guideLicenseHintId = useId();
  const guideRegisterFormErrorId = useId();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const intent = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("data-guide-reg-intent");
    if (intent === "use_wallet") {
      handleUseConnectedWallet();
      return;
    }
    if (intent === "copy_wallet") {
      void handleCopyWallet();
      return;
    }
    setError(null);
    if (walletAddress.trim() && !isValidWalletAddress(walletAddress)) {
      setError(t("guideRegister_errorWallet"));
      return;
    }
    if (!agreePrivacy) {
      setError(t("guideRegister_errorAgree"));
      return;
    }
    if (!idPhotoFile && !pendingIdPhoto) {
      setError(t("guideRegister_passportPhotoRequired"));
      return;
    }
    setLoading(true);
    try {
      let idPhotoUrl: string | undefined;
      let languageCertUrl: string | undefined;
      if (typeof window !== "undefined") {
        const raw = window.sessionStorage.getItem(PENDING_GUIDE_KEY);
        if (raw) {
          let data: PendingGuide;
          try {
            data = JSON.parse(raw) as PendingGuide;
          } catch {
            data = {} as PendingGuide;
          }
          if (data.idPhotoBase64) {
            try {
              const up = await postGuideUploadDoc({
                content_base64: data.idPhotoBase64,
                filename: data.idPhotoName,
              });
              if (up.url) {
                idPhotoUrl = up.url;
              } else {
                setError(t("guideRegister_pendingIdPhotoUploadFailed"));
                return;
              }
            } catch (err) {
              if (typeof window !== "undefined") {
                console.error("GuideRegister pending id photo upload:", err);
              }
              setError(mapApiReadError(err, t, "guideRegister_pendingIdPhotoUploadFailed"));
              return;
            }
          }
          if (data.languageCertBase64) {
            try {
              const up = await postGuideUploadDoc({
                content_base64: data.languageCertBase64,
                filename: data.languageCertName,
              });
              if (up.url) {
                languageCertUrl = up.url;
              } else {
                setError(t("guideRegister_pendingLangCertUploadFailed"));
                return;
              }
            } catch (err) {
              if (typeof window !== "undefined") {
                console.error("GuideRegister pending lang cert upload:", err);
              }
              setError(mapApiReadError(err, t, "guideRegister_pendingLangCertUploadFailed"));
              return;
            }
          }
        }
      }
      if (idPhotoFile) {
        const base64 = await fileToBase64(idPhotoFile, MAX_FILE_SIZE, t("guideRegister_fileTooBig"));
        const up = await postGuideUploadDoc({ content_base64: base64, filename: idPhotoFile.name });
        if (up.url) {
          idPhotoUrl = up.url;
        } else {
          setError(t("guideRegister_pendingIdPhotoUploadFailed"));
          return;
        }
      }
      if (languageCertFile) {
        const base64 = await fileToBase64(languageCertFile, MAX_FILE_SIZE, t("guideRegister_fileTooBig"));
        const up = await postGuideUploadDoc({ content_base64: base64, filename: languageCertFile.name });
        if (up.url) {
          languageCertUrl = up.url;
        } else {
          setError(t("guideRegister_pendingLangCertUploadFailed"));
          return;
        }
      }
      const needsPassportUrl = Boolean(idPhotoFile || pendingIdPhoto);
      if (needsPassportUrl && !idPhotoUrl) {
        setError(t("guideRegister_pendingPassportDataIncomplete"));
        return;
      }
      const idemKey = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
      await postGuide(
        {
          city: city.trim(),
          country_code: countryCode.trim() || undefined,
          languages: languages.trim() ? languages.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : undefined,
          service_types: serviceTypes.trim() ? serviceTypes.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : undefined,
          bio: bio.trim() || undefined,
          wallet_address: walletAddress.trim() || undefined,
          real_name: realName.trim() || undefined,
          passport_number: idNumber.trim() || undefined,
          id_photo_url: idPhotoUrl,
          language_cert_url: languageCertUrl,
          guide_license_url: guideLicenseUrl.trim() || undefined,
        },
        idemKey
      );
      if (typeof window !== "undefined") window.sessionStorage.removeItem(PENDING_GUIDE_KEY);
      setError(null);
      setDone(true);
      setRealName("");
      setIdNumber("");
      setPendingIdPhoto(null);
      setPendingLangCert(null);
      setIdPhotoFile(null);
      setLanguageCertFile(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("guideRegister_errorSubmit");
      if (msg === "already_guide") {
        setIsAlreadyGuide(true);
        setError(null);
      } else if (msg === "invalid_wallet_address") setError(t("guideRegister_errorWallet"));
      else if (msg === "id_photo_required") setError(t("guideRegister_passportPhotoRequired"));
      else if (msg === "guide_license_url_invalid") setError(t("guideRegister_licenseUrlInvalid"));
      else if (msg === "city_required") setError(t("guideRegister_errorCity"));
      else if (msg === "city_too_long") setError(t("guideRegister_errorCityTooLong"));
      else if (msg === "file_too_large") setError(t("guideRegister_fileTooBig"));
      else if (msg === "invalid_file_type") setError(t("guideRegister_errorFileType"));
      else if (msg === "guide_db_persist_failed") setError(t("guideRegister_guideDbUnavailable"));
      else {
        if (typeof window !== "undefined") {
          console.error("GuideRegister:", err);
        }
        setError(mapApiReadError(err, t, "guideRegister_errorSubmit"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-bg-main flex flex-col" aria-label={t("guideRegister_doneMessage")}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6 space-y-4" role="status" aria-live="polite">
            <div ref={successFocusRef} tabIndex={-1} className="outline-none" aria-hidden="true" />
            <p className="text-success font-medium">{t("guideRegister_doneMessage")}</p>
            <p className="mt-4">
              <Link href="/guides" className={`${touchTargetLink44Classes} text-travel-500 text-small hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>{t("guideRegister_doneGuideList")}</Link>
              {" · "}
              <Link href="/community/me" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>{t("guideRegister_doneMe")}</Link>
            </p>
          </div>
        </div>
        <TrustInfraWall />
      </main>
    );
  }
  if (isAlreadyGuide) {
    return (
      <main className="min-h-screen bg-bg-main flex flex-col" aria-label={t("guideRegister_alreadyGuideTitle")}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6 space-y-4" role="status" aria-live="polite">
            <div ref={successFocusRef} tabIndex={-1} className="outline-none" aria-hidden="true" />
            <p className="text-body text-ink-800 font-medium">{t("guideRegister_alreadyGuideTitle")}</p>
            <p className="text-small text-ink-600">{t("guideRegister_alreadyGuideDesc")}</p>
            <p className="mt-4">
              <Link href="/guides" className={`${touchTargetLink44Classes} text-travel-500 text-small hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>{t("guideRegister_guideList")}</Link>
              {" · "}
              <Link href="/community/me" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>{t("guideRegister_me")}</Link>
            </p>
          </div>
        </div>
        <TrustInfraWall />
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-bg-main" aria-label={t("guideRegister_title")}>
      <section className="mx-auto max-w-md px-6 py-12">
        <h1 className="text-h4 font-semibold text-ink-900 mb-2">{t("guideRegister_title")}</h1>
        <p className="text-meta text-ink-600 mb-4">
          {pendingIdPhoto || pendingLangCert ? t("guideRegister_introFromRegister") : t("guideRegister_introDirect")}
        </p>
        {sessionDraftRestored ? (
          <p
            className="text-meta text-white mb-4 rounded-[var(--radius-sm)] border border-warning/60 bg-warning px-3 py-2"
            role="note"
          >
            {t("guideRegister_draftLocalOnly")}
          </p>
        ) : null}
        <div className="mb-4 rounded-[var(--radius-sm)] border border-travel-500/30 bg-travel-500/5 p-3">
          <p className="text-small font-medium text-ink-800">{t("guideRegister_didAboutTitle")}</p>
          <p className="text-meta text-ink-600 mt-0.5">{t("guideRegister_didAboutDesc")}</p>
        </div>
        {isLoggedIn === false && (
          <p className="text-small text-ink-600 mb-4 rounded-[var(--radius-sm)] bg-ink-100 px-3 py-2 text-ink-800 border border-ink-200">
            {t("guideRegister_loginRequiredBefore")}
            <Link
              href={`/auth/login?returnUrl=${encodeURIComponent(guideRegisterLoginReturnUrl)}`}
              className={`${touchTargetLink44Classes} font-medium underline ${travelFocusRingOffset2Classes}`}
            >
              {t("header_login")}
            </Link>
            {t("guideRegister_loginRequiredAfter")}
          </p>
        )}
        {(pendingIdPhoto || pendingLangCert) && (
          <p className="text-small text-ink-600 mb-4 rounded-[var(--radius-sm)] bg-ink-100 px-3 py-2">
            {t("guideRegister_uploaded")}{pendingIdPhoto && <>{t("guideRegister_uploadedPassport")}「{pendingIdPhoto}」</>}{pendingIdPhoto && pendingLangCert && "；"}
            {pendingLangCert && <>{t("guideRegister_uploadedLangCert")}「{pendingLangCert}」</>}{t("guideRegister_willSubmit")}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/50 p-3">
            <h2 className="text-small font-semibold text-ink-800">{t("guideRegister_didInfo")}{realName || idNumber || walletAddress ? t("guideRegister_didInfoFromRegister") : ""}</h2>
            <div>
              <label className="block text-meta text-ink-500 mb-0.5" htmlFor={guideRegisterWalletInputId}>{t("guideRegister_walletLabel")}</label>
              <div className="flex gap-2">
                <input
                  id={guideRegisterWalletInputId}
                  type="text"
                  value={walletAddress}
                  onChange={(e) => {
                    setWalletAddress(e.target.value);
                    clearSubmitError();
                  }}
                  className={`flex-1 min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console font-mono ${guideRegConsoleFocus}`}
                  placeholder={t("guideRegister_placeholderWallet")}
                  aria-invalid={!!(walletAddress.trim() && !isValidWalletAddress(walletAddress))}
                  aria-describedby={walletAddress.trim() && !isValidWalletAddress(walletAddress) ? guideRegisterWalletErrorId : undefined}
                />
                {isConnected && connectedAddress && (
                  <button type="submit" formNoValidate data-guide-reg-intent="use_wallet" className={`btn-console shrink-0 rounded-[var(--radius-sm)] border border-travel-500 px-3 py-1.5 text-small text-travel-500 ${guideRegConsoleFocus}`}>{t("guideRegister_useCurrentWallet")}</button>
                )}
              </div>
              {walletAddress.trim() && !isValidWalletAddress(walletAddress) && <p id={guideRegisterWalletErrorId} className="mt-0.5 text-meta text-danger" role="alert">{t("guideRegister_walletFormatError")}</p>}
              {walletMatchConnected && <p className="mt-0.5 text-meta text-success">{t("guideRegister_walletMatch")}</p>}
              {walletAddress.trim() && isValidWalletAddress(walletAddress) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-meta text-ink-500">{t("guideRegister_didEquivalent")}</span>
                  <code className="text-meta font-mono text-ink-700 break-all rounded-[var(--radius-sm)] bg-bg-soft px-1.5 py-0.5">{walletToDidEthr(walletAddress)}</code>
                  <button
                    type="submit"
                    formNoValidate
                    data-guide-reg-intent="copy_wallet"
                    disabled={copyWalletBusy}
                    aria-busy={copyWalletBusy ? true : undefined}
                    className={`btn-console rounded-[var(--radius-sm)] border border-ink-300 px-2 py-0.5 text-meta text-ink-700 disabled:opacity-60 disabled:cursor-wait ${guideRegConsoleFocus}`}
                  >
                    {copied ? t("guideRegister_copied") : t("guideRegister_copyAddress")}
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-meta text-ink-500 mb-0.5">{t("guideRegister_realName")}</label>
              <input type="text" value={realName} onChange={(e) => { setRealName(e.target.value); clearSubmitError(); }} className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console ${guideRegConsoleFocus}`} placeholder={t("guideRegister_placeholderPassport")} />
            </div>
            <div>
              <label className="block text-meta text-ink-500 mb-0.5">{t("guideRegister_passportNumber")}</label>
              <input type="text" value={idNumber} onChange={(e) => { setIdNumber(e.target.value); clearSubmitError(); }} className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console ${guideRegConsoleFocus}`} placeholder={t("guideRegister_placeholderPassportNum")} />
            </div>
            <div>
              <label className="block text-meta text-ink-500 mb-0.5">{t("guideRegister_passportPhoto")} <span className="text-danger">*</span></label>
              <input type="file" accept={ACCEPT_ID} onChange={(e) => { setIdPhotoFile(e.target.files?.[0] ?? null); clearSubmitError(); }} required className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console file:mr-2 file:rounded file:border-0 file:bg-travel-500 file:px-2 file:py-1 file:text-small file:text-white ${guideRegConsoleFocus}`} aria-required="true" />
              <p className="mt-0.5 text-meta text-ink-500">{t("guideRegister_passportPhotoHint")}</p>
              {(pendingIdPhoto || idPhotoFile) && <p className="mt-0.5 text-meta text-ink-600">{t("guideRegister_selected")}{idPhotoFile?.name ?? pendingIdPhoto}</p>}
            </div>
            <div>
              <label className="block text-meta text-ink-500 mb-0.5">{t("guideRegister_languageCert")}</label>
              <input type="file" accept={ACCEPT_LANG} onChange={(e) => { setLanguageCertFile(e.target.files?.[0] ?? null); clearSubmitError(); }} className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console file:mr-2 file:rounded file:border-0 file:bg-travel-500 file:px-2 file:py-1 file:text-small file:text-white ${guideRegConsoleFocus}`} />
              {(pendingLangCert || languageCertFile) && <p className="mt-0.5 text-meta text-ink-600">{t("guideRegister_selected")}{languageCertFile?.name ?? pendingLangCert}</p>}
            </div>
            <div>
              <label className="block text-meta text-ink-500 mb-0.5">{t("guideRegister_licenseUrl")}</label>
              <input type="url" value={guideLicenseUrl} onChange={(e) => { setGuideLicenseUrl(e.target.value); clearSubmitError(); }} maxLength={2048} className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console ${guideRegConsoleFocus}`} placeholder={t("guideRegister_licenseUrlPlaceholder")} aria-describedby={guideLicenseHintId} />
              <p id={guideLicenseHintId} className="mt-0.5 text-meta text-ink-500">{t("guideRegister_licenseUrlHint")}</p>
            </div>
          </div>
          <div>
            <label className="block text-meta text-ink-500 mb-0.5">{t("guideRegister_city")}</label>
            <input type="text" value={city} onChange={(e) => { setCity(e.target.value); clearSubmitError(); }} required aria-label={t("guideRegister_placeholderCity")} className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console ${guideRegConsoleFocus}`} placeholder={t("guideRegister_placeholderCity")} />
          </div>
          <div>
            <label className="block text-meta text-ink-500 mb-0.5">{t("guideRegister_country")}</label>
            <select value={countryCode} onChange={(e) => { setCountryCode(e.target.value); clearSubmitError(); }} className={`inline-flex w-full min-h-[44px] items-center justify-start border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console ${guideRegConsoleFocus}`}>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.value || "empty"} value={c.value}>{t(c.labelKey)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-meta text-ink-500 mb-0.5">{t("guideRegister_languages")}</label>
            <input type="text" value={languages} onChange={(e) => { setLanguages(e.target.value); clearSubmitError(); }} className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console ${guideRegConsoleFocus}`} placeholder={t("guideRegister_placeholderLang")} />
          </div>
          <div>
            <label className="block text-meta text-ink-500 mb-0.5">{t("guideRegister_serviceTypes")}</label>
            <input type="text" value={serviceTypes} onChange={(e) => { setServiceTypes(e.target.value); clearSubmitError(); }} className={`w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console ${guideRegConsoleFocus}`} placeholder={t("guideRegister_placeholderService")} />
          </div>
          <div>
            <label className="block text-meta text-ink-500 mb-0.5">{t("guideRegister_bio")}</label>
            <textarea value={bio} onChange={(e) => { setBio(e.target.value); clearSubmitError(); }} rows={3} className={`w-full min-h-[80px] border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1.5 text-small bg-bg-console ${guideRegConsoleFocus}`} placeholder={t("guideRegister_placeholderBio")} />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={agreePrivacy} onChange={(e) => { setAgreePrivacy(e.target.checked); clearSubmitError(); }} className={`mt-1 rounded-[var(--radius-sm)] border-ink-300 text-travel-500 ${guideRegConsoleFocus}`} />
            <span className="text-small text-ink-700">
              {t("guideRegister_agreePrivacyBefore")}
              <Link href="/terms" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>{t("guideRegister_agreePrivacyTerms")}</Link>
              {t("guideRegister_agreePrivacyBetween")}
              <Link href="/privacy" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>{t("guideRegister_agreePrivacyPrivacy")}</Link>
              {t("guideRegister_agreePrivacyAfter")}
            </span>
          </label>
          {error ? (
            <div id={guideRegisterFormErrorId} className="space-y-2" role="alert" aria-live="polite">
              <ApiErrorAlert message={error} />
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  setError(null);
                }}
              >
                <button
                  type="submit"
                  className={`btn-console rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-meta text-ink-700 ${guideRegConsoleFocus}`}
                  aria-label={t("common_closeAlert")}
                >
                  {t("common_closeAlert")}
                </button>
              </form>
            </div>
          ) : null}
          <button type="submit" disabled={loading || isLoggedIn === false || !agreePrivacy} className={`btn-console rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small disabled:opacity-50 ${guideRegConsoleFocus}`} aria-busy={loading ? true : undefined} aria-describedby={error ? guideRegisterFormErrorId : undefined}>{loading ? t("guideRegister_submitting") : t("guideRegister_submit")}</button>
        </form>
        <p className="mt-4 text-meta text-ink-500">
          <Link href="/guides" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>{t("guideRegister_guideList")}</Link>
          {" · "}
          <Link href="/community/me" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>{t("guideRegister_me")}</Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="guide_register_relatedNav_aria"
          showGuides
        />
      </section>
      <TrustInfraWall />
    </main>
  );
}

export default function GuideRegisterPage() {
  return (
    <GuideRegisterRouteSuspense>
      <GuideRegisterPageInner />
    </GuideRegisterRouteSuspense>
  );
}
