/**
 * P0 spine · request-trigger + response-assert（先挂 request/response 监听，再 reload 触发，再断言 200）。
 * 替代被动 `waitForResponse` 漏捕首屏 in-flight 的模式。
 */
import { expect, type Page } from "@playwright/test";

import {
  hydrateBearerSessionAccepted,
  gotoWithBearerSession,
  type BearerSessionCredentials,
} from "./apiSession";
import { expectUiShellVisible, UI_CONTRACT_TIMEOUT_MS } from "./uiContractLayer";
import type { Locator } from "@playwright/test";

export type P0BrowserGetContract = {
  /** 规范化 pathname，如 `/api/v1/orders` 或 `/api/v1/guides/{id}` */
  pathname: string;
};

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, "");
}

function matchesPathname(url: string, pathname: string): boolean {
  try {
    return normalizePathname(new URL(url).pathname) === normalizePathname(pathname);
  } catch {
    return false;
  }
}

/** 单次 reload 触发并断言一组 GET 200（request + response 双断言）。 */
export async function assertReloadTriggersBrowserGets200(
  page: Page,
  pathnames: string[],
  timeoutMs = 120_000,
): Promise<void> {
  const normalized = pathnames.map(normalizePathname);

  const runReloadAssert = async (attemptTimeout: number) => {
    const pairs = normalized.map((pathname) => {
      const requestWait = page.waitForRequest(
        (req) => req.method() === "GET" && matchesPathname(req.url(), pathname),
        { timeout: attemptTimeout },
      );
      const responseWait = page.waitForResponse(
        (res) =>
          res.request().method() === "GET" &&
          res.status() === 200 &&
          matchesPathname(res.url(), pathname),
        { timeout: attemptTimeout },
      );
      return Promise.all([requestWait, responseWait]);
    });
    await page.reload({ waitUntil: "domcontentloaded", timeout: attemptTimeout });
    const results = await Promise.all(pairs);
    for (const [req, res] of results) {
      expect(res.status()).toBe(200);
      expect(req.method()).toBe("GET");
    }
  };

  try {
    await runReloadAssert(timeoutMs);
  } catch (firstErr) {
    if (process.env.PLAYWRIGHT_SITE10_SEQUENTIAL === "1") {
      await page.waitForTimeout(1_500);
      try {
        await runReloadAssert(Math.min(timeoutMs, 90_000));
        return;
      } catch {
        /* fall through */
      }
    }
    throw firstErr;
  }
}

function isChromeErrorUrl(url: string): boolean {
  return /^chrome-error:/i.test(url);
}

/** Phase 3：客户端 redirect 后 URL 稳定（`/me/identities` · `/me/settings/profile` 等）。 */
async function waitForClientRedirectUrl(
  page: Page,
  pattern: RegExp,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let chromeErrorRetries = 0;
  while (Date.now() < deadline) {
    const current = page.url();
    if (isChromeErrorUrl(current)) {
      if (process.env.PLAYWRIGHT_SITE10_SEQUENTIAL === "1" && chromeErrorRetries < 2) {
        chromeErrorRetries += 1;
        await page.waitForTimeout(800);
        try {
          await page.reload({ waitUntil: "domcontentloaded", timeout: Math.min(30_000, deadline - Date.now()) });
        } catch {
          /* fall through */
        }
        continue;
      }
      throw new Error(`browser_chrome_error_during_redirect: ${current}`);
    }
    if (pattern.test(current)) return;

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    try {
      await page.waitForURL(pattern, {
        timeout: Math.min(8_000, remaining),
        waitUntil: "domcontentloaded",
      });
      const after = page.url();
      if (isChromeErrorUrl(after)) {
        throw new Error(`browser_chrome_error_during_redirect: ${after}`);
      }
      if (pattern.test(after)) return;
    } catch (err) {
      if (err instanceof Error && err.message.includes("browser_chrome_error")) {
        throw err;
      }
      await page.waitForTimeout(400);
    }
  }
  throw new Error(`client_redirect_url_timeout: last=${page.url()}`);
}

/**
 * P0 · 客户端 redirect 路由三段式：session hydrate → navigate → URL stabilize。
 * 不在 redirect 中途 `reload`；API 契约仍由 reload-trigger GET 200 收尾。
 */
export async function gotoBearerSessionWithClientRedirectContract(
  page: Page,
  path: string,
  creds: BearerSessionCredentials,
  options: {
    urlAfter: RegExp;
    shell?: Locator;
    apiPathnames?: string[];
    /** Phase 1 水合用稳定页（默认 `/community`） */
    hydratePath?: string;
    timeoutMs?: number;
  },
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? UI_CONTRACT_TIMEOUT_MS;
  const hydratePath = options.hydratePath ?? "/community";
  const apiPathnames = options.apiPathnames ?? [];

  await gotoWithBearerSession(page, hydratePath, creds);
  await hydrateBearerSessionAccepted(page, creds, timeoutMs);

  await gotoWithBearerSession(page, path, creds);
  await waitForClientRedirectUrl(page, options.urlAfter, timeoutMs);

  if (options.shell) {
    await expectUiShellVisible(options.shell, timeoutMs);
  }
  if (apiPathnames.length > 0) {
    await assertReloadTriggersBrowserGets200(page, apiPathnames, Math.max(timeoutMs, 120_000));
  }
  if (options.shell) {
    await expectUiShellVisible(options.shell, timeoutMs);
  }
}

export async function gotoBearerSessionWithShellAndApiContracts(
  page: Page,
  path: string,
  creds: BearerSessionCredentials,
  options: {
    shell?: Locator;
    urlAfter?: RegExp;
    apiPathnames: string[];
    ensureSession?: boolean;
    timeoutMs?: number;
  },
): Promise<void> {
  if (options.urlAfter) {
    await gotoBearerSessionWithClientRedirectContract(page, path, creds, {
      urlAfter: options.urlAfter,
      shell: options.shell,
      apiPathnames: options.apiPathnames,
      timeoutMs: options.timeoutMs,
    });
    return;
  }

  const timeoutMs = options.timeoutMs ?? 90_000;
  await gotoWithBearerSession(page, path, creds);
  if (options.ensureSession !== false) {
    await hydrateBearerSessionAccepted(page, creds, timeoutMs);
  }
  if (options.shell) {
    await expectUiShellVisible(options.shell, timeoutMs);
  }
  if (options.apiPathnames.length > 0) {
    await assertReloadTriggersBrowserGets200(page, options.apiPathnames, Math.max(timeoutMs, 120_000));
  } else if (options.ensureSession !== false) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: timeoutMs });
  }
  if (options.shell) {
    await expectUiShellVisible(options.shell, timeoutMs);
  }
}
