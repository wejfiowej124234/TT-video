/**
 * Playwright `request` 直连 API 时 `/meta` 偶发 408/429/503（冷启动、复用进程、短时拥塞）。
 */
import type { APIRequestContext } from "@playwright/test";

export async function getMetaJsonWithRetry(
  request: APIRequestContext,
  url: string,
): Promise<unknown> {
  let last = "";
  for (let i = 0; i < 4; i++) {
    const r = await request.get(url);
    if (r.ok()) return r.json();
    const t = await r.text();
    last = `HTTP ${r.status()} ${t.slice(0, 200)}`;
    if (i < 3 && [408, 429, 503].includes(r.status())) {
      await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
      continue;
    }
    throw new Error(`GET ${url} failed: ${last}`);
  }
  throw new Error(`GET ${url} failed: ${last}`);
}

/** 任意 GET（如 `GET /api/v1/orders/:id`）在连跑时的 408/429/503 退避。 */
export async function getOkJsonWithRetry(
  request: APIRequestContext,
  url: string,
  options?: { headers?: Record<string, string> },
): Promise<unknown> {
  let last = "";
  for (let i = 0; i < 5; i++) {
    const r = await request.get(url, { headers: options?.headers });
    if (r.ok()) return r.json();
    const t = await r.text();
    last = `${r.status()} ${t.slice(0, 200)}`;
    if (i < 4 && [408, 429, 503].includes(r.status())) {
      await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
      continue;
    }
    throw new Error(`GET ${url} failed: ${last}`);
  }
  throw new Error(`GET ${url} failed: ${last}`);
}
