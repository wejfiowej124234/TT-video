/**
 * 07 §5.1（订单主链）+ §5.6A / 130 + 100（争议证据）：`/disputes/:id` 证据 POST 的 UI 文案与
 * `mapApiReadError` → `mapOrderWriteError`（53 附录 C）一致。全程 mock API。
 */
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const DISPUTE_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const TOURIST_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

type EvidenceScenario =
  | "evidence_trust_pending"
  | "evidence_rate_limit"
  | "evidence_db_failed"
  | "content_hash_not_hex";

function installDisputeEvidenceMocks(page: Page, scenario: EvidenceScenario) {
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
      return json({ status: "ok", note: "e2e-mock-dispute-evidence" });
    }

    if (path === "/api/v1/me" && method === "GET") {
      return json({
        status: "ok",
        user: { id: TOURIST_ID, email: "e2e@traveltrust.test", role: "tourist" },
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
          status: "pending",
          evidence_hashes: [],
          created_at: "2026-01-01T00:00:00.000Z",
        },
      });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/evidence` && method === "GET") {
      return json({ status: "ok", items: [] });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/evidence` && method === "POST") {
      if (scenario === "evidence_trust_pending") {
        return json(
          { error: "trust_verification_pending", message: "trust_verification_pending" },
          403
        );
      }
      if (scenario === "evidence_rate_limit") {
        return json(
          { error: "evidence_rate_limit_exceeded", message: "evidence_rate_limit_exceeded" },
          429
        );
      }
      if (scenario === "evidence_db_failed") {
        return json(
          { error: "evidence_db_persist_failed", message: "evidence_db_persist_failed" },
          503
        );
      }
      if (scenario === "content_hash_not_hex") {
        return json(
          { error: "content_hash_must_be_hex", message: "content_hash_must_be_hex" },
          400
        );
      }
      return json({ status: "ok", id: "e2e-ev-1" });
    }

    return route.continue();
  });
}

function evidenceSection(page: Page) {
  return page.locator("section").filter({
    has: page.getByRole("heading", { name: /证据|Evidence/i }),
  });
}

test.describe("争议详情页证据上传错误文案（mock API）", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);
  });

  test("POST evidence 403 trust_verification_pending → 信任提示", async ({ page }) => {
    await installDisputeEvidenceMocks(page, "evidence_trust_pending");
    await page.goto(`/disputes/${DISPUTE_ID}`);

    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });

    const section = evidenceSection(page);
    await section.getByPlaceholder(/content_hash|Enter content_hash/i).fill("deadbeef");
    await section.getByRole("button", { name: /上传|Upload/i }).click();

    await expect(section.locator("p.text-danger")).toContainText(
      /身份核验仍在处理中|identity verification is still in progress/i
    );
  });

  test("POST evidence 429 evidence_rate_limit_exceeded → 证据限流提示", async ({ page }) => {
    await installDisputeEvidenceMocks(page, "evidence_rate_limit");
    await page.goto(`/disputes/${DISPUTE_ID}`);

    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });

    const section = evidenceSection(page);
    await section.getByPlaceholder(/content_hash|Enter content_hash/i).fill("aa");
    await section.getByRole("button", { name: /上传|Upload/i }).click();

    await expect(section.locator("p.text-danger")).toContainText(
      /证据上传过于频繁|Too many evidence uploads|Please wait and try again/i
    );
  });

  test("POST evidence 503 evidence_db_persist_failed → 数据库不可用提示", async ({ page }) => {
    await installDisputeEvidenceMocks(page, "evidence_db_failed");
    await page.goto(`/disputes/${DISPUTE_ID}`);

    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });

    const section = evidenceSection(page);
    await section.getByPlaceholder(/content_hash|Enter content_hash/i).fill("ab");
    await section.getByRole("button", { name: /上传|Upload/i }).click();

    await expect(section.locator("p.text-danger")).toContainText(
      /证据暂未能写入数据库|Evidence could not be persisted|retry/i
    );
  });

  test("POST evidence 400 content_hash_must_be_hex → 十六进制校验提示", async ({ page }) => {
    await installDisputeEvidenceMocks(page, "content_hash_not_hex");
    await page.goto(`/disputes/${DISPUTE_ID}`);

    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });

    const section = evidenceSection(page);
    await section.getByPlaceholder(/content_hash|Enter content_hash/i).fill("not-hex!!!");
    await section.getByRole("button", { name: /上传|Upload/i }).click();

    await expect(section.locator("p.text-danger")).toContainText(
      /十六进制|hexadecimal/i
    );
  });
});
