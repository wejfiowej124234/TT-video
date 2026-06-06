import {
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  COMMUNITY_POST_TAGS_MAX_COUNT,
} from "./apiClient/community";
import { coalesceRetryAfterSecondsFromJson } from "./apiClient/core/rateLimitAndFetch";
import { applyLocalePlaceholders, type LocaleInterpolationVars } from "./i18n";
import { mapOrderWriteError } from "./mapOrderWriteError";
import { requestFailedHttpUserText } from "./requestFailedHttp";

/** 与 `mapOrderWriteError` 哨兵一致：仅用于判断是否命中链下/订单码表，勿作用户可见文案。 */
const CHAIN_OFF_LOOKUP_MISS = "zzzz_internal_chain_off_lookup_miss";

export type CommunityTranslateFn = (
  key: string,
  vars?: LocaleInterpolationVars,
) => string;

function asEnvelope(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

function toTranslateFn(t: CommunityTranslateFn | ((key: string) => string)): CommunityTranslateFn {
  if (t.length >= 2) return t as CommunityTranslateFn;
  return (key, vars) => {
    const raw = (t as (key: string) => string)(key);
    return vars ? applyLocalePlaceholders(raw, vars) : raw;
  };
}

function interpolationVarsForCode(
  code: string,
  envelope: Record<string, unknown> | null,
): LocaleInterpolationVars | undefined {
  const c = code.trim();
  if (c === "tag_too_long") return { max: COMMUNITY_FEED_TAG_QUERY_MAX_LEN };
  if (c === "tags_too_many") return { max: COMMUNITY_POST_TAGS_MAX_COUNT };
  if (c === "file_too_large") {
    const raw = envelope?.max_bytes;
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      const mb = raw / (1024 * 1024);
      return { max_mb: mb >= 0.1 ? mb.toFixed(1) : mb.toFixed(2) };
    }
  }
  if (c === "video_too_long") {
    const raw = envelope?.max_duration_sec;
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      return { max_sec: raw };
    }
  }
  return undefined;
}

function localeKeyForCode(code: string, envelope: Record<string, unknown> | null): string {
  if (code === "file_too_large" && interpolationVarsForCode(code, envelope)?.max_mb != null) {
    return "community_api_msg_file_too_large_with_limit";
  }
  if (code === "video_too_long" && interpolationVarsForCode(code, envelope)?.max_sec != null) {
    return "community_api_msg_video_too_long_with_limit";
  }
  return `community_api_msg_${code}`;
}

/** `request_failed_*` → 共用 HTTP 文案；再 `community_api_msg_*`；再链下/订单码表。 */
function resolveCommunityMessageCode(
  raw: string,
  t: CommunityTranslateFn,
  envelope: Record<string, unknown> | null,
): string | null {
  const httpText = requestFailedHttpUserText(raw, t);
  if (httpText != null) return httpText;

  const ck = localeKeyForCode(raw, envelope);
  const vars = interpolationVarsForCode(raw, envelope);
  const cl = t(ck, vars);
  if (cl !== ck) return cl;

  const genericCk = `community_api_msg_${raw}`;
  if (genericCk !== ck) {
    const gcl = t(genericCk, vars);
    if (gcl !== genericCk) return gcl;
  }

  const m = mapOrderWriteError(new Error(raw), t, { fallbackKey: CHAIN_OFF_LOOKUP_MISS });
  return m !== t(CHAIN_OFF_LOOKUP_MISS) ? m : null;
}

/**
 * 社区 API 返回的 `message` 机器可读键（如 empty_body）→ 文案；未知键回退为短读法。
 * 31-还有哪些要优化 §二：字段/业务错误与 a11y 旁注共用。
 * 与 `crates/api/src/routes/community.rs` 中 `status:error` 的 **`error` / `message`（同键）** 及可选 `errors` 对齐；根级码解析顺序与 **`throwUnlessApiOk`** 一致（先 **`error`** 再 **`message`**）。优先 `community_api_msg_*`，再链下共用码表（`mapOrderWriteError`）。
 */
