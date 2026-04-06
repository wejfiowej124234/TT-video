/**
 * 前端占位 `Error.message === \`request_failed_${status}\``（如 adminFetchJson 非 2xx 且无 JSON `error` 时）的粗粒度语义桶。
 */

export type RequestFailedHttpBucket =
  | "login_required"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "invalid_request"
  | "not_implemented"
  | "server_error"
  | "rate_limited";

export function requestFailedHttpBucket(msg: string): RequestFailedHttpBucket | null {
  const m = /^request_failed_(\d+)$/.exec(msg);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  if (!Number.isFinite(n)) return null;
  if (n === 401) return "login_required";
  if (n === 403) return "forbidden";
  if (n === 404) return "not_found";
  if (n === 409) return "conflict";
  if (n === 422) return "invalid_request";
  if (n === 429) return "rate_limited";
  if (n === 501) return "not_implemented";
  if (n === 408 || (n >= 500 && n <= 599)) return "server_error";
  if (n >= 400 && n < 500) return "invalid_request";
  return null;
}

/** 订单 / 托管意向等读路径与 `mapOrderWriteError` 共用的 `request_failed_*` → i18n（非占位则返回 null）。 */
export function requestFailedHttpUserText(msg: string, t: (key: string) => string): string | null {
  const http = requestFailedHttpBucket(msg);
  if (http == null) return null;
  switch (http) {
    case "login_required":
      return t("order_error_login_required");
    case "forbidden":
      return t("order_error_forbidden");
    case "not_found":
      return t("common_apiHttpNotFound");
    case "conflict":
      return t("common_apiHttpConflict");
    case "invalid_request":
      return t("common_apiHttpInvalid");
    case "not_implemented":
      return t("common_apiNotImplemented");
    case "server_error":
      return t("common_apiHttpServer");
    case "rate_limited":
      return t("common_apiRateLimitExceeded");
  }
}
