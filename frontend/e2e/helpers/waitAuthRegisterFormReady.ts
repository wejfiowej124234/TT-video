import { expect, type Page } from "@playwright/test";

/**
 * `/auth/register`：`AuthFullBleedSearchParamsSuspense` 先渲染 `search_params_suspense`，
 * 内层 hydrate 后才出现 `register_form_shell` / `register_form_fields`。
 * 稳定性脚本会删 `.next`，冷编译时壳出现可能 **>60s**。
 */
export async function waitAuthRegisterFormReady(
  page: Page,
  opts?: { shellTimeoutMs?: number; innerTimeoutMs?: number },
): Promise<{
  regShell: ReturnType<Page["locator"]>;
  regFields: ReturnType<Page["locator"]>;
}> {
  const shellTimeout = opts?.shellTimeoutMs ?? 120_000;
  const innerTimeout = opts?.innerTimeoutMs ?? 45_000;
  const regShell = page.locator('[data-tt-auth-surface="register_form_shell"]');
  await expect(regShell).toBeVisible({ timeout: shellTimeout });
  await expect(regShell.locator("h1")).toBeVisible({ timeout: innerTimeout });
  const regFields = page.locator('[data-tt-auth-surface="register_form_fields"]');
  await expect(regFields).toBeVisible({ timeout: innerTimeout });
  return { regShell, regFields };
}
