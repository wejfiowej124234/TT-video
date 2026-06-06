import { coalesceRetryAfterSecondsFromJson, fetchGetWithTransitRetry } from "./rateLimitAndFetch";

/** 根级 `status` 表示成功语义（与 `throwUnlessApiOk` 的「须抛错」集合不同；例如 intents 202 常为 `accepted`） */
const ENVELOPE_ROOT_STATUS_SUCCESS = new Set<string>(["ok", "accepted"]);

/**
 * `status === "error"` 但属于本地常见配置缺口 / UI 已提示的场景：不占用 `console.error`（Next 开发态易当红屏噪声），仍 `console.debug` 便于勾选 Verbose 排障。
 * 与 **`crates/api`** 社区媒体 multipart / upload-media 错误码对齐。
 */
const ENVELOPE_ERROR_CODES_LOG_DEBUG_ONLY = new Set<string>([
  "community_media_object_storage_not_configured",
  "community_video_base64_disabled_use_multipart",
  "community_video_requires_object_storage_multipart",
]);

function envelopeRootErrorCode(d: Record<string, unknown>): string | null {
  const err = d.error;
  const msg = d.message;
  if (typeof err === "string" && err.trim()) return err.trim();
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  return null;
}

/** 判断是否为 API 返回的风控/合规类错误（便于 UI 高亮展示） */
export function isComplianceError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("403") || /风控|合规限制/i.test(msg);
}

/**
 * HTTP 已成功但 JSON 根级含 `status` 且不为 `ok` 时打控制台（13-1：仅供排障，勿直接展示给用户）。
 */
export function logApiJsonStatusNotOk(context: string, data: unknown): void {
  if (typeof window === "undefined" || data == null || typeof data !== "object") return;
  const d = data as Record<string, unknown>;
  const status = d.status;
  if (status === undefined || status === null) return;
  if (typeof status === "string" && ENVELOPE_ROOT_STATUS_SUCCESS.has(status)) return;

  const code = envelopeRootErrorCode(d);
  if (code != null && ENVELOPE_ERROR_CODES_LOG_DEBUG_ONLY.has(code)) {
    console.debug(`${context} API envelope (${code}):`, data);
    return;
  }

  console.error(`${context} API status not ok:`, data);
}

/**
 * `parseResponse` 在 HTTP 2xx 时仍可能返回根级 `status !== "ok"` 的 JSON；调用方在 `.catch` 里用 mapApiReadError 前须先抛错。
 * 若根对象**无**自有属性 `status`（如部分 auth 仅返回 `user_id`/`token`），则视为非 envelope 响应，不抛错。
 */
export function throwUnlessApiOk(data: unknown, fallbackCode = "unknown"): void {
  if (data == null || typeof data !== "object") {
    throw new Error(fallbackCode);
  }
  const d = data as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(d, "status")) return;
  if (typeof d.status === "string" && ENVELOPE_ROOT_STATUS_SUCCESS.has(d.status)) return;
  const err = d.error;
  const msg = d.message;
  const code =
    typeof err === "string" && err.trim()
      ? err.trim()
      : typeof msg === "string" && msg.trim()
        ? msg.trim()
        : fallbackCode;
  const e = new Error(code) as Error & { retryAfterSeconds?: number };
  const ra = coalesceRetryAfterSecondsFromJson(d);
  if (ra != null) e.retryAfterSeconds = ra;
  throw e;
}

/**
 * `fetch` + 安全 `json()`（失败为 `{}`）+ `logApiJsonStatusNotOk`；页面层与 `adminFetchJson` 共用（07 / 13-1）。
 * HTTP **2xx** 时对 body 调用 **`throwUnlessApiOk`**（与 `parseResponse` 读路径一致）；非 2xx 不抛 envelope，便于调用方读 `body` + `interpretCommunityWriteError` 等。
 */
export async function fetchJsonWithApiStatusLog<T>(
  context: string,
  input: string | URL,
  init?: RequestInit
): Promise<{ res: Response; body: T }> {
  const res = await fetchGetWithTransitRetry(String(input), init);
  const body = (await res.json().catch(() => ({}))) as T;
  if (!(context === "AdminCapabilities" && !res.ok)) {
    logApiJsonStatusNotOk(context, body);
  }
  if (res.ok) throwUnlessApiOk(body);
  return { res, body };
}
