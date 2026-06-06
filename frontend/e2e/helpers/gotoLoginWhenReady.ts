import type { Locator, Page } from "@playwright/test";

import { authRouteLoginShell } from "./pageShells";
import { e2eTransientRetrySettleMs, gotoSmoke, reloadSmoke } from "./smoke-nav";

/** Login 路由壳（与 `app/auth/login/page.tsx` 上 `data-tt-auth-route="login"` 对齐）。 */
export function loginRouteShell(page: Page): Locator {
  return authRouteLoginShell(page);
}

/**
 * 导航到 `/auth/login?...`，等待登录壳可见；首跳经 **`gotoSmoke`** 与矩阵/核心路径同源（瞬断重试），
 * 再最多四轮等待壳可见以覆盖冷编译 / Suspense 抖动；**`reload`** 前 **`e2eTransientRetrySettleMs`** settle（见 **`smoke-nav`**），避免紧循环假红。
 * @returns 供 `fill` / `click` 用的 `[data-tt-auth-route="login"]` 定位器
 */
export async function gotoLoginWhenReady(page: Page, loginHref: string): Promise<Locator> {
  /** 全量 chromium 矩阵（300+ 用例）下 Next dev 冷编译 / GC 长尾；与 `run-e2e-default` webServer 同机争用 CPU 时 120s 仍偶发瞬断假红。 */
  const gotoMs = 180_000;
  const shellMs = 120_000;
  for (let attempt = 0; attempt < 4; attempt++) {
    await gotoSmoke(page, loginHref, { waitUntil: "domcontentloaded", timeout: gotoMs });
    const shell = loginRouteShell(page);
    try {
      await shell.waitFor({ state: "visible", timeout: shellMs });
      return shell;
    } catch {
      if (attempt < 3) {
        await page.waitForTimeout(e2eTransientRetrySettleMs(attempt)).catch(() => {});
        await reloadSmoke(page).catch(() => {});
      }
    }
  }
  throw new Error("login page did not become ready");
}
