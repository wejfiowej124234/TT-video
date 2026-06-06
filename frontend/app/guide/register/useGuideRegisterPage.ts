// search-params gate: parent route provides Suspense boundary.
import { useState, useEffect, useCallback, useMemo, useRef, useId, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { getMe } from "@/lib/apiClient";
import { hasAccountSessionCredentials } from "@/lib/auth/accountSessionProbe";
import { useRegisterPageAccountSession } from "@/lib/auth/registerPageAccountSession";
import { useTranslation } from "@/components/LocaleProvider";
import { PENDING_GUIDE_KEY } from "@/lib/constants";
import { productCountryZhForCityName } from "@/lib/geoOptions";
import { countryZhToIso } from "@/lib/guide/guideRegisterGeo";
import {
  parseGuideRegisterStepParam,
  readGuideRegisterDraft,
  writeGuideRegisterDraft,
} from "@/lib/guide/guideRegisterDraft";
import { parseMeTrustFromMeResponse, userFromGetMePayload } from "@/lib/meTrust";
import {
  getGuideRegistrationServerDraft,
  putGuideRegistrationServerDraft,
} from "@/lib/guide/guideRegisterServerDraft";
import {
  isGuideAlreadyRegistered,
  isGuidePendingReview,
  isGuideRejected,
  isGuideSuspended,
  isKycBlockingGuideApply,
  validateGuideRegisterStep1,
  validateGuideRegisterStep2,
  type GuideRegisterFieldKey,
  type GuideRegisterStep,
  type GuideRegisterValidationFailure,
} from "@/lib/guide/guideRegisterValidation";
import { readGuideWalletVerifiedAddress } from "@/lib/constants/guideRegisterKeys";
import { useGuideRegisterWalletVerify } from "./useGuideRegisterWalletVerify";
import { isValidWalletAddress } from "./utils";
import type { PendingGuide } from "./types";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";
import { resolveRegisterBackPath } from "@/app/auth/register/registerPageModel";
import { runGuideRegisterSubmitFlow } from "./guideRegisterSubmitFlow";

export type GuideRegisterUploadPhase = "idle" | "uploading" | "submitting";

export function useGuideRegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const guideRegisterLoginReturnUrl = useMemo(
    () => buildLoginReturnPathWithQuery(pathname, searchParams?.toString() ?? "", "/guide/register"),
    [pathname, searchParams],
  );
  const guideRegisterBackHref = useMemo(
    () => resolveRegisterBackPath(searchParams.get("returnUrl"), "guide"),
    [searchParams],
  );
  const [step, setStepState] = useState<GuideRegisterStep>(() =>
    parseGuideRegisterStepParam(searchParams.get("step")),
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
  const [uploadPhase, setUploadPhase] = useState<GuideRegisterUploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<GuideRegisterFieldKey | null>(null);
  const [done, setDone] = useState(false);
  const [isAlreadyGuide, setIsAlreadyGuide] = useState(false);
  const [isPendingGuide, setIsPendingGuide] = useState(false);
  const [guideSuspended, setGuideSuspended] = useState(false);
  const [guideRejected, setGuideRejected] = useState(false);
  const [rejectionCodes, setRejectionCodes] = useState<string[]>([]);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const [reapplyUnlocked, setReapplyUnlocked] = useState(false);
  const isLoggedIn = useRegisterPageAccountSession();
  const [meCheckReady, setMeCheckReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyWalletBusy, setCopyWalletBusy] = useState(false);
  const [sessionDraftRestored, setSessionDraftRestored] = useState(false);
  const [kycStatus, setKycStatus] = useState("none");
  const requireKycVerified =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_GUIDE_REGISTER_REQUIRE_KYC === "1";
  const { address: connectedAddress, isConnected } = useAccount();
  const walletVerify = useGuideRegisterWalletVerify(t, walletAddress);
  const successFocusRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);
  const skipUrlSyncRef = useRef(false);

  const applyValidationFailure = useCallback((failure: GuideRegisterValidationFailure, targetStep: GuideRegisterStep) => {
    setFieldError(failure.field);
    setError(t(failure.messageKey));
    setStep(targetStep);
  }, [t]);

  const setStep = useCallback(
    (s: GuideRegisterStep) => {
      setStepState(s);
      skipUrlSyncRef.current = true;
      const qs = new URLSearchParams(searchParams.toString());
      if (s === 1) qs.delete("step");
      else qs.set("step", String(s));
      const q = qs.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleUseConnectedWallet = useCallback(() => {
    if (connectedAddress) setWalletAddress(connectedAddress);
  }, [connectedAddress]);

  const clearSubmitError = useCallback(() => {
    setError(null);
    setFieldError(null);
  }, []);

  const onValidateStep = useCallback(
    (s: GuideRegisterStep): GuideRegisterValidationFailure | null => {
      if (s === 1) {
        return validateGuideRegisterStep1({
          walletAddress,
          realName,
          idNumber,
          idPhotoFile,
          pendingIdPhoto,
          walletVerified: walletVerify.walletVerified,
        });
      }
      if (s === 2) {
        return validateGuideRegisterStep2({ city, countryCode, languages, serviceTypes });
      }
      return null;
    },
    [walletAddress, realName, idNumber, idPhotoFile, pendingIdPhoto, walletVerify.walletVerified, city, countryCode, languages, serviceTypes],
  );

  const fieldInlineError = useCallback(
    (field: GuideRegisterFieldKey) => (fieldError === field ? error : null),
    [fieldError, error],
  );

  const kycBlocksSubmit = isKycBlockingGuideApply(kycStatus, requireKycVerified);

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
    if (isLoggedIn !== true) {
      setIsPendingGuide(false);
      setIsAlreadyGuide(false);
      setGuideSuspended(false);
      setGuideRejected(false);
      if (isLoggedIn === false) setMeCheckReady(true);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }
    setStepState(parseGuideRegisterStepParam(searchParams.get("step")));
  }, [searchParams]);

  useEffect(() => {
    if (!isConnected || !connectedAddress) return;
    if (!walletAddress.trim()) setWalletAddress(connectedAddress);
  }, [isConnected, connectedAddress, walletAddress]);

  useEffect(() => {
    if (typeof window === "undefined" || isLoggedIn !== true) {
      if (isLoggedIn === false) setMeCheckReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getMe();
        if (cancelled) return;
        const user = userFromGetMePayload(data);
        const trust = parseMeTrustFromMeResponse(data, user);
        setKycStatus(trust.kyc_status ?? user?.kyc_status ?? "none");
        const status = trust.guide_registration_status;
        if (isGuideAlreadyRegistered(status)) setIsAlreadyGuide(true);
        else if (isGuideSuspended(status)) setGuideSuspended(true);
        else if (isGuidePendingReview(status)) setIsPendingGuide(true);
        else if (isGuideRejected(status)) {
          setGuideRejected(true);
          setRejectionCodes(trust.guide_registration_rejection_codes ?? []);
          setRejectionMessage(trust.guide_registration_rejection_message ?? null);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setMeCheckReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const v = readGuideWalletVerifiedAddress();
    if (v) walletVerify.setVerifiedAddress(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount hydrate only
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || hydratedRef.current) return;
    hydratedRef.current = true;
    let fromPending = false;
    try {
      const raw = window.sessionStorage.getItem(PENDING_GUIDE_KEY);
      if (raw) {
        fromPending = true;
        setSessionDraftRestored(true);
        const data = JSON.parse(raw) as PendingGuide;
        if (data.realName) setRealName(data.realName);
        if (data.idNumber) setIdNumber(data.idNumber);
        if (data.walletAddress) setWalletAddress(data.walletAddress);
        if (data.city) setCity(data.city);
        if (data.countryCode) setCountryCode(data.countryCode);
        else if (data.city) {
          const zh = productCountryZhForCityName(data.city);
          const iso = zh ? countryZhToIso(zh) : null;
          if (iso) setCountryCode(iso);
        }
        if (data.languages) setLanguages(data.languages);
        if (data.serviceTypes) setServiceTypes(data.serviceTypes);
        setBio(data.bio ?? "");
        if (data.idPhotoName) setPendingIdPhoto(data.idPhotoName);
        if (data.languageCertName) setPendingLangCert(data.languageCertName);
      }
    } catch {
      /* ignore */
    }
    const draft = readGuideRegisterDraft();
    if (draft) {
      setSessionDraftRestored(true);
      if (!fromPending) {
        if (draft.walletAddress) setWalletAddress(draft.walletAddress);
        if (draft.realName) setRealName(draft.realName);
        if (draft.idNumber) setIdNumber(draft.idNumber);
        if (draft.city) setCity(draft.city);
        if (draft.countryCode) setCountryCode(draft.countryCode);
        if (draft.languages) setLanguages(draft.languages);
        if (draft.serviceTypes) setServiceTypes(draft.serviceTypes);
        if (draft.bio) setBio(draft.bio);
        if (draft.guideLicenseUrl) setGuideLicenseUrl(draft.guideLicenseUrl);
        if (draft.pendingIdPhotoName) setPendingIdPhoto(draft.pendingIdPhotoName);
        if (draft.pendingLangCertName) setPendingLangCert(draft.pendingLangCertName);
      }
      if (draft.step) setStepState(draft.step);
    }
    if (hasAccountSessionCredentials()) {
      void getGuideRegistrationServerDraft()
        .then((server) => {
          if (!server || typeof server !== "object") return;
          const s = server as Record<string, string>;
          if (s.walletAddress) setWalletAddress(s.walletAddress);
          if (s.realName) setRealName(s.realName);
          if (s.idNumber) setIdNumber(s.idNumber);
          if (s.city) setCity(s.city);
          if (s.countryCode) setCountryCode(s.countryCode);
          if (s.languages) setLanguages(s.languages);
          if (s.serviceTypes) setServiceTypes(s.serviceTypes);
          if (s.bio) setBio(s.bio);
          setSessionDraftRestored(true);
        })
        .catch(() => {
          /* optional */
        });
    }
  }, []);

  useEffect(() => {
    if (done || isAlreadyGuide || isPendingGuide || guideSuspended) return;
    const timer = window.setTimeout(() => {
      const payload = {
        v: 1,
        step,
        walletAddress,
        realName,
        idNumber,
        city,
        countryCode,
        languages,
        serviceTypes,
        bio,
        guideLicenseUrl,
        pendingIdPhotoName: pendingIdPhoto,
        pendingLangCertName: pendingLangCert,
      };
      writeGuideRegisterDraft(payload);
      if (isLoggedIn) {
        void putGuideRegistrationServerDraft(payload as Record<string, unknown>).catch(() => {
          /* optional */
        });
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    step,
    walletAddress,
    realName,
    idNumber,
    city,
    countryCode,
    languages,
    serviceTypes,
    bio,
    guideLicenseUrl,
    pendingIdPhoto,
    pendingLangCert,
    done,
    isAlreadyGuide,
    isPendingGuide,
    guideSuspended,
    isLoggedIn,
  ]);

  useEffect(() => {
    if (done || isAlreadyGuide || isPendingGuide || guideSuspended) {
      const timer = setTimeout(() => successFocusRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [done, isAlreadyGuide, isPendingGuide, guideSuspended]);

  const guideRegisterWalletInputId = useId();
  const guideRegisterWalletErrorId = useId();
  const guideLicenseHintId = useId();
  const guideRegisterFormErrorId = useId();

  const unlockReapply = useCallback(() => {
    setReapplyUnlocked(true);
    setGuideRejected(false);
    setStep(1);
  }, [setStep]);

  const goToStep = useCallback(
    (target: GuideRegisterStep) => {
      if (target > 1 && kycBlocksSubmit) {
        setError(t("guideRegister_kycBlocked"));
        return;
      }
      if (target > 1 && isLoggedIn === false) {
        setFieldError("login");
        setError(t("guideRegister_errorLoginRequired"));
        return;
      }
      if (target > step) {
        for (let s = step; s < target; s++) {
          const failure = onValidateStep(s as GuideRegisterStep);
          if (failure) {
            applyValidationFailure(failure, s as GuideRegisterStep);
            return;
          }
        }
      }
      clearSubmitError();
      setStep(target);
    },
    [applyValidationFailure, clearSubmitError, isLoggedIn, kycBlocksSubmit, onValidateStep, setStep, step, t],
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
    clearSubmitError();
    const s1 = onValidateStep(1);
    if (s1) {
      applyValidationFailure(s1, 1);
      return;
    }
    const s2 = onValidateStep(2);
    if (s2) {
      applyValidationFailure(s2, 2);
      return;
    }
    if (!agreePrivacy) {
      setFieldError("agree");
      setError(t("guideRegister_errorAgree"));
      setStep(3);
      return;
    }
    if (isLoggedIn === false) {
      setFieldError("login");
      setError(t("guideRegister_errorLoginRequired"));
      return;
    }
    if (kycBlocksSubmit) {
      setError(t("guideRegister_kycBlocked"));
      return;
    }
    setLoading(true);
    setUploadPhase("uploading");
    await runGuideRegisterSubmitFlow({
      t,
      walletAddress,
      city,
      countryCode,
      languages,
      serviceTypes,
      bio,
      realName,
      idNumber,
      idPhotoFile,
      pendingIdPhoto,
      languageCertFile,
      pendingLangCert,
      guideLicenseUrl,
      setError,
      setDone,
      setIsAlreadyGuide,
      setRealName,
      setIdNumber,
      setPendingIdPhoto,
      setPendingLangCert,
      setIdPhotoFile,
      setLanguageCertFile,
      setLoading,
      setUploadPhase,
    });
  };

  const showRejectedGate = guideRejected && !reapplyUnlocked;
  const busy = loading || uploadPhase !== "idle";

  return {
    t,
    step,
    setStep,
    goToStep,
    onValidateStep,
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
    loading: busy,
    uploadPhase,
    error,
    fieldError,
    fieldInlineError,
    kycStatus,
    requireKycVerified,
    kycBlocksSubmit,
    walletVerify,
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
    walletMatchConnected: Boolean(walletMatchConnected),
    successFocusRef,
    guideRegisterWalletInputId,
    guideRegisterWalletErrorId,
    guideLicenseHintId,
    guideRegisterFormErrorId,
    clearSubmitError,
    handleSubmit,
    handleUseConnectedWallet,
    applyValidationFailure,
  };
}
