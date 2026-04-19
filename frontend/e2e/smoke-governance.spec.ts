/**
 * 治理子链烟雾：自 **`smoke.spec.ts`** 拆分（**TT-L4-SMOKE-SLOWFILE-PERF-001** · 降单文件时长；`gotoSmoke` 与断言不变）。
 */
import { test, expect } from "@playwright/test";
import { gotoSmoke } from "./helpers/smoke-nav";

/** 07 §5.2A / 13-1：`GovernanceTargetNotice` 默认 zh；en 构建含 placeholders 等词 */
const GOV_TARGET_NOTICE = /文档镜像|API 占位|placeholders|documentation mirrors|Protocol parameters|协议参数/i;

test("治理页可访问", async ({ page }) => {
  await gotoSmoke(page, "/governance");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Governance|治理/i })).toBeVisible({ timeout: 35_000 });
  await expect(page.getByRole("heading", { level: 1, name: /Governance|治理/i })).toBeVisible({ timeout: 35_000 });
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible({
    timeout: 40_000,
  });
});

test("向导质押页可访问", async ({ page }) => {
  await gotoSmoke(page, "/staking");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Guide staking|向导质押/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Guide staking|向导质押/i })).toBeVisible();
});

test("治理提案页可访问", async ({ page }) => {
  await gotoSmoke(page, "/governance/proposals");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Proposals|提案/i })).toBeVisible({ timeout: 35_000 });
  await expect(page.getByRole("heading", { level: 1, name: /Proposals|提案/i })).toBeVisible({ timeout: 35_000 });
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible({
    timeout: 40_000,
  });
});

test("治理提案详情页可访问（B-072 种子 id）", async ({ page }) => {
  await gotoSmoke(page, "/governance/proposals/00000000-0000-4000-8000-000000000001");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Proposal detail|提案详情/i })).toBeVisible({
    timeout: 25_000,
  });
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible({
    timeout: 40_000,
  });
});

test("治理投票委托页可访问（B-073）", async ({ page }) => {
  await gotoSmoke(page, "/governance/delegate");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Vote delegation|投票委托/i })).toBeVisible({
    timeout: 25_000,
  });
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible({
    timeout: 40_000,
  });
});

test("治理参数页可访问", async ({ page }) => {
  await gotoSmoke(page, "/governance/params");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Parameters|参数/i })).toBeVisible({ timeout: 35_000 });
  await expect(page.getByRole("heading", { level: 1, name: /Parameters|参数/i })).toBeVisible({ timeout: 35_000 });
  await expect(
    page.getByRole("heading", { level: 2, name: /Parameter reconcile|参数对拍/i }),
  ).toBeVisible({ timeout: 35_000 });
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible({
    timeout: 40_000,
  });
});

test("治理费用路由页可访问", async ({ page }) => {
  await gotoSmoke(page, "/governance/fee-routes");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Fee routes|费用路由/i })).toBeVisible({ timeout: 35_000 });
  await expect(page.getByRole("heading", { level: 1, name: /Fee routes|费用路由/i })).toBeVisible({
    timeout: 35_000,
  });
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible({
    timeout: 40_000,
  });
});

test("治理国家桶转出页可访问（vault-forwards）", async ({ page }) => {
  await gotoSmoke(page, "/governance/vault-forwards");
  await expect(page.locator("body")).toBeVisible();
  await expect(
    page.getByRole("main", { name: /Vault forwards|国家桶转出/i }),
  ).toBeVisible({ timeout: 35_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: /Vault forwards|国家桶转出/i }),
  ).toBeVisible({ timeout: 35_000 });
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible({
    timeout: 40_000,
  });
});
