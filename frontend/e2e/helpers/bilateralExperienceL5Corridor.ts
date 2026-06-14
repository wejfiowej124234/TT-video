/**
 * ① Escrow 双边确认体验 L5 · 双角色 UI 走廊断言
 */
import { expect, type Page } from "@playwright/test";

import { clickBilateralConfirmCta } from "./bilateralEscrowE2e";

export const bilateralWaitingOtherRe =
  /你已确认，等待对方确认|You have confirmed — waiting for the other party/i;
export const bilateralBothConfirmedRe =
  /双方已确认行程与金额|Both parties have confirmed itinerary and amount/i;
export const confirmFinalPlanBtnRe = /确认最终行程|Confirm Final Plan/i;
export const confirmReadyHintRe =
  /行程与报价已就绪|Itinerary and quote are ready/i;

export function bilateralExperienceSection(page: Page) {
  return page.locator('[data-tt-bilateral-experience-l5="1"]').first();
}

export async function expectBilateralAggregateStatus(
  page: Page,
  status: "pending_self" | "waiting_other" | "both_confirmed",
): Promise<void> {
  const zone = page.locator('[data-zone="order-protocol"]');
  await expect(zone).toBeVisible({ timeout: 120_000 });
  const section = bilateralExperienceSection(page);
  await section.scrollIntoViewIfNeeded().catch(() => {});
  await expect
    .poll(
      async () => {
        const visible = await section.isVisible().catch(() => false);
        if (!visible) return null;
        const attr = await section.getAttribute("data-tt-bilateral-status");
        if (attr === status) return attr;
        const banner = section.locator('[data-tt-bilateral-status-banner="1"]');
        if (status === "waiting_other" && (await banner.isVisible().catch(() => false))) {
          return "waiting_other";
        }
        if (status === "both_confirmed" && (await banner.isVisible().catch(() => false))) {
          const text = (await banner.textContent().catch(() => "")) ?? "";
          if (/双方已确认|Both parties have confirmed/i.test(text)) return "both_confirmed";
        }
        return attr;
      },
      { timeout: 120_000, message: `bilateral aggregate status → ${status}` },
    )
    .toBe(status);
}

export async function clickBilateralConfirmInExperience(page: Page): Promise<void> {
  const section = bilateralExperienceSection(page);
  const confirmReq = page.waitForResponse(
    (res) =>
      res.url().includes("/confirm-bilateral") &&
      res.request().method() === "POST" &&
      res.ok(),
    { timeout: 120_000 },
  );
  await clickBilateralConfirmCta(page);
  const confirmRes = await confirmReq;
  expect(confirmRes.ok(), `confirm-bilateral failed: ${confirmRes.status()}`).toBeTruthy();
  await expect
    .poll(
      async () => {
        if (!(await section.isVisible().catch(() => false))) return null;
        return section.getAttribute("data-tt-bilateral-status");
      },
      { timeout: 45_000, message: "bilateral status after confirm POST" },
    )
    .not.toBe("pending_self");
}

export async function expectConfirmFinalPlanGateOpen(page: Page): Promise<void> {
  const zone = page.locator('[data-zone="order-protocol"]');
  await expect(zone).toBeVisible({ timeout: 90_000 });
  const btn = zone.getByRole("button", { name: confirmFinalPlanBtnRe });
  await expect(btn).toBeVisible({ timeout: 45_000 });
  await expect(btn).toBeEnabled({ timeout: 30_000 });
  await expect(page.getByText(confirmReadyHintRe).first()).toBeVisible({ timeout: 30_000 });
}
