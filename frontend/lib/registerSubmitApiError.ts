import { mapApiReadError } from "./mapApiReadError";

/** 须与 `app/auth/register/utils.ts` 的 `FILE_TOO_LARGE` 保持一致 */
const REGISTER_FILE_TOO_LARGE_MESSAGE = "FILE_TOO_LARGE";

export type RegisterSubmitApiClassify =
  | { kind: "form_code"; code: string }
  | { kind: "message"; message: string; logAsUnexpected: boolean };

/**
 * 注册 `postRegister` 等失败：`apiClient` 抛出的 `Error.message` → 表单 `error` 状态（内部码或已翻译句）。
 * 与 `app/auth/register/page.tsx` 的 `registerApiCatch` 行为对齐，便于单测。
 */
export function classifyRegisterSubmitApiError(
  err: unknown,
  t: (key: string, opts?: { n?: number }) => string
): RegisterSubmitApiClassify {
  const msg = err instanceof Error ? err.message : "register_failed";
  if (msg === "invalid_email") return { kind: "form_code", code: "invalid_email" };
  if (msg === "password_too_short") return { kind: "form_code", code: "password_too_short" };
  if (msg === "password_too_long") return { kind: "form_code", code: "password_too_long" };
  if (msg === "email_already_registered") return { kind: "form_code", code: "email_already_registered" };
  if (msg === "invalid_registration_role") return { kind: "form_code", code: "invalid_registration_role" };
  if (msg === REGISTER_FILE_TOO_LARGE_MESSAGE) return { kind: "form_code", code: "file_too_large" };
  if (msg === "auth_db_persist_failed") return { kind: "form_code", code: "auth_db_persist_failed" };
  if (msg === "rate_limit_exceeded" || msg === "critical_write_rate_limit_exceeded")
    return { kind: "form_code", code: "rate_limited" };
  if (msg === "login_required") return { kind: "form_code", code: "register_session_required" };
  if (msg === "api_html_not_json" || msg === "api_invalid_json_body") {
    return {
      kind: "message",
      message: mapApiReadError(err, t, "auth_register_error_registerFailed"),
      logAsUnexpected: false,
    };
  }
  return {
    kind: "message",
    message: mapApiReadError(err, t, "auth_register_error_registerFailed"),
    logAsUnexpected: true,
  };
}
