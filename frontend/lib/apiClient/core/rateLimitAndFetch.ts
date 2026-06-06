/**
 * `fetch` 出口与 **429** / **`Retry-After`** / JSON 体 **`retry_after_*`** 退避（与后端 **①②③**、E2E 同源）。
 */

/** 统一 `fetch` 出口（SSR 与 onboarding 等模块共用；便于注入或观测）。 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}

/** 从 `parseResponse` 附带的 **`retryAfterSeconds`**（429 + `Retry-After` 头）读取秒数；无则 `null`。 */
export function getApiRetryAfterSeconds(e: unknown): number | null {
  if (!e || typeof e !== "object") return null;
  const rs = (e as { retryAfterSeconds?: unknown }).retryAfterSeconds;
  if (typeof rs !== "number" || !Number.isFinite(rs) || rs <= 0) return null;
  return rs;
}

/**
 * 从 API JSON 对象读取重试秒数：**`retry_after_sec`**（社区反刷 / 客户端 `merge429`）优先，否则 **`retry_after_seconds`**（全局限流体），与 **`throwUnlessApiOk`**、**`interpretCommunityWriteError`**、**①②③** 同源。
 */
export function coalesceRetryAfterSecondsFromJson(data: unknown): number | null {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const raRaw = d.retry_after_sec ?? d.retry_after_seconds;
  if (typeof raRaw !== "number" || !Number.isFinite(raRaw) || raRaw <= 0) return null;
  return Math.max(1, Math.floor(raRaw));
}

/** Playwright / 直连 HTTP 快照：429 后默认退避（头与 JSON 皆无时），与 **`bilateralEscrowE2e`** 历史一致。 */
export const RATE_LIMIT_HTTP_BACKOFF_DEFAULT_MS = 65_000;
/** 单次退避上限（毫秒），避免极端 **`Retry-After`** 拖死编排。 */
export const RATE_LIMIT_HTTP_BACKOFF_CAP_MS = 120_000;
/** 下限（毫秒），避免 0s 头导致立即重试风暴。 */
export const RATE_LIMIT_HTTP_BACKOFF_MIN_MS = 2_000;

/**
 * 由 **`Retry-After`** 头或响应体 JSON（**`coalesceRetryAfterSecondsFromJson`**）推算 **429** 后应 **`setTimeout`** 的毫秒数（**(sec+1)s** 粒度，与 E2E 订单写退避同源；**①②③** 与 **`parseResponse` · `attach429RetryAfterToError`** 语义对齐）。
 */
export function waitMsFromRateLimitHttpSnapshot(
  headers: Record<string, string>,
  bodyText: string,
  options?: { defaultMs?: number; capMs?: number; minMs?: number }
): number {
  const defaultMs = options?.defaultMs ?? RATE_LIMIT_HTTP_BACKOFF_DEFAULT_MS;
  const capMs = options?.capMs ?? RATE_LIMIT_HTTP_BACKOFF_CAP_MS;
  const minMs = options?.minMs ?? RATE_LIMIT_HTTP_BACKOFF_MIN_MS;
  const raRaw = headers["retry-after"] ?? headers["Retry-After"];
  if (raRaw != null && String(raRaw).trim() !== "") {
    const sec = Number.parseInt(String(raRaw).trim(), 10);
    if (Number.isFinite(sec) && sec > 0) {
      return Math.min(capMs, Math.max(minMs, (sec + 1) * 1000));
    }
  }
  try {
    const j = JSON.parse(bodyText) as unknown;
    const c = coalesceRetryAfterSecondsFromJson(j);
    if (c != null) return Math.min(capMs, Math.max(minMs, (c + 1) * 1000));
  } catch {
    /* 非 JSON 体 */
  }
  return defaultMs;
}

/** 社区 **`communityJsonBody`** 等与 **`parseResponse`** 同源：仅 **HTTP 429** 时读取 **`Retry-After`** 秒数（正整数）。 */
export function retryAfterSecondsFrom429Response(res: Response): number | null {
  if (res.status !== 429) return null;
  /** 单测 / 旧 polyfill 可能只 mock **`status`/`json`**；真 **`fetch` Response` 必有 **`Headers`**。缺头时返回 **`null`**，由 **`coalesceRetryAfterSecondsFromJson`** 读体。 */
  const headers = res.headers as Headers | null | undefined;
  if (headers == null || typeof headers.get !== "function") return null;
  const ra = headers.get("retry-after");
  if (ra == null || ra.trim() === "") return null;
  const sec = Number.parseInt(ra.trim(), 10);
  if (!Number.isFinite(sec) || sec <= 0) return null;
  return sec;
}

const TRANSIT_RETRY_STATUSES = new Set([408, 429, 502, 503, 504]);

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

/** GET 出口：408/429/502/503/504 与网络 flake 退避重试（与 `getMeta` / did-rank 同源 · ② staging P0）。 */
export async function fetchGetWithTransitRetry(
  url: string,
  init?: RequestInit,
  opts?: { attempts?: number; signal?: AbortSignal },
): Promise<Response> {
  const attempts = opts?.attempts ?? 4;
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await apiFetch(url, { ...init, signal: opts?.signal });
      if (opts?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (TRANSIT_RETRY_STATUSES.has(res.status) && attempt < attempts - 1) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (e) {
      if (isAbortError(e) || opts?.signal?.aborted) throw e;
      last = e;
      if (attempt < attempts - 1) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
    }
  }
  throw last;
}

/**
 * **HTTP 429**：优先 **`Retry-After`** 头；缺省时用 **`coalesceRetryAfterSecondsFromJson`**（**`retry_after_sec`** 优先于 **`retry_after_seconds`**），与 **①②③** 后端一致。
 */
export function attach429RetryAfterToError(
  err: Error,
  res: Response,
  body?: Record<string, unknown>
): Error {
  let sec = retryAfterSecondsFrom429Response(res);
  if (sec == null && res.status === 429 && body) {
    sec = coalesceRetryAfterSecondsFromJson(body);
  }
  if (sec == null) return err;
  (err as Error & { retryAfterSeconds?: number }).retryAfterSeconds = sec;
  return err;
}
