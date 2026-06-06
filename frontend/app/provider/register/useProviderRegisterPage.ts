import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { getMe, getMeProviderApplication } from "@/lib/apiClient";
import { useRegisterPageAccountSession } from "@/lib/auth/registerPageAccountSession";
import { parseMeTrustFromMeResponse, userFromGetMePayload } from "@/lib/meTrust";
import { readProviderRegisterDraft, writeProviderRegisterDraft } from "@/lib/provider/providerRegisterDraft";
import {
  getProviderRegistrationServerDraft,
  putProviderRegistrationServerDraft,
} from "@/lib/provider/providerRegisterServerDraft";
import {
  isProviderAlreadyActive,
  isProviderApplicationPending,
  isProviderApplicationRejected,
  parseProviderRegisterStepParam,
  validateProviderRegisterStep1,
  validateProviderRegisterStep2,
  validateProviderRegisterStep3,
  type ProviderRegisterFieldKey,
  type ProviderRegisterStep,
} from "@/lib/provider/providerRegisterValidation";
import { readGuideWalletVerifiedAddress } from "@/lib/constants/guideRegisterKeys";
import { useGuideRegisterWalletVerify } from "@/app/guide/register/useGuideRegisterWalletVerify";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";
import { resolveRegisterBackPath } from "@/app/auth/register/registerPageModel";
import { isMeSettingsExtensionFromQuery } from "@/lib/me/meSettingsExtensionContext";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";
import { runProviderRegisterSubmitFlow } from "./providerRegisterSubmitFlow";

