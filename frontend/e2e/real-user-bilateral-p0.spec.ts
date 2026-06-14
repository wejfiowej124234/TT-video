/**
 * REAL-USER-BILATERAL-P0
 * ① local · 真实用户账号 · 隔离重放双边确认（非全链 sprint）
 * 1) API：双方 POST /confirm-bilateral → 200
 * 2) UI：data-tt-bilateral-experience-l5 双角色 L5（复用 base · 第二向导档期）
 */
import { test } from "@playwright/test";

import {
  assertBothConfirmBilateralApi200,
  runRealUserBilateralUiBothSides,
  seedRealUserBilateralBaseViaApi,
  seedRealUserOrderAwaitingBilateralViaApi,
  type RealUserBilateralBaseContext,
  type RealUserBilateralOrderContext,
} from "./helpers/realUserBilateralP0Corridor";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

const skipApiSegment = process.env.REAL_USER_BILATERAL_P0_UI_ONLY === "1";
const skipUiSegment = process.env.REAL_USER_BILATERAL_P0_API_ONLY === "1";

test.describe("REAL-USER-BILATERAL-P0 @real-user-bilateral-p0", () => {
  test.describe.configure({ mode: "serial" });

  let sharedBase: RealUserBilateralBaseContext;
  let uiOrderCtx: RealUserBilateralOrderContext;

  test.beforeAll(async ({ request }) => {
    test.setTimeout(480_000);
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }
    sharedBase = await seedRealUserBilateralBaseViaApi(request, API_BASE);
  });

  test("API · tourist + guide POST /confirm-bilateral → 200", async ({ request }) => {
    test.setTimeout(480_000);
    test.skip(skipApiSegment, "REAL_USER_BILATERAL_P0_UI_ONLY=1");

    const apiOrderCtx = await test.step("seed order A · pending_bilateral (API)", async () =>
      seedRealUserOrderAwaitingBilateralViaApi(request, API_BASE, sharedBase),
    );

    await test.step("API · both sides confirm-bilateral 200", async () => {
      await assertBothConfirmBilateralApi200(request, API_BASE, apiOrderCtx);
    });
  });

  test("UI · bilateral both sides · data-tt-bilateral-experience-l5", async ({ page, request }) => {
    test.setTimeout(480_000);
    test.skip(skipUiSegment, "REAL_USER_BILATERAL_P0_API_ONLY=1");

    uiOrderCtx = await test.step("seed order B · pending_bilateral (UI replay · guideUi)", async () =>
      seedRealUserOrderAwaitingBilateralViaApi(request, API_BASE, sharedBase, {
        guideRowId: sharedBase.guideUiRowId,
        guideCredsForAccept: sharedBase.guideUiCreds,
      }),
    );

    await test.step("UI · dual-role bilateral L5 corridor", async () => {
      await runRealUserBilateralUiBothSides(page, uiOrderCtx);
    });
  });
});
