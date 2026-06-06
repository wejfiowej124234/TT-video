/**
 * Node ESM 侧与 **`e2e/helpers/apiSession.ts`**（**`defaultApiBase()`** / **`defaultApiHealthUrl()`**）同公式，
 * 供 **`run-e2e-*.mjs`** **`curl`** 与 **`PLAYWRIGHT_API_BASE_URL` / `PLAYWRIGHT_API_HEALTH_URL`** 默认注入，避免与 Playwright / **`e2e/helpers/apiSession.ts`** 分叉。
 */

export function playwrightApiPort() {
  return process.env.PLAYWRIGHT_API_PORT ?? "8080";
}

export function defaultApiBaseUrl() {
  const port = playwrightApiPort();
  return (process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, "");
}

export function defaultApiHealthUrl() {
  const port = playwrightApiPort();
  return process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${port}/health`;
}

/** 与历史脚本一致：仅当 **`PLAYWRIGHT_API_HEALTH_URL`** 未设置时写入默认 **`/health`** URL。 */
export function ensurePlaywrightApiHealthEnv() {
  if (!process.env.PLAYWRIGHT_API_HEALTH_URL) {
    process.env.PLAYWRIGHT_API_HEALTH_URL = `http://127.0.0.1:${playwrightApiPort()}/health`;
  }
}

/** 仅当 **`PLAYWRIGHT_API_BASE_URL`** 未设置或空白时写入 **`http://127.0.0.1:${PLAYWRIGHT_API_PORT}`**（无尾 **`/`**）。 */
export function ensurePlaywrightApiBaseUrlEnv() {
  if (!(process.env.PLAYWRIGHT_API_BASE_URL ?? "").trim()) {
    process.env.PLAYWRIGHT_API_BASE_URL = `http://127.0.0.1:${playwrightApiPort()}`;
  }
}
