"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { postRegister, applyClientSessionAfterAuth } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { PENDING_GUIDE_KEY } from "@/lib/constants";
import { PASSWORD_MIN_LEN, MAX_FILE_SIZE } from "./constants";
import { registerPageShellClass } from "./registerBackgrounds";
import RegisterPageBackdrop from "./RegisterPageBackdrop";
import { isValidWalletAddress, fileToBase64, FILE_TOO_LARGE } from "./utils";
import RegisterTouristForm from "./RegisterTouristForm";
import RegisterGuideForm from "./RegisterGuideForm";
import AuthShellCrossNav from "@/components/auth/AuthShellCrossNav";
import { AuthFullBleedSearchParamsSuspense } from "@/components/auth/AuthSearchParamsSuspense";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import { safeInternalReturnPath } from "@/lib/safeInternalReturnPath";

type RegisterType = "traveler" | "guide" | "provider" | "steward";

function registerTypeFromRoleParam(role: string | null): RegisterType {
  const r = role?.trim().toLowerCase() ?? "";
  if (r === "guide") return "guide";
  if (r === "provider") return "provider";
  if (r === "steward" || r === "region_steward") return "steward";
  return "traveler";
}

const ERROR_KEYS: Record<string, string> = {
  email_required: "auth_register_error_emailRequired",
  password_required: "auth_register_error_passwordRequired",
  password_confirm_required: "auth_register_error_passwordConfirmRequired",
  password_too_short: "auth_register_error_passwordTooShort",
  password_mismatch: "auth_register_error_passwordMismatch",
  wallet_invalid: "auth_register_error_walletInvalid",
  required: "auth_register_error_required",
  id_photo: "auth_register_error_idPhoto",
  wallet_address: "auth_register_error_walletAddress",
  agree_privacy: "auth_register_error_agreePrivacy",
  invalid_email: "auth_register_error_invalidEmail",
  password_too_long: "auth_register_error_passwordTooLong",
  email_already_registered: "auth_register_error_emailRegistered",
  invalid_registration_role: "auth_register_error_invalidRegistrationRole",
  register_failed: "auth_register_error_registerFailed",
  file_too_large: "auth_register_fileTooBig",
  auth_db_persist_failed: "auth_register_error_authDbUnavailable",
};

/** 注册 POST / 前置步骤失败：统一映射为表单 `error` 码或已翻译兜底文案 */
function registerApiCatch(
  err: unknown,
  t: (key: string) => string,
  setError: (v: string) => void,
  logContext: string
) {
  const msg = err instanceof Error ? err.message : "register_failed";
  if (msg === "invalid_email") setError("invalid_email");
  else if (msg === "password_too_short") setError("password_too_short");
  else if (msg === "password_too_long") setError("password_too_long");
  else if (msg === "email_already_registered") setError("email_already_registered");
  else if (msg === "invalid_registration_role") setError("invalid_registration_role");
  else if (msg === FILE_TOO_LARGE) setError("file_too_large");
  else if (msg === "auth_db_persist_failed") setError("auth_db_persist_failed");
  else if (msg === "api_html_not_json" || msg === "api_invalid_json_body") {
    // 已映射为可读的运维提示，勿作未预期异常打 console（仍由表单展示）
    setError(mapApiReadError(err, t, "auth_register_error_registerFailed"));
  } else {
    if (typeof window !== "undefined") {
      console.error(logContext, err);
    }
    setError(mapApiReadError(err, t, "auth_register_error_registerFailed"));
  }
}

function RegisterPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  /** 须用稳定原始值作 effect 依赖：`searchParams` 对象引用可能每帧变，会导致重复 setState、极端时白屏 */
  const roleParam = searchParams.get("role");
  const [registerType, setRegisterType] = useState<RegisterType>("traveler");

  const [email, setEmail] = useState("");
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

  useEffect(() => {
    setRegisterType(registerTypeFromRoleParam(roleParam));
  }, [roleParam]);

  async function handleTravelerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const emailTrim = email.trim();
    if (!emailTrim) {
      setError("email_required");
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
      const roleOpt =
        registerType === "provider"
          ? { role: "provider" as const }
          : registerType === "steward"
            ? { role: "region_steward" as const }
            : {};
      const res = await postRegister({
        email: emailTrim,
        password,
        nickname: nickname || undefined,
        default_wallet_address: walletTrim && isValidWalletAddress(walletTrim) ? walletTrim : undefined,
        ...roleOpt,
      });
      const uid = applyClientSessionAfterAuth(res);
      if (!uid) {
        setError("register_failed");
        return;
      }
      const next = safeInternalReturnPath(searchParams.get("returnUrl"), "/community/me");
      // 成功后会离开本页；勿 `router.refresh()`，否则会刷新当前 `/auth/register` 的 RSC，易重挂载并清空表单。
      await router.replace(next);
    } catch (err) {
      registerApiCatch(err, t, setError, "RegisterForm submit:");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuideSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const emailTrim = email.trim();
    if (!emailTrim) {
      setError("email_required");
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
      const res = await postRegister({ email: emailTrim, password, nickname: nickname || undefined });
      const uid = applyClientSessionAfterAuth(res);
      if (!uid) {
        setError("register_failed");
        return;
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
        idPhotoBase64,
        idPhotoName: idPhotoFile.name,
        languageCertBase64,
        languageCertName,
      };
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(PENDING_GUIDE_KEY, JSON.stringify(pending));
      }
      setRealName("");
      setIdNumber("");
      setIdPhotoFile(null);
      setLanguageCertFile(null);
      await router.replace("/guide/register");
    } catch (err) {
      registerApiCatch(err, t, setError, "RegisterForm guideSubmit:");
    } finally {
      setLoading(false);
    }
  }

  const getErrorDisplay = (err: string | null): string | null => {
    if (!err) return null;
    const key = ERROR_KEYS[err];
    if (key) {
      if (err === "password_too_short") return t(key).replace("{{n}}", String(PASSWORD_MIN_LEN));
      return t(key);
    }
    return err;
  };

  const inputClass = `w-full min-h-[44px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console text-small ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const textareaClass = `w-full min-h-[80px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-ink-800 bg-bg-console text-small ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const labelClass = "block text-meta text-ink-600 mb-0.5";

  const goBackFromStep = () => {
    router.push("/");
  };

  if (registerType === "traveler") {
    return (
      <RegisterTouristForm
        mainClassName={registerPageShellClass()}
        backdropKind="traveler"
        email={email}
        setEmail={setEmail}
        nickname={nickname}
        setNickname={setNickname}
        password={password}
        setPassword={setPassword}
        passwordConfirm={passwordConfirm}
        setPasswordConfirm={setPasswordConfirm}
        defaultWallet={defaultWallet}
        setDefaultWallet={setDefaultWallet}
        error={error}
        loading={loading}
        onBack={goBackFromStep}
        onSubmit={handleTravelerSubmit}
        getErrorDisplay={getErrorDisplay}
        t={t}
        inputClass={inputClass}
        labelClass={labelClass}
      />
    );
  }

  if (registerType === "provider") {
    return (
      <RegisterTouristForm
        mainClassName={registerPageShellClass()}
        backdropKind="provider"
        headingKey="auth_register_provider"
        bannerKey="auth_register_providerBanner"
        email={email}
        setEmail={setEmail}
        nickname={nickname}
        setNickname={setNickname}
        password={password}
        setPassword={setPassword}
        passwordConfirm={passwordConfirm}
        setPasswordConfirm={setPasswordConfirm}
        defaultWallet={defaultWallet}
        setDefaultWallet={setDefaultWallet}
        error={error}
        loading={loading}
        onBack={goBackFromStep}
        onSubmit={handleTravelerSubmit}
        getErrorDisplay={getErrorDisplay}
        t={t}
        inputClass={inputClass}
        labelClass={labelClass}
      />
    );
  }

  if (registerType === "steward") {
    return (
      <RegisterTouristForm
        mainClassName={registerPageShellClass()}
        backdropKind="steward"
        headingKey="auth_register_steward"
        bannerKey="auth_register_stewardBanner"
        email={email}
        setEmail={setEmail}
        nickname={nickname}
        setNickname={setNickname}
        password={password}
        setPassword={setPassword}
        passwordConfirm={passwordConfirm}
        setPasswordConfirm={setPasswordConfirm}
        defaultWallet={defaultWallet}
        setDefaultWallet={setDefaultWallet}
        error={error}
        loading={loading}
        onBack={goBackFromStep}
        onSubmit={handleTravelerSubmit}
        getErrorDisplay={getErrorDisplay}
        t={t}
        inputClass={inputClass}
        labelClass={labelClass}
      />
    );
  }

  return (
    <RegisterGuideForm
      mainClassName={registerPageShellClass("guideForm")}
      backdropKind="guide"
      email={email}
      setEmail={setEmail}
      nickname={nickname}
      setNickname={setNickname}
      password={password}
      setPassword={setPassword}
      passwordConfirm={passwordConfirm}
      setPasswordConfirm={setPasswordConfirm}
      realName={realName}
      setRealName={setRealName}
      idNumber={idNumber}
      setIdNumber={setIdNumber}
      walletAddress={walletAddress}
      setWalletAddress={setWalletAddress}
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
      idPhotoFile={idPhotoFile}
      setIdPhotoFile={setIdPhotoFile}
      languageCertFile={languageCertFile}
      setLanguageCertFile={setLanguageCertFile}
      agreePrivacy={agreePrivacy}
      setAgreePrivacy={setAgreePrivacy}
      error={error}
      loading={loading}
      onBack={goBackFromStep}
      onSubmit={handleGuideSubmit}
      getErrorDisplay={getErrorDisplay}
      t={t}
      inputClass={inputClass}
      textareaClass={textareaClass}
      labelClass={labelClass}
    />
  );
}

export default function RegisterPage() {
  return (
    <AuthFullBleedSearchParamsSuspense mainAriaLabelKey="auth_register_title" variant="register">
      <RegisterPageInner />
    </AuthFullBleedSearchParamsSuspense>
  );
}