export function formatCommunityApiMessage(
  code: string | undefined | null,
  t: CommunityTranslateFn | ((key: string) => string),
  fallbackKey: string,
  envelope?: unknown,
): string {
  const env = asEnvelope(envelope);
  const tFn = toTranslateFn(t);
  const c = (code ?? "").trim();
  if (!c) return tFn(fallbackKey);

  let mapped = resolveCommunityMessageCode(c, tFn, env);
  if (mapped != null) return mapped;
  if (/\s/.test(c)) {
    const norm = c.replace(/\s+/g, "_").toLowerCase();
    if (norm !== c) {
      mapped = resolveCommunityMessageCode(norm, tFn, env);
      if (mapped != null) return mapped;
    }
  }

  return c.replace(/_/g, " ");
}

/** 解析 JSON 体中的 `errors`：`{ "body": "empty_body" }` → 字段 → 机器键 */
export function parseCommunityApiErrors(data: unknown): Record<string, string> | null {
  if (!data || typeof data !== "object") return null;
  const raw = (data as { errors?: unknown }).errors;
  if (!raw || typeof raw !== "object") return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return Object.keys(out).length > 0 ? out : null;
}

function appendRetryAfterSuffix(
  message: string,
  envelope: Record<string, unknown> | null,
  t: CommunityTranslateFn | ((key: string) => string),
): string {
  const sec = envelope ? coalesceRetryAfterSecondsFromJson(envelope) : null;
  if (sec == null) return message;
  const tFn = toTranslateFn(t);
  const suffixKey = "community_api_msg_retry_after_suffix";
  const suffix = tFn(suffixKey, { sec });
  if (suffix === suffixKey) return message;
  return `${message} ${suffix}`;
}

/**
 * `status: error` 时：合成顶栏文案 + 各字段已本地化文案（用于 aria / 输入旁展示）。
 */
export function interpretCommunityWriteError(
  data: unknown,
  t: CommunityTranslateFn | ((key: string) => string),
  fallbackKey: string,
): { topMessage: string | null; fieldMessages: Record<string, string> } {
  const envelope = asEnvelope(data);
  if (data == null) return { topMessage: toTranslateFn(t)(fallbackKey), fieldMessages: {} };
  if (envelope?.status !== "error") return { topMessage: null, fieldMessages: {} };

  const fe = parseCommunityApiErrors(data);
  const fieldMessages: Record<string, string> = {};
  if (fe) {
    for (const [field, code] of Object.entries(fe)) {
      fieldMessages[field] = formatCommunityApiMessage(code, t, fallbackKey, data);
    }
  }

  const rootCode =
    typeof envelope.error === "string" && envelope.error.trim()
      ? envelope.error.trim()
      : typeof envelope.message === "string" && envelope.message.trim()
        ? envelope.message.trim()
        : "";

  let topMessage: string | null = null;
  if (rootCode) {
    topMessage = formatCommunityApiMessage(rootCode, t, fallbackKey, data);
  } else if (Object.keys(fieldMessages).length > 0) {
    topMessage = Object.values(fieldMessages)[0] ?? null;
  } else {
    topMessage = toTranslateFn(t)(fallbackKey);
  }

  if (topMessage) {
    topMessage = appendRetryAfterSuffix(topMessage, envelope, t);
  }

  return { topMessage, fieldMessages };
}

/**
 * 关注/好友等「无表单字段」操作：从 JSON 合成一条 Toast 用已本地化文案。
 * `res == null`（网络或解析失败）时回退 `fallbackKey`。
 */
export function messageForCommunityActionResponse(
  res: unknown,
  t: CommunityTranslateFn | ((key: string) => string),
  fallbackKey: string,
): string {
  if (res == null || typeof res !== "object") return toTranslateFn(t)(fallbackKey);
  const r = res as { status?: string };
  if (r.status === "error") {
    const { topMessage } = interpretCommunityWriteError(res, t, fallbackKey);
    return topMessage ?? toTranslateFn(t)(fallbackKey);
  }
  return toTranslateFn(t)(fallbackKey);
}
