/**
 * 市场子站 **Provider / Acquisition** 打开创作台并等待 Portal 内表单根 id（与 **`MerchantShowcaseStudioModal`** /
 * **`AcquisitionCarryStudioModal`** 同源；全矩阵冷启下 **`scrollIntoViewIfNeeded` + 壳优先** 比裸点 + 全局 `#m-studio-title` 稳）。
 */
import { expect, type Locator, type Page } from "@playwright/test";

import {
  acquisitionCarryStudioShell,
  marketAcquisitionOpenStudioShell,
  marketProviderOpenStudioShell,
  merchantShowcaseStudioShell,
} from "./pageShells";

export async function openMerchantShowcaseStudioFromProviderRoot(
  page: Page,
  providerPageRoot: Locator,
): Promise<Locator> {
  const btn = marketProviderOpenStudioShell(providerPageRoot);
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  const studio = merchantShowcaseStudioShell(page);
  await expect(studio).toBeVisible({ timeout: 120_000 });
  await expect(studio.locator("#m-studio-title")).toBeVisible({ timeout: 60_000 });
  return studio;
}

export async function openAcquisitionCarryStudioFromAcquisitionRoot(
  page: Page,
  acquisitionPageRoot: Locator,
): Promise<Locator> {
  const btn = marketAcquisitionOpenStudioShell(acquisitionPageRoot);
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  const studio = acquisitionCarryStudioShell(page);
  await expect(studio).toBeVisible({ timeout: 120_000 });
  await expect(studio.locator("#a-studio-title")).toBeVisible({ timeout: 60_000 });
  return studio;
}
