/**
 * FRCA · 五角色退出 UI 烟测（浏览器 leg）
 * 驱动：scripts/dev/run-five-role-full-chain-audit.sh（FRCA_BROWSER=1）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { apiLoginReturnCredentials } from "./helpers/apiSession";
import { gotoWithHeaderNavSessionReady } from "./helpers/accountNavSession";
import { uiLogout } from "./helpers/headerUserMenu";
import { stagingUatSeedAndLogin } from "./helpers/stagingUatAuth";

type Gap = {
  id: string;
  role: string;
  category: string;
  priority: "P1" | "P2";
  title: string;
  observation: string;
  human_impact: string;
};

const gaps: Gap[] = [];

function frcaGate(): boolean {
  return process.env.FRCA_BROWSER === "1" && Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());
}

function outDir(): string {
  return (process.env.FRCA_OUT?.trim() || "evidence/five-role-full-chain-audit/latest").replace(/\\/g, "/");
}

function recordGap(gap: Gap): void {
  gaps.push(gap);
}

(frcaGate() ? test.describe : test.describe.skip)("FRCA · logout browser", () => {
  test.setTimeout(180_000);

  test.afterAll(() => {
    const dir = outDir();
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "frca-browser-gaps.json");
    writeFileSync(path, JSON.stringify({ gaps, recorded_at: new Date().toISOString() }, null, 2));
  });

  test("旅行者 · Header 退出确认 → 访客态", async ({ page, request }) => {
    const api = process.env.PLAYWRIGHT_API_BASE_URL || "https://tt-api-staging.fly.dev";
    await stagingUatSeedAndLogin(request, api);
    const creds = await apiLoginReturnCredentials(request, api, "tourist@test.com", "Test123!");
    if (!creds?.token) throw new Error("login failed");

    try {
      await gotoWithHeaderNavSessionReady(page, "/community", creds, 90_000);
      await uiLogout(page);
      // 产品设计：logout 后 router.push('/')，顶栏用户菜单应消失
      await expect(page.locator('[data-tt-header-user-menu="1"]')).toHaveCount(0, { timeout: 15_000 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      recordGap({
        id: "FRCA-GAP-001",
        role: "旅行者",
        category: msg.includes("community_session") ? "状态机断裂" : "错误提示缺失",
        priority: "P1",
        title: "顶栏退出 UI 链失败",
        observation: msg.slice(0, 240),
        human_impact: "真人可能无法在 community 完成 Header 退出闭环",
      });
      throw err;
    }
  });
});