export function useProviderRegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginReturnUrl = useMemo(
    () => buildLoginReturnPathWithQuery(pathname, searchParams?.toString() ?? "", "/provider/register"),
    [pathname, searchParams],
  );
  const fromSettings = isMeSettingsExtensionFromQuery(searchParams.get("from"));
  const backHref = useMemo(
    () => resolveRegisterBackPath(searchParams.get("returnUrl"), "provider", { fromSettings }),
    [searchParams, fromSettings],
  );

  const [step, setStepState] = useState<ProviderRegisterStep>(() =>
    parseProviderRegisterStepParam(searchParams.get("step")),
  );
  const [legalName, setLegalName] = useState("");
  const [entityType, setEntityType] = useState("company");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [registeredAddressLine1, setRegisteredAddressLine1] = useState("");
  const [registeredAddressLine2, setRegisteredAddressLine2] = useState("");
  const [registeredPostalCode, setRegisteredPostalCode] = useState("");
  const [operatingSameAsRegistered, setOperatingSameAsRegistered] = useState(true);
  const [operatingAddressLine1, setOperatingAddressLine1] = useState("");
  const [operatingAddressLine2, setOperatingAddressLine2] = useState("");
  const [operatingCity, setOperatingCity] = useState("");
  const [operatingPostalCode, setOperatingPostalCode] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [categories, setCategories] = useState("");
  const [bio, setBio] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [travelAgencyPermitFile, setTravelAgencyPermitFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [legalRepresentativeIdFile, setLegalRepresentativeIdFile] = useState<File | null>(null);
  const [beneficialOwnerFullName, setBeneficialOwnerFullName] = useState("");
  const [beneficialOwnerIdType, setBeneficialOwnerIdType] = useState("passport");
  const [beneficialOwnerIdNumber, setBeneficialOwnerIdNumber] = useState("");
  const [beneficialOwnerIdDocFile, setBeneficialOwnerIdDocFile] = useState<File | null>(null);
  const [pendingBusinessLicenseName, setPendingBusinessLicenseName] = useState<string | null>(null);
  const [pendingTravelAgencyPermitName, setPendingTravelAgencyPermitName] = useState<string | null>(null);
  const [pendingLegalRepresentativeIdName, setPendingLegalRepresentativeIdName] = useState<string | null>(null);
  const [pendingBeneficialOwnerIdDocName, setPendingBeneficialOwnerIdDocName] = useState<string | null>(null);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<ProviderRegisterFieldKey | null>(null);
  const [done, setDone] = useState(false);
  const isLoggedIn = useRegisterPageAccountSession();
  const [isAlreadyProvider, setIsAlreadyProvider] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionCodes, setRejectionCodes] = useState<string[]>([]);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const [reapplyUnlocked, setReapplyUnlocked] = useState(false);
  const [meCheckReady, setMeCheckReady] = useState(false);
  const successFocusRef = useRef<HTMLDivElement>(null);

  const { address: connectedAddress, isConnected } = useAccount();
  const walletVerify = useGuideRegisterWalletVerify(t, walletAddress);
  const walletInputId = useId();
  const walletErrorId = useId();
  const walletMatchConnected = Boolean(
    connectedAddress && walletAddress.trim().toLowerCase() === connectedAddress.toLowerCase(),
  );
  const clearSubmitError = useCallback(() => {
    setError(null);
    setFieldError(null);
  }, []);
  const handleUseConnectedWallet = useCallback(() => {
    if (connectedAddress) setWalletAddress(connectedAddress);
  }, [connectedAddress]);

  const goToStep = useCallback(
    (s: ProviderRegisterStep) => {
      setStepState(s);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("step", String(s));
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const fieldInlineError = useCallback(
    (field: ProviderRegisterFieldKey) => (fieldError === field && error ? error : null),
    [fieldError, error],
  );

  const draftHydrated = useRef(false);
  useEffect(() => {
    if (draftHydrated.current) return;
    const local = readProviderRegisterDraft();
    if (local) {
      if (local.legalName) setLegalName(local.legalName);
      if (local.entityType) setEntityType(local.entityType);
      if (local.registrationNumber) setRegistrationNumber(local.registrationNumber);
      if (local.taxId) setTaxId(local.taxId);
      if (local.countryCode) setCountryCode(local.countryCode);
      if (local.city) setCity(local.city);
      if (local.registeredAddressLine1) setRegisteredAddressLine1(local.registeredAddressLine1);
      if (local.registeredAddressLine2) setRegisteredAddressLine2(local.registeredAddressLine2);
      if (local.registeredPostalCode) setRegisteredPostalCode(local.registeredPostalCode);
      if (local.operatingSameAsRegistered != null) setOperatingSameAsRegistered(local.operatingSameAsRegistered);
      if (local.operatingAddressLine1) setOperatingAddressLine1(local.operatingAddressLine1);
      if (local.beneficialOwnerFullName) setBeneficialOwnerFullName(local.beneficialOwnerFullName);
      if (local.beneficialOwnerIdType) setBeneficialOwnerIdType(local.beneficialOwnerIdType);
      if (local.beneficialOwnerIdNumber) setBeneficialOwnerIdNumber(local.beneficialOwnerIdNumber);
      if (local.contactName) setContactName(local.contactName);
      if (local.contactPhone) setContactPhone(local.contactPhone);
      if (local.contactEmail) setContactEmail(local.contactEmail);
      if (local.shopName) setShopName(local.shopName);
      if (local.categories) setCategories(local.categories);
      if (local.bio) setBio(local.bio);
      if (local.walletAddress) setWalletAddress(local.walletAddress);
      if (local.pendingBusinessLicenseName) setPendingBusinessLicenseName(local.pendingBusinessLicenseName);
      if (local.step) setStepState(local.step);
    }
    draftHydrated.current = true;
  }, []);

  useEffect(() => {
    writeProviderRegisterDraft({
      v: 1,
      step,
      legalName,
      entityType,
      registrationNumber,
      taxId,
      countryCode,
      city,
      registeredAddressLine1,
      registeredAddressLine2,
      registeredPostalCode,
      operatingSameAsRegistered,
      operatingAddressLine1,
      beneficialOwnerFullName,
      beneficialOwnerIdType,
      beneficialOwnerIdNumber,
      contactName,
      contactPhone,
      contactEmail,
      shopName,
      categories,
      bio,
      walletAddress,
      pendingBusinessLicenseName,
      pendingTravelAgencyPermitName,
    });
  }, [
    step,
    legalName,
    entityType,
    registrationNumber,
    taxId,
    countryCode,
    city,
    registeredAddressLine1,
    registeredAddressLine2,
    registeredPostalCode,
    operatingSameAsRegistered,
    operatingAddressLine1,
    beneficialOwnerFullName,
    beneficialOwnerIdType,
    beneficialOwnerIdNumber,
    contactName,
    contactPhone,
    contactEmail,
    shopName,
    categories,
    bio,
    walletAddress,
    pendingBusinessLicenseName,
  ]);

  useEffect(() => {
    if (isLoggedIn !== true) return;
    const id = window.setTimeout(() => {
      putProviderRegistrationServerDraft({
        step,
        legalName,
        entityType,
        registrationNumber,
        taxId,
        countryCode,
        city,
        registeredAddressLine1,
        registeredAddressLine2,
        registeredPostalCode,
        operatingSameAsRegistered,
        operatingAddressLine1,
        contactName,
        contactPhone,
        contactEmail,
        shopName,
        categories,
        bio,
        walletAddress,
      }).catch(() => {});
    }, 600);
    return () => window.clearTimeout(id);
  }, [
    isLoggedIn,
    step,
    legalName,
    entityType,
    registrationNumber,
    taxId,
    countryCode,
    city,
    registeredAddressLine1,
    registeredAddressLine2,
    registeredPostalCode,
    operatingSameAsRegistered,
    operatingAddressLine1,
    beneficialOwnerFullName,
    beneficialOwnerIdType,
    beneficialOwnerIdNumber,
    contactName,
    contactPhone,
    contactEmail,
    shopName,
    categories,
    bio,
    walletAddress,
  ]);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsPending(false);
      setIsRejected(false);
      setIsAlreadyProvider(false);
      setMeCheckReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        const user = userFromGetMePayload(me);
        const trust = parseMeTrustFromMeResponse(me, user);
        if (user?.role && isProviderAlreadyActive(user.role)) {
          setIsAlreadyProvider(true);
          return;
        }
        const st = trust.provider_registration_status;
        if (st && isProviderApplicationPending(st)) setIsPending(true);
        else if (st && isProviderApplicationRejected(st) && !reapplyUnlocked) {
          setIsRejected(true);
          setRejectionCodes(trust.provider_registration_rejection_codes ?? []);
          setRejectionMessage(trust.provider_registration_rejection_message ?? null);
        }
        try {
          const appRes = (await getMeProviderApplication()) as {
            application?: {
              status?: string;
              rejection_codes?: string[];
              rejection_message?: string | null;
            } | null;
          };
          const app = appRes.application;
          if (app?.status && isProviderApplicationPending(app.status)) setIsPending(true);
          if (app?.status && isProviderApplicationRejected(app.status) && !reapplyUnlocked) {
            setIsRejected(true);
            if (Array.isArray(app.rejection_codes) && app.rejection_codes.length > 0) {
              setRejectionCodes(app.rejection_codes);
            }
            if (typeof app.rejection_message === "string") setRejectionMessage(app.rejection_message);
          }
        } catch {
          /* optional */
        }
        if (user?.id) {
          try {
            const { draft } = await getProviderRegistrationServerDraft();
            if (draft.legalName && typeof draft.legalName === "string") setLegalName(draft.legalName);
            if (draft.entityType && typeof draft.entityType === "string") setEntityType(draft.entityType);
            if (draft.walletAddress && typeof draft.walletAddress === "string") {
              setWalletAddress(draft.walletAddress);
            }
          } catch {
            /* ignore */
          }
        }
        const verified = readGuideWalletVerifiedAddress();
        if (verified && !walletAddress) setWalletAddress(verified);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setMeCheckReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, reapplyUnlocked, walletAddress]);

  const unlockReapply = useCallback(() => {
    setReapplyUnlocked(true);
    setIsRejected(false);
    setIsPending(false);
    setDone(false);
    goToStep(1);
  }, [goToStep]);

  const showRejectedGate = isRejected && !reapplyUnlocked && !done;

  function applyValidationFailure(f: { messageKey: string; field: ProviderRegisterFieldKey }) {
    setFieldError(f.field);
    setError(t(f.messageKey));
  }

  function handleNextFromStep1(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    const fail = validateProviderRegisterStep1({
      legalName,
      entityType,
      registrationNumber,
      businessLicenseFile,
      pendingBusinessLicenseName,
      walletAddress,
      walletVerified: walletVerify.walletVerified,
    });
    if (fail) {
      applyValidationFailure(fail);
      return;
    }
    if (businessLicenseFile) setPendingBusinessLicenseName(businessLicenseFile.name);
    goToStep(2);
  }

  function handleNextFromStep2(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    const fail = validateProviderRegisterStep2({
      countryCode,
      city,
      registeredAddressLine1,
      registeredAddressLine2,
      registeredPostalCode,
      operatingSameAsRegistered,
      operatingAddressLine1,
      operatingAddressLine2,
      operatingCity,
      operatingPostalCode,
      travelAgencyPermitFile,
      pendingTravelAgencyPermitName,
      contactName,
      contactPhone,
      contactEmail,
    });
    if (fail) {
      applyValidationFailure(fail);
      return;
    }
    if (travelAgencyPermitFile) setPendingTravelAgencyPermitName(travelAgencyPermitFile.name);
    goToStep(3);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    const fail = validateProviderRegisterStep3({
      entityType,
      shopName,
      agree: agreePrivacy,
      beneficialOwner: {
        fullName: beneficialOwnerFullName,
        idType: beneficialOwnerIdType,
        idNumber: beneficialOwnerIdNumber,
        idDocFile: beneficialOwnerIdDocFile,
        pendingIdDocName: pendingBeneficialOwnerIdDocName,
      },
      legalRepresentativeIdFile,
      pendingLegalRepresentativeIdName,
    });
    if (fail) {
      applyValidationFailure(fail);
      return;
    }
    if (beneficialOwnerIdDocFile) setPendingBeneficialOwnerIdDocName(beneficialOwnerIdDocFile.name);
    if (legalRepresentativeIdFile) setPendingLegalRepresentativeIdName(legalRepresentativeIdFile.name);
    setLoading(true);
    await runProviderRegisterSubmitFlow({
      t,
      legalName,
      entityType,
      registrationNumber,
      taxId,
      countryCode,
      city,
      registeredAddressLine1,
      registeredAddressLine2,
      registeredPostalCode,
      operatingSameAsRegistered,
      operatingAddressLine1,
      operatingAddressLine2,
      operatingCity,
      operatingPostalCode,
      contactName,
      contactPhone,
      contactEmail,
      shopName,
      categories,
      bio,
      walletAddress,
      businessLicenseFile,
      travelAgencyPermitFile,
      insuranceFile,
      legalRepresentativeIdFile,
      beneficialOwnerFullName,
      beneficialOwnerIdType,
      beneficialOwnerIdNumber,
      beneficialOwnerIdDocFile,
      setError,
      setDone,
      setLoading,
      setUploadPhase,
    });
  }

  return {
    t,
    step,
    goToStep,
    backHref,
    fromSettings,
    settingsBackLabelKey: backHref === ME_SETTINGS_HUB_PATH ? "me_settings_back_hub" : "providerRegister_backToHub",
    loginReturnUrl,
    legalName,
    setLegalName,
    entityType,
    setEntityType,
    registrationNumber,
    setRegistrationNumber,
    taxId,
    setTaxId,
    countryCode,
    setCountryCode,
    city,
    setCity,
    registeredAddressLine1,
    setRegisteredAddressLine1,
    registeredAddressLine2,
    setRegisteredAddressLine2,
    registeredPostalCode,
    setRegisteredPostalCode,
    operatingSameAsRegistered,
    setOperatingSameAsRegistered,
    operatingAddressLine1,
    setOperatingAddressLine1,
    operatingAddressLine2,
    setOperatingAddressLine2,
    operatingCity,
    setOperatingCity,
    operatingPostalCode,
    setOperatingPostalCode,
    contactName,
    setContactName,
    contactPhone,
    setContactPhone,
    contactEmail,
    setContactEmail,
    shopName,
    setShopName,
    categories,
    setCategories,
    bio,
    setBio,
    walletAddress,
    setWalletAddress,
    businessLicenseFile,
    setBusinessLicenseFile,
    travelAgencyPermitFile,
    setTravelAgencyPermitFile,
    insuranceFile,
    setInsuranceFile,
    legalRepresentativeIdFile,
    setLegalRepresentativeIdFile,
    beneficialOwnerFullName,
    setBeneficialOwnerFullName,
    beneficialOwnerIdType,
    setBeneficialOwnerIdType,
    beneficialOwnerIdNumber,
    setBeneficialOwnerIdNumber,
    beneficialOwnerIdDocFile,
    setBeneficialOwnerIdDocFile,
    agreePrivacy,
    setAgreePrivacy,
    loading,
    uploadPhase,
    error,
    fieldInlineError,
    done,
    isLoggedIn,
    isAlreadyProvider,
    isPending,
    isRejected,
    walletVerify,
    walletInputId,
    walletErrorId,
    isConnected,
    connectedAddress,
    walletMatchConnected,
    clearSubmitError,
    handleUseConnectedWallet,
    handleNextFromStep1,
    handleNextFromStep2,
    handleSubmit,
    rejectionCodes,
    rejectionMessage,
    unlockReapply,
    showRejectedGate,
    meCheckReady,
    successFocusRef: successFocusRef as RefObject<HTMLDivElement | null>,
  };
}
