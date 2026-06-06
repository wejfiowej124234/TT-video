"use client";



import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAccount } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";

import { getMe, getMeStewardApplication, postStewardApplication } from "@/lib/apiClient";

import { useRegisterPageAccountSession } from "@/lib/auth/registerPageAccountSession";

import { userFromGetMePayload } from "@/lib/meTrust";

import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";

import { resolveRegisterBackPath } from "@/app/auth/register/registerPageModel";
import { isMeSettingsExtensionFromQuery } from "@/lib/me/meSettingsExtensionContext";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";

import { readGuideWalletVerifiedAddress } from "@/lib/constants/guideRegisterKeys";

import { useGuideRegisterWalletVerify } from "@/app/guide/register/useGuideRegisterWalletVerify";

import {

  isStewardAlreadyActive,

  isStewardApplicationPending,

  isStewardApplicationRejected,

  parseStewardRegisterStepParam,

  STEWARD_REGISTER_ERROR_KEYS,

  clampStewardRegisterStep,

  stewardRegisterMaxReachableStep,

  stewardRegisterValidationFailureFromCode,

  validateStewardRegisterForm,

  validateStewardRegisterStep1,

  validateStewardRegisterStep2,

  type StewardRegisterFieldKey,

  type StewardRegisterStep,

} from "@/lib/steward/stewardRegisterValidation";



type MeStewardApplicationResponse = {

  application?: {

    status?: string;

    rejection_codes?: string[];

    rejection_message?: string | null;

    wallet_address?: string;

  } | null;

};



