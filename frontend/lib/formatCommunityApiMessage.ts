import { mapOrderWriteError } from "./mapOrderWriteError";
import { requestFailedHttpUserText } from "./requestFailedHttp";

/** 与 `mapOrderWriteError` 哨兵一致：仅用于判断是否命中链下/订单码表，勿作用户可见文案。 */
const CHAIN_OFF_LOOKUP_MISS = "zzzz_internal_chain_off_lookup_miss";

/** `request_failed_*` → 共用 HTTP 文案；再 `community_api_msg_*`；再链下/订单码表。 */
function resolveCommunityMessageCode(raw: string, t: (key: string) => string): string | null {
  const httpText = requestFailedHttpUserText(raw, t);
  if (httpText != null) return httpText;
  const ck = `community_api_msg_${raw}`;
  const cl = t(ck);
  if (cl !== ck) return cl;
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
  t: (key: string) => string,
  fallbackKey: string
): string {
  const c = (code ?? "").trim();
  if (!c) return t(fallbackKey);

  let mapped = resolveCommunityMessageCode(c, t);
  if (mapped != null) return mapped;
  if (/\s/.test(c)) {
    const norm = c.replace(/\s+/g, "_").toLowerCase();
    if (norm !== c) {
      mapped = resolveCommunityMessageCode(norm, t);
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

/**
 * `status: error` 时：合成顶栏文案 + 各字段已本地化文案（用于 aria / 输入旁展示）。
 */
export function interpretCommunityWriteError(
  data: unknown,
  t: (key: string) => string,
  fallbackKey: string
): { topMessage: string | null; fieldMessages: Record<string, string> } {
  const r = data as { status?: string; message?: string; error?: string } | null | undefined;
  if (r == null) return { topMessage: t(fallbackKey), fieldMessages: {} };
  if (r.status !== "error") return { topMessage: null, fieldMessages: {} };

  const fe = parseCommunityApiErrors(r);
  const fieldMessages: Record<string, string> = {};
  if (fe) {
    for (const [field, code] of Object.entries(fe)) {
      fieldMessages[field] = formatCommunityApiMessage(code, t, fallbackKey);
    }
  }

  const rootCode =
    typeof r.error === "string" && r.error.trim()
      ? r.error.trim()
      : typeof r.message === "string" && r.message.trim()
        ? r.message.trim()
        : "";

  let topMessage: string | null = null;
  if (rootCode) {
    topMessage = formatCommunityApiMessage(rootCode, t, fallbackKey);
  } else if (Object.keys(fieldMessages).length > 0) {
    topMessage = Object.values(fieldMessages)[0] ?? null;
  } else {
    topMessage = t(fallbackKey);
  }

  return { topMessage, fieldMessages };
}

/**
 * 关注/好友等「无表单字段」操作：从 JSON 合成一条 Toast 用已本地化文案。
 * `res == null`（网络或解析失败）时回退 `fallbackKey`。
 */
export function messageForCommunityActionResponse(
  res: unknown,
  t: (key: string) => string,
  fallbackKey: string
): string {
  if (res == null || typeof res !== "object") return t(fallbackKey);
  const r = res as { status?: string };
  if (r.status === "error") {
    const { topMessage } = interpretCommunityWriteError(res, t, fallbackKey);
    return topMessage ?? t(fallbackKey);
  }
  return t(fallbackKey);
}
