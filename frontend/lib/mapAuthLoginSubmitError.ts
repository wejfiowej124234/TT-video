import { mapApiReadError } from "./mapApiReadError";

/** 与 `mapAuthLoginSubmitError` 使用同一组码；用于控制台降噪（预期错密/门闸/DB 不写 error 级日志）。 */
export function isExpectedAuthLoginErrorMessage(msg: string): boolean {
  return (
    msg === "invalid_credentials" ||
    msg === "login_required" ||
    msg === "auth_db_persist_failed"
  );
}

/**
 * 登录 POST 失败：后端稳定 error 码 → 登录页专用文案（勿向用户展示裸码）。
 * 与 `apiClient/core` 抛出的 `Error.message` 对齐。
 */
export function mapAuthLoginSubmitError(err: unknown, t: (key: string) => string): string {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "invalid_credentials") return t("auth_login_error_invalidCredentials");
  if (msg === "login_required") return t("auth_login_error_testAccountHint");
  if (msg === "auth_db_persist_failed") return t("auth_login_error_dbUnavailable");
  return mapApiReadError(err, t, "auth_login_error_failed");
}
