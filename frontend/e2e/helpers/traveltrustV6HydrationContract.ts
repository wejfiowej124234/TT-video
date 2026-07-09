/**
 * PI-1 · /traveltrust v6 state-driven hydration 契约（①）
 *
 * 读 render graph store 输出的 data-tt 态机闸（非 DOM 探针 · 非 reload/retry）：
 * 1. `data-tt-traveltrust-pulse-ready="1"` — router + L1 pulse graph committed
 * 2. `data-tt-traveltrust-page-brief-ready="1"` — page-brief store hydrated
 * 3. `data-tt-traveltrust-scroll-lock-ready="1"` — hash/hero scroll transition complete
 * 4. `data-tt-traveltrust-v6-hydration-complete="1"` — 全链 ready
 */
import { expect, type Page } from "@playwright/test";

import { traveltrustNetworkPageShell } from "./pageShells";
import { UI_CONTRACT_TIMEOUT_MS } from "./uiContractLayer";

/** 三段式 + complete（state attributes on network-page shell） */
export async function assertTraveltrustV6HydrationContract(
  page: Page,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? UI_CONTRACT_TIMEOUT_MS;
  const shell = traveltrustNetworkPageShell(page);

  await expect(shell).toHaveAttribute("data-tt-traveltrust-ia-version", "v6", { timeout: timeoutMs });
  await expect(shell).toHaveAttribute("data-tt-traveltrust-pulse-ready", "1", { timeout: timeoutMs });
  await expect(shell).toHaveAttribute("data-tt-traveltrust-page-brief-ready", "1", { timeout: timeoutMs });
  await expect(shell).toHaveAttribute("data-tt-traveltrust-scroll-lock-ready", "1", { timeout: timeoutMs });
  await expect(shell).toHaveAttribute("data-tt-traveltrust-v6-hydration-complete", "1", { timeout: timeoutMs });
  await expect(shell).toHaveAttribute("data-tt-traveltrust-v6-hydration-phase", "ready", { timeout: timeoutMs });
}
