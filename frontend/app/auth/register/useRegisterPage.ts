// search-params gate: parent route provides Suspense boundary.
// UI 收口锁死：evidence/GO_local_auth_l5/AUTH-REGISTER-UI-FREEZE.md · authRegisterUiFreeze.contract.test.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { postRegister, postRegisterSendVerificationCode, applyClientSessionAfterAuth, postGuideUploadDoc, getReferralValidate } from "@/lib/apiClient";
import { PENDING_GUIDE_KEY } from "@/lib/constants";
import { PASSWORD_MIN_LEN, MAX_FILE_SIZE } from "./constants";
import { registerPageShellClass } from "./registerBackgrounds";
import { isValidWalletAddress, fileToBase64 } from "./utils";
import { authL5FieldClass, TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { resolvePostAuthReturnPath } from "@/lib/auth/postAuthReturnPath";
import { buildHeaderLoginHref } from "@/lib/headerLoginHref";
import { safeInternalReturnPath } from "@/lib/safeInternalReturnPath";
import {
  REGISTER_ERROR_KEYS,
  registerApiCatch,
  registerTypeFromRoleParam,
  resolveRegisterBackPath,
  type RegisterType,
} from "./registerPageModel";

export function useRegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const refParam = searchParams.get("ref");
  const loginHref = useMemo(() => {
    const regReturn = searchParams.get("returnUrl")?.trim();
    if (regReturn) {
      const safe = safeInternalReturnPath(regReturn, "/");
      return `/auth/login?returnUrl=${encodeURIComponent(safe)}`;
    }
    return buildHeaderLoginHref(pathname, searchParams);
  }, [pathname, searchParams]);
  const [registerType, setRegisterType] = useState<RegisterType>("traveler");

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sendCodeBusy, setSendCodeBusy] = useState(false);
  const [sendCodeCooldown, setSendCodeCooldown] = useState(0);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const sendCodeCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [defaultWallet, setDefaultWallet] = useState("");

  const [realName, setRealName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [languages, setLanguages] = useState("");
  const [serviceTypes, setServiceTypes] = useState("");
  const [bio, setBio] = useState("");
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [languageCertFile, setLanguageCertFile] = useState<File | null>(null);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [referralPrefill, setReferralPrefill] = useState<string | null>(null);
  const [referralValidateState, setReferralValidateState] = useState<"idle" | "validating" | "valid" | "invalid">("idle");

  useEffect(() => {
    setRegisterType(registerTypeFromRoleParam(roleParam));
  }, [roleParam]);

  useEffect(() => {
    const raw = refParam?.trim();
    if (!raw) {
      setReferralPrefill(null);
      setReferralValidateState("idle");
      return;
    }
    setReferralPrefill(raw);
    let cancelled = false;
    setReferralValidateState("validating");
    void getReferralValidate(raw)
      .then((res) => {
        if (cancelled) return;
        if (res.valid) setReferralValidateState("valid");
        else setReferralValidateState("invalid");
      })
      .catch(() => {
        if (!cancelled) setReferralValidateState("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [refParam]);

  useEffect(() => {
    return () => {
      if (sendCodeCooldownRef.current) clearInterval(sendCodeCooldownRef.current);
    };
  }, []);

  function startSendCodeCooldown(seconds = 60) {
    if (sendCodeCooldownRef.current) clearInterval(sendCodeCooldownRef.current);
    setSendCodeCooldown(seconds);
    sendCodeCooldownRef.current = setInterval(() => {
      setSendCodeCooldown((prev) => {
        if (prev <= 1) {
          if (sendCodeCooldownRef.current) {
            clearInterval(sendCodeCooldownRef.current);
            sendCodeCooldownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendVerificationCode() {
    setError(null);
    const emailTrim = email.trim();
    if (!emailTrim) {
      setError("email_required");
      return;
    }
    setSendCodeBusy(true);
    try {
      const res = await postRegisterSendVerificationCode({ email: emailTrim });
      startSendCodeCooldown();
      const dev = res.registration_verification_dev_code?.trim();
      setDevCodeHint(dev || null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "send_code_failed";
      if (msg === "invalid_email") setError("invalid_email");
      else if (msg === "email_already_registered") setError("email_already_registered");
      else if (msg === "verification_code_rate_limited") setError("verification_code_rate_limited");
      else setError("send_code_failed");
    } finally {
      setSendCodeBusy(false);
    }
  }

  async function handleTravelerSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const emailTrim = email.trim();
    if (!emailTrim) {
      setError("email_required");
      return;
    }
    if (!verificationCode.trim()) {
      setError("verification_code_required");
      return;
    }
    if (verificationCode.trim().length !== 6) {
      setError("verification_code_invalid");
      return;
    }
    if (!password) {
      setError("password_required");
      return;
    }
    if (!passwordConfirm) {
      setError("password_confirm_required");
      return;
    }
    if (password.length < PASSWORD_MIN_LEN) {
      setError("password_too_short");
      return;
    }
    if (password !== passwordConfirm) {
      setError("password_mismatch");
      return;
    }
    const walletTrim = defaultWallet.trim();
    if (walletTrim && !isValidWalletAddress(walletTrim)) {
      setError("wallet_invalid");
      return;
    }
    setLoading(true);
    try {
      const res = await postRegister({
        email: emailTrim,
        password,
        verification_code: verificationCode.trim(),
        nickname: nickname || undefined,
        default_wallet_address: walletTrim && isValidWalletAddress(walletTrim) ? walletTrim : undefined,
        referral_code: referralPrefill?.trim() || undefined,
      });
      const uid = applyClientSessionAfterAuth(res);
      if (!uid) {
        setError("register_failed");
        return;
      }
      if (registerType === "provider") {
        const ret = searchParams.get("returnUrl");
        const q = ret ? `?returnUrl=${encodeURIComponent(safeInternalReturnPath(ret, "/provider/register"))}` : "";
        await router.replace(`/provider/register${q}`);
        return;
      }
      if (registerType === "steward") {
        const ret = searchParams.get("returnUrl");
        const q = ret ? `?returnUrl=${encodeURIComponent(safeInternalReturnPath(ret, "/steward/register"))}` : "";
        await router.replace(`/steward/register${q}`);
        return;
      }
      const next = resolvePostAuthReturnPath(searchParams.get("returnUrl"));
      await router.replace(next);
    } catch (err) {
      registerApiCatch(err, t, setError, "RegisterForm submit:");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuideSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const emailTrim = email.trim();
    if (!emailTrim) {
      setError("email_required");
      return;
    }
    if (!verificationCode.trim()) {
      setError("verification_code_required");
      return;
    }
    if (verificationCode.trim().length !== 6) {
      setError("verification_code_invalid");
      return;
    }
    if (!password) {
      setError("password_required");
      return;
    }
    if (!passwordConfirm) {
      setError("password_confirm_required");
      return;
    }
    if (!realName.trim() || !idNumber.trim() || !walletAddress.trim() || !city.trim()) {
      setError("required");
      return;
    }
    if (!idPhotoFile) {
      setError("id_photo");
      return;
    }
    if (!isValidWalletAddress(walletAddress)) {
      setError("wallet_address");
      return;
    }
    if (password !== passwordConfirm) {
      setError("password_mismatch");
      return;
    }
    if (!agreePrivacy) {
      setError("agree_privacy");
      return;
    }
    if (password.length < PASSWORD_MIN_LEN) {
      setError("password_too_short");
      return;
    }
    setLoading(true);
    try {
      const idPhotoBase64 = await fileToBase64(idPhotoFile, MAX_FILE_SIZE);
      let languageCertBase64: string | undefined;
      let languageCertName: string | undefined;
      if (languageCertFile) {
        try {
          languageCertBase64 = await fileToBase64(languageCertFile, MAX_FILE_SIZE);
          languageCertName = languageCertFile.name;
        } catch {
          // 语言证明可选，超大小或读失败则忽略
        }
      }
      const res = await postRegister({
        email: emailTrim,
        password,
        verification_code: verificationCode.trim(),
        nickname: nickname || undefined,
        referral_code: referralPrefill?.trim() || undefined,
      });
      const uid = applyClientSessionAfterAuth(res);
      if (!uid) {
        setError("register_failed");
        return;
      }
      let idPhotoUrl: string | undefined;
      let languageCertUrl: string | undefined;
      try {
        if (idPhotoBase64) {
          const up = await postGuideUploadDoc({ content_base64: idPhotoBase64, filename: idPhotoFile.name });
          if (up.url) idPhotoUrl = up.url;
        }
        if (languageCertBase64 && languageCertFile) {
          const up = await postGuideUploadDoc({
            content_base64: languageCertBase64,
            filename: languageCertFile.name,
          });
          if (up.url) languageCertUrl = up.url;
        }
      } catch {
        /* 上传失败仍写入字段名，引导用户在 /guide/register 重选 */
      }
      const pending = {
        realName: realName.trim(),
        idType: "passport",
        idNumber: idNumber.trim(),
        walletAddress: walletAddress.trim(),
        city: city.trim(),
        countryCode: countryCode.trim() || undefined,
        languages: languages.trim() || undefined,
        serviceTypes: serviceTypes.trim() || undefined,
        bio: bio.trim() || undefined,
        idPhotoName: idPhotoFile.name,
        languageCertName,
        idPhotoUrl,
        languageCertUrl,
      };
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(PENDING_GUIDE_KEY, JSON.stringify(pending));
      }
      setRealName("");
      setIdNumber("");
      setIdPhotoFile(null);
      setLanguageCertFile(null);
      await router.replace("/guide/register?step=1");
    } catch (err) {
      registerApiCatch(err, t, setError, "RegisterForm guideSubmit:");
    } finally {
      setLoading(false);
    }
  }

  const getErrorDisplay = (err: string | null): string | null => {
    if (!err) return null;
    const key = REGISTER_ERROR_KEYS[err];
    if (key) {
      if (err === "password_too_short") return t(key).replace("{{n}}", String(PASSWORD_MIN_LEN));
      return t(key);
    }
    return err;
  };

  const inputClass = authL5FieldClass(!!error);
  const textareaClass = TT_AUTH_L5_FORM.textarea;
  const labelClass = TT_AUTH_L5_FORM.label;

  const goBackFromStep = () => {
    router.push(resolveRegisterBackPath(searchParams.get("returnUrl"), registerType));
  };

  return {
    t,
    registerType,
    loginHref,
    email,
    setEmail,
    verificationCode,
    setVerificationCode,
    sendCodeBusy,
    sendCodeCooldown,
    devCodeHint,
    handleSendVerificationCode,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    nickname,
    setNickname,
    defaultWallet,
    setDefaultWallet,
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
    idPhotoFile,
    setIdPhotoFile,
    languageCertFile,
    setLanguageCertFile,
    agreePrivacy,
    setAgreePrivacy,
    error,
    loading,
    handleTravelerSubmit,
    handleGuideSubmit,
    getErrorDisplay,
    inputClass,
    textareaClass,
    labelClass,
    goBackFromStep,
    registerPageShellClass,
    referralPrefill,
    referralValidateState,
  };
}
