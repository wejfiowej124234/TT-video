/**
 * Playwright `request` 显式超时 + 请求/响应日志与失败快照（禁止无限等待 · site10 F-021 hang 收口）。
 */
import type { APIRequestContext, APIResponse } from "@playwright/test";

export const E2E_API_REQUEST_TIMEOUT_MS = 60_000;

export type ApiRequestSnapshot = {
  method: string;
  url: string;
  status?: number;
  bodyPreview?: string;
  error?: string;
};

function previewBody(text: string, max = 500): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function failSnapshot(log: ApiRequestSnapshot): never {
  throw new Error(`bounded_api_request_failed:\n${JSON.stringify(log, null, 2)}`);
}

async function readResponsePreview(response: APIResponse): Promise<string> {
  try {
    return previewBody(await response.text());
  } catch {
    return "(body unreadable)";
  }
}

export async function boundedApiGet(
  request: APIRequestContext,
  url: string,
  options?: { headers?: Record<string, string>; timeoutMs?: number },
): Promise<{ response: APIResponse; log: ApiRequestSnapshot }> {
  const log: ApiRequestSnapshot = { method: "GET", url };
  const timeoutMs = options?.timeoutMs ?? E2E_API_REQUEST_TIMEOUT_MS;
  try {
    const response = await request.get(url, { headers: options?.headers, timeout: timeoutMs });
    log.status = response.status();
    log.bodyPreview = await readResponsePreview(response);
    console.log(`[e2e-api] GET ${response.status()} ${url}`);
    if (!response.ok()) {
      console.error("[e2e-api] GET non-OK snapshot", log);
    }
    return { response, log };
  } catch (err) {
    log.error = err instanceof Error ? err.message : String(err);
    console.error("[e2e-api] GET error snapshot", log);
    failSnapshot(log);
  }
}

export async function boundedApiPost(
  request: APIRequestContext,
  url: string,
  options: {
    headers?: Record<string, string>;
    data?: unknown;
    timeoutMs?: number;
  },
): Promise<{ response: APIResponse; log: ApiRequestSnapshot }> {
  const log: ApiRequestSnapshot = { method: "POST", url };
  const timeoutMs = options.timeoutMs ?? E2E_API_REQUEST_TIMEOUT_MS;
  try {
    const response = await request.post(url, {
      headers: options.headers,
      data: options.data,
      timeout: timeoutMs,
    });
    log.status = response.status();
    log.bodyPreview = await readResponsePreview(response);
    console.log(`[e2e-api] POST ${response.status()} ${url}`);
    if (!response.ok()) {
      console.error("[e2e-api] POST non-OK snapshot", log);
    }
    return { response, log };
  } catch (err) {
    log.error = err instanceof Error ? err.message : String(err);
    console.error("[e2e-api] POST error snapshot", log);
    failSnapshot(log);
  }
}
