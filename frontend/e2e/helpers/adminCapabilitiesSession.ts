import { expect, type Page } from "@playwright/test";

import {
  injectBearerSessionInPage,
  type BearerSessionCredentials,
} from "./apiSession";

/** 等 Admin 能力条真值就绪（与 `useAdminCapabilities` / capability strip 同源）。 */
export async function waitForAdminCapabilitiesReady(
  page: Page,
  session: BearerSessionCredentials,
  timeoutMs = 90_000,
): Promise<void> {
  const token = session.token.trim();
  if (!token) throw new Error("admin_capabilities_session_missing_token");

  await injectBearerSessionInPage(page, session);
  await page.evaluate(() => {
    try {
      sessionStorage.removeItem("traveltrust_dev_api_offline_v1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
  });

  const pathOk = (url: string) => {
    try {
      return new URL(url).pathname.replace(/\/+$/, "") === "/api/v1/admin/capabilities";
    } catch {
      return false;
    }
  };

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const slice = Math.min(12_000, deadline - Date.now());
    if (slice <= 0) break;
    try {
      const res = await page.waitForResponse(
        (r) => r.request().method() === "GET" && pathOk(r.url()),
        { timeout: slice },
      );
      if (res.status() === 200) {
        await expect(page.locator('[data-tt-admin-capability-strip="1"]')).toHaveAttribute(
          "data-tt-admin-capabilities-loaded",
          "1",
          { timeout: 15_000 },
        );
        return;
      }
    } catch {
      /* continue */
    }

    const retry = page.locator('[data-tt-admin-capability-strip="1"] button');
    if (await retry.isVisible().catch(() => false)) {
      await retry.click().catch(() => null);
    }

    const probeOk = await page.evaluate(async (tok) => {
      try {
        const r = await fetch("/api/v1/admin/capabilities", {
          headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
        });
        return r.status === 200;
      } catch {
        return false;
      }
    }, token);
    if (probeOk) {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
      });
      await expect(page.locator('[data-tt-admin-capability-strip="1"]')).toHaveAttribute(
        "data-tt-admin-capabilities-loaded",
        "1",
        { timeout: 15_000 },
      );
      return;
    }

    await page.waitForTimeout(400);
  }

  throw new Error("admin_capabilities_not_ready");
}
