import { expect, type Page } from "@playwright/test";

import {
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
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
        await expect(
          page.locator(
            '[data-tt-admin-capability-strip="1"][data-tt-admin-capabilities-loaded="1"]',
          ),
        ).toHaveCount(1, { timeout: 15_000 });
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
      // 裸 fetch 200 时 React capabilities hook 可能尚未提交；刷新对齐 session + provider。
      await page.reload({ waitUntil: "domcontentloaded" });
      await injectBearerSessionInPage(page, session);
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
      });
      continue;
    }

    await page.waitForTimeout(400);
  }

  throw new Error("admin_capabilities_not_ready");
}

/**
 * Admin Shell 浏览器审计同源入口：Bearer 预注入 → `/me` 200 → capabilities 就绪 → Shell Bar 可见。
 * 须本机 FE `rewrites` 指向 staging API（`API_REWRITE_TARGET`）或 staging FE 同源部署。
 */
export async function gotoWithAdminShellSessionReady(
  page: Page,
  path: string,
  session: BearerSessionCredentials,
  timeoutMs = 120_000,
): Promise<void> {
  const token = session.token.trim();
  if (!token) throw new Error("admin_shell_session_missing_token");

  await gotoWithBearerSession(page, path, session);
  await ensureCommunityBrowserSessionAccepted(page, session, timeoutMs);
  // 能力条可被 SuperAdmin 健康路径抑制；ADM-U01 Shell 审计以 shell-bar + db-role 为就绪 SSOT。
  try {
    await waitForAdminCapabilitiesReady(page, session, Math.min(timeoutMs, 45_000));
  } catch {
    await injectBearerSessionInPage(page, session);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await injectBearerSessionInPage(page, session);
  }
  await expect(page.locator('[data-tt-admin-shell-bar="1"]')).toBeVisible({ timeout: timeoutMs });
}