export function useStewardRegisterPage() {

  const { t } = useTranslation();

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const loginReturnUrl = useMemo(

    () => buildLoginReturnPathWithQuery(pathname, searchParams?.toString() ?? "", "/steward/register"),

    [pathname, searchParams],

  );

  const fromSettings = isMeSettingsExtensionFromQuery(searchParams.get("from"));

  const backHref = useMemo(

    () => resolveRegisterBackPath(searchParams.get("returnUrl"), "steward", { fromSettings }),

    [searchParams, fromSettings],

  );



  const [step, setStepState] = useState<StewardRegisterStep>(() =>

    parseStewardRegisterStepParam(searchParams.get("step")),

  );

  const [selected, setSelected] = useState<string[]>([]);

  const [legalName, setLegalName] = useState("");

  const [contactEmail, setContactEmail] = useState("");

  const [wallet, setWallet] = useState("");

  const [motivation, setMotivation] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [fieldError, setFieldError] = useState<StewardRegisterFieldKey | null>(null);

  const [done, setDone] = useState(false);

  const isLoggedIn = useRegisterPageAccountSession();

  const [isAlreadySteward, setIsAlreadySteward] = useState(false);

  const [isPending, setIsPending] = useState(false);

  const [isRejected, setIsRejected] = useState(false);

  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  const [reapplyUnlocked, setReapplyUnlocked] = useState(false);

  const [meCheckReady, setMeCheckReady] = useState(false);

  const successFocusRef = useRef<HTMLDivElement>(null);



  const { address: connectedAddress, isConnected } = useAccount();

  const walletVerify = useGuideRegisterWalletVerify(t, wallet);

  const walletInputId = useId();

  const walletErrorId = useId();

  const walletMatchConnected = Boolean(

    connectedAddress && wallet.trim().toLowerCase() === connectedAddress.toLowerCase(),

  );



  const goToStep = useCallback(

    (s: StewardRegisterStep) => {

      setStepState(s);

      const params = new URLSearchParams(searchParams?.toString() ?? "");

      params.set("step", String(s));

      router.replace(`${pathname}?${params.toString()}`);

    },

    [pathname, router, searchParams],

  );



  const clearSubmitError = useCallback(() => {

    setError(null);

    setFieldError(null);

  }, []);



  const handleUseConnectedWallet = useCallback(() => {

    if (connectedAddress) setWallet(connectedAddress);

  }, [connectedAddress]);



  useEffect(() => {

    if (connectedAddress && !wallet.trim()) {

      setWallet(connectedAddress);

    }

  }, [connectedAddress, wallet]);



  useEffect(() => {

    const verified = readGuideWalletVerifiedAddress();

    if (!verified) return;

    if (!wallet.trim()) setWallet(verified);

    if (

      verified.toLowerCase() === wallet.trim().toLowerCase() ||

      (!wallet.trim() && connectedAddress?.toLowerCase() === verified.toLowerCase())

    ) {

      walletVerify.setVerifiedAddress(verified);

    }

  }, [connectedAddress, wallet, walletVerify.setVerifiedAddress]);



  const fieldInlineError = useCallback(

    (field: StewardRegisterFieldKey) => (fieldError === field && error ? error : null),

    [fieldError, error],

  );

  const stepInput = useMemo(
    () => ({
      jurisdictions: selected,
      legal_name: legalName,
      contact_email: contactEmail,
      wallet_address: wallet,
      wallet_verified: walletVerify.walletVerified,
    }),
    [selected, legalName, contactEmail, wallet, walletVerify.walletVerified],
  );

  useEffect(() => {
    const urlStep = parseStewardRegisterStepParam(searchParams.get("step"));
    const clamped = clampStewardRegisterStep(urlStep, stepInput);
    setStepState(clamped);
    if (clamped !== urlStep) {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("step", String(clamped));
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [pathname, router, searchParams, stepInput]);



  const toggleJurisdiction = useCallback((id: string) => {

    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    clearSubmitError();

  }, [clearSubmitError]);



  const unlockReapply = useCallback(() => {

    setReapplyUnlocked(true);

    setIsRejected(false);

    setIsPending(false);

    setDone(false);

    setError(null);

    goToStep(1);

  }, [goToStep]);



  const showRejectedGate = isRejected && !reapplyUnlocked && !done;



  const applyValidationFailure = useCallback(

    (fail: { messageKey: string; field: StewardRegisterFieldKey }) => {

      setFieldError(fail.field);

      setError(t(fail.messageKey));

    },

    [t],

  );



  useEffect(() => {

    if (!isLoggedIn) {

      setIsPending(false);

      setIsRejected(false);

      setIsAlreadySteward(false);

      setMeCheckReady(true);

      return;

    }

    let cancelled = false;

    (async () => {

      try {

        const me = await getMe();

        if (cancelled) return;

        const user = userFromGetMePayload(me);

        if (user?.email && !contactEmail) setContactEmail(user.email);

        if (isStewardAlreadyActive(user?.role)) {

          setIsAlreadySteward(true);

          return;

        }

        const appRes = (await getMeStewardApplication()) as MeStewardApplicationResponse;

        const app = appRes.application;

        if (app?.status && isStewardApplicationPending(app.status)) setIsPending(true);

        if (app?.status && isStewardApplicationRejected(app.status) && !reapplyUnlocked) {

          setIsRejected(true);

          if (typeof app.rejection_message === "string") setRejectionMessage(app.rejection_message);

        }

        if (app?.wallet_address && !wallet) setWallet(app.wallet_address);

        const verified = readGuideWalletVerifiedAddress();

        if (verified && !wallet) setWallet(verified);

      } catch {

        /* optional */

      } finally {

        if (!cancelled) setMeCheckReady(true);

      }

    })();

    return () => {

      cancelled = true;

    };

  }, [isLoggedIn, reapplyUnlocked, contactEmail, wallet]);



  const translateError = useCallback(

    (code: string) => t(STEWARD_REGISTER_ERROR_KEYS[code] ?? code),

    [t],

  );



  function handleNextFromStep1(e: FormEvent) {

    e.preventDefault();

    setError(null);

    setFieldError(null);

    const fail = validateStewardRegisterStep1(selected);

    if (fail) {

      applyValidationFailure(fail);

      return;

    }

    goToStep(2);

  }



  function handleNextFromStep2(e: FormEvent) {

    e.preventDefault();

    setError(null);

    setFieldError(null);

    const fail = validateStewardRegisterStep2({

      legal_name: legalName,

      contact_email: contactEmail,

      wallet_address: wallet,

      wallet_verified: walletVerify.walletVerified,

    });

    if (fail) {

      applyValidationFailure(fail);

      return;

    }

    goToStep(3);

  }



  async function handleSubmit(e: FormEvent) {

    e.preventDefault();

    setError(null);

    setFieldError(null);

    const validation = validateStewardRegisterForm(

      {

        jurisdictions: selected,

        legal_name: legalName,

        contact_email: contactEmail,

        wallet_address: wallet,

        motivation,

      },

      { wallet_verified: walletVerify.walletVerified },

    );

    if (!validation.ok) {

      const fail = stewardRegisterValidationFailureFromCode(validation.code);

      if (fail) {

        applyValidationFailure(fail);

        goToStep(fail.field === "jurisdictions" ? 1 : 2);

        return;

      }

      setError(translateError(validation.code));

      return;

    }

    setSubmitting(true);

    try {

      await postStewardApplication({

        jurisdictions: selected,

        legal_name: legalName.trim(),

        contact_email: contactEmail.trim(),

        wallet_address: wallet.trim(),

        motivation: motivation.trim() || undefined,

      });

      setDone(true);

    } catch (err) {

      const code = err instanceof Error ? err.message : "submit_failed";

      setError(translateError(code in STEWARD_REGISTER_ERROR_KEYS ? code : "submit_failed"));

    } finally {

      setSubmitting(false);

    }

  }



  return {

    t,

    step,

    goToStep,

    backHref,

    fromSettings,

    settingsBackLabelKey:
      backHref === ME_SETTINGS_HUB_PATH ? "me_settings_back_hub" : "stewardRegister_backToHub",

    loginReturnUrl,

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

    done,

    isLoggedIn,

    isAlreadySteward,

    isPending,

    showRejectedGate,

    rejectionMessage,

    unlockReapply,

    meCheckReady,

    successFocusRef: successFocusRef as RefObject<HTMLDivElement | null>,

    translateError,

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

  };

}


