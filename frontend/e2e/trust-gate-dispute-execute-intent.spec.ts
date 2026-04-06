/**
 * 07 §5.1 + Phase 4 DApp + §5.6A / 130：已结案争议「执行裁决意向」POST 后
 * `mapIntentError` 与 i18n 一致。`window.ethereum` 由 e2e 注入；API 全程 mock。
 */
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  installInjectedEthereumMock,
  connectHeaderInjectedWallet,
} from "./helpers/injectedWallet";

const DISPUTE_ID = "77777777-7777-4777-8777-777777777777";
const ORDER_ID = "88888888-8888-4888-8888-888888888888";
const ARBITRATOR_USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ESCROW_ADDR = "0x1111111111111111111111111111111111111111";

type IntentScenario = "outbox_failed" | "trust_pending" | "rate_limit";

function installExecuteIntentMocks(page: Page, scenario: IntentScenario) {
  return page.route((url) => {
    try {
      const u = new URL(url);
      return u.pathname === "/meta" || u.pathname.startsWith("/api/v1/");
    } catch {
      return false;
    }
  }, async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (path === "/meta" && method === "GET") {
      return json({ status: "ok", note: "e2e-mock-execute-intent" });
    }

    if (path === "/api/v1/me" && method === "GET") {
      return json({
        status: "ok",
        user: {
          id: ARBITRATOR_USER_ID,
          email: "arb@traveltrust.test",
          role: "arbitrator",
        },
        guide: null,
        trust: {},
        stats: {},
      });
    }

    if (path === `/api/v1/disputes/${DISPUTE_ID}` && method === "GET") {
      return json({
        status: "ok",
        dispute: {
          id: DISPUTE_ID,
          order_id: ORDER_ID,
          status: "resolved",
          resolution_tx_hash: null,
          refund_ratio: 0.5,
          slash_guide: false,
          resolved_at: "2026-01-02T00:00:00.000Z",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      });
    }

    if (path === `/api/v1/orders/${ORDER_ID}` && method === "GET") {
      return json({
        status: "ok",
        order: {
          id: ORDER_ID,
          escrow_address: ESCROW_ADDR,
          state: "disputed",
          status: "disputed",
        },
      });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/evidence` && method === "GET") {
      return json({ status: "ok", items: [] });
    }

    if (path === `/api/v1/disputes/${DISPUTE_ID}/execute-resolution-intent` && method === "POST") {
      if (scenario === "outbox_failed") {
        return json({ status: "outbox_persist_failed", error: "outbox_persist_failed" }, 503);
      }
      if (scenario === "trust_pending") {
        return json(
          { error: "trust_verification_pending", message: "trust_verification_pending" },
          403
        );
      }
      if (scenario === "rate_limit") {
        return json({ error: "rate_limit_exceeded", message: "rate_limit_exceeded" }, 429);
      }
      return json({ status: "ok", note: "e2e-intent-ok" });
    }

    return route.continue();
  });
}

test.describe("争议执行裁决意向 mapIntentError（mock API + 注入钱包）", () => {
  test.beforeEach(async ({ page }) => {
    await installInjectedEthereumMock(page);
    await page.addInitScript((uid: string) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, ARBITRATOR_USER_ID);
  });

  test("POST execute-resolution-intent 503 outbox_persist_failed → escrow_intentOutboxFailed", async ({
    page,
  }) => {
    await installExecuteIntentMocks(page, "outbox_failed");
    await page.goto(`/disputes/${DISPUTE_ID}`);

    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });
    await connectHeaderInjectedWallet(page);

    const submit = page.getByRole("button", {
      name: /登记执行裁决意向|Register execute-resolution intent/i,
    });
    await expect(submit).toBeEnabled({ timeout: 30_000 });
    await submit.click();

    await expect(page.getByRole("alert")).toContainText(
      /意向暂存失败|Could not persist intent|retry/i
    );
  });

  test("POST execute-resolution-intent 403 trust_verification_pending → 信任提示", async ({
    page,
  }) => {
    await installExecuteIntentMocks(page, "trust_pending");
    await page.goto(`/disputes/${DISPUTE_ID}`);

    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });
    await connectHeaderInjectedWallet(page);

    const submit = page.getByRole("button", {
      name: /登记执行裁决意向|Register execute-resolution intent/i,
    });
    await expect(submit).toBeEnabled({ timeout: 30_000 });
    await submit.click();

    await expect(page.getByRole("alert")).toContainText(
      /身份核验仍在处理中|identity verification is still in progress/i
    );
  });

  test("POST execute-resolution-intent 429 rate_limit_exceeded → 限流提示", async ({ page }) => {
    await installExecuteIntentMocks(page, "rate_limit");
    await page.goto(`/disputes/${DISPUTE_ID}`);

    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });
    await connectHeaderInjectedWallet(page);

    const submit = page.getByRole("button", {
      name: /登记执行裁决意向|Register execute-resolution intent/i,
    });
    await expect(submit).toBeEnabled({ timeout: 30_000 });
    await submit.click();

    await expect(page.getByRole("alert")).toContainText(
      /请求过于频繁|Too many requests|try again/i
    );
  });
});
