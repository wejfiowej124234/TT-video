/**
 * PH1-FE-02 封面上传子集（独立跑，避免与 multipart 长测串行失败拖死整包）。
 * 并集：`npm run e2e:pi1-community-all`（2026-05-30 与 PH1-FE-01～05 一并 **8 passed · ①**）。
 * 运行：`npm run e2e:pi1-community-cover`
 */

import { join } from "node:path";

import { test, expect } from "@playwright/test";

import {

  apiLoginReturnCredentials,

  seedTestAccountsAndReleaseGuideSlot,

} from "./helpers/apiSession";

import { communityLoginForPublishShell, communityPublishDrawerShell } from "./helpers/pageShells";

import {

  openCommunityPublishDrawer,

  waitForPublishDrawerVideoTypeEnabled,

} from "./helpers/publishDrawerVideo";

import { requestGetWith429Retry } from "./helpers/playwright429Backoff";

import { skipIfApiDown } from "./helpers/skipIfApiDown";

import { API_BASE, E2E_PNG_1X1 } from "./market-subsite-shared";



test.describe("PI-1 · video cover pick (PH1-FE-02 cover)", () => {

  test.beforeEach(async ({ request }) => {

    await skipIfApiDown(request);

    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);

  });



  test("cover file pick shows preview in PublishDrawer", async ({ page, request }) => {

    test.setTimeout(180_000);

    const capRes = await requestGetWith429Retry(request, `${API_BASE}/api/v1/community/media/capabilities`);

    const cap = capRes.ok() ? ((await capRes.json()) as { public_video_publish_ready?: boolean }) : {};

    test.skip(!cap.public_video_publish_ready, "needs MinIO");



    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");

    expect(cred).toBeTruthy();

    if (!cred) return;



    const drawer = await openCommunityPublishDrawer(page, cred, 120_000);

    await expect(communityLoginForPublishShell(page)).toHaveCount(0);

    const ls = await page.evaluate(() => ({

      tokenLen: (localStorage.getItem("traveltrust_session_token") ?? "").length,

    }));

    expect(ls.tokenLen, "tourist bearer must be in localStorage").toBeGreaterThan(0);



    await waitForPublishDrawerVideoTypeEnabled(page, drawer, 120_000);

    await drawer.getByRole("button", { name: /^(Video|视频)$/ }).click();

    await expect(drawer.getByText(/MP4|WebM|秒|multipart|分片|MB/i).first()).toBeVisible({

      timeout: 60_000,

    });



    const mp4Path = join(process.cwd(), "e2e", "fixtures", "minimal-1s-h264.mp4");

    await drawer.locator('input[type="file"][accept*="video"]').setInputFiles(mp4Path);

    await expect(drawer.locator("video")).toBeVisible({ timeout: 90_000 });



    await drawer.locator('input[type="file"][accept*="image"]').setInputFiles({

      name: "pi1-cover.png",

      mimeType: "image/png",

      buffer: E2E_PNG_1X1,

    });

    await expect(drawer.getByAltText(/Video poster preview|视频封面预览/i)).toBeVisible({

      timeout: 30_000,

    });

  });

});


