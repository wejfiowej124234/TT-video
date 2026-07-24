import { mapApiReadError } from "@/lib/mapApiReadError";
import { ME_IDENTITIES_HUB_PATH } from "@/lib/me/meIdentitiesL5";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";
import { safeInternalReturnPath } from "@/lib/safeInternalReturnPath";
import { FILE_TOO_LARGE } from "./utils";

export type RegisterType = "traveler" | "guide" | "provider" | "steward" | "acquisition";

export function registerTypeFromRoleParam(role: string | null): RegisterType {
  const r = role?.trim().toLowerCase() ?? "";
  if (r === "guide") return "guide";
  if (r === "provider" || r === "merchant") return "provider";
  if (r === "steward" || r === "region_steward") return "steward";
  if (r === "acquisition") return "acquisition";
  return "traveler";
}

/** 注册页左上角「返回」：优先 `returnUrl`；身份申请流默认回 Hub；纯游客注册回首页。 */
export function resolveRegisterBackPath(
  returnUrlParam: string | null | undefined,
  registerType: RegisterType,
  opts?: { fromSettings?: boolean },
): string {
  if (opts?.fromSettings) {
    return ME_SETTINGS_HUB_PATH;
  }
  const trimmed = returnUrlParam?.trim();
  if (trimmed) {
    return safeInternalReturnPath(trimmed, ME_IDENTITIES_HUB_PATH);
  }
  if (registerType === "traveler") {
    return "/";
  }
  return ME_IDENTITIES_HUB_PATH;
}

export const REGISTER_ERROR_KEYS: Record<string, string> = {
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
  verification_code_required: "auth_register_error_verificationCodeRequired",
  verification_code_invalid: "auth_register_error_verificationCodeInvalid",
  verification_code_expired: "auth_register_error_verificationCodeExpired",
  verification_code_rate_limited: "auth_register_error_verificationCodeRateLimited",
  send_code_failed: "auth_register_error_sendCodeFailed",
  email_delivery_failed: "auth_register_error_emailDeliveryFailed",
  referral_code_invalid: "auth_register_error_referralCodeInvalid",
  referral_code_inactive: "auth_register_error_referralCodeInactive",
  referral_code_exhausted: "auth_register_error_referralCodeExhausted",
  referral_self_forbidden: "auth_register_error_referralSelfForbidden",
  referral_rate_limited: "auth_register_error_referralRateLimited",
  referral_code_required: "auth_register_error_referralCodeRequired",
};

/** 注册 POST / 前置步骤失败：统一映射为表单 `error` 码或已翻译兜底文案 */
export function registerApiCatch(
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
  else if (msg === "verification_code_required") setError("verification_code_required");
  else if (msg === "verification_code_invalid") setError("verification_code_invalid");
  else if (msg === "verification_code_expired") setError("verification_code_expired");
  else if (msg === "verification_code_rate_limited") setError("verification_code_rate_limited");
  else if (msg === FILE_TOO_LARGE) setError("file_too_large");
  else if (msg === "auth_db_persist_failed") setError("auth_db_persist_failed");
  else if (msg === "referral_code_invalid") setError("referral_code_invalid");
  else if (msg === "referral_code_inactive") setError("referral_code_inactive");
  else if (msg === "referral_code_exhausted") setError("referral_code_exhausted");
  else if (msg === "referral_self_forbidden") setError("referral_self_forbidden");
  else if (msg === "referral_rate_limited") setError("referral_rate_limited");
  else if (msg === "api_html_not_json" || msg === "api_invalid_json_body") {
    setError(mapApiReadError(err, t, "auth_register_error_registerFailed"));
  } else {
    if (typeof window !== "undefined") {
      console.error(logContext, err);
    }
    setError(mapApiReadError(err, t, "auth_register_error_registerFailed"));
  }
}
