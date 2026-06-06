/**
 * **§8.2 · F-024** — Playwright **`request`**（与 **`guides_disputes_db_api_tests`** 同形）。
 * 入口：`f024-f025-f026-request.spec.ts`（侧载本文件）。
 *
 * - **F-024**：**`POST …/guides`** → **`POST …/stake`**（**`amount: "100"`**）→ **`GET /api/v1/guides?city=Shanghai`** **`items`** 含 **`guide.id`**（**B-GDE-003** / **MANUAL-P1** 窄口径 **E2E** 旁证；**真链质押**仍 **ISS-007**）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**。
 * **限流**：**GET** 与 **POST** 遇 **429** 时 **`playwright429Backoff`**（**`Idempotency-Key`** 与重试对齐）。
 */
import { test, expect } from "@playwright/test";

import { defaultApiBase } from "./helpers/apiSession";
import { newIdempotencyKey } from "./helpers/idempotencyKey";
import {
  requestGetExpectOkWith429Backoff,
  requestGetWith429Retry,
  requestPostExpectOkWith429Backoff,
  requestPostWith429Retry,
} from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

test.describe.serial("§8.2 F-024 — guides stake list", () => {
  test("F-024 · stake then GET guides list includes active guide", async ({ request }) => {
    await skipIfApiDown(request);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const guideEmail = `e2e-f024-g-${suffix}@traveltrust.test`;

    const regG = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF024G" },
    });
    expect(regG.ok()).toBeTruthy();
    const regGJ = (await regG.json()) as { status?: string; token?: string };
    expect(regGJ.status).toBe("ok");
    const tokenGuide = regGJ.token?.trim() ?? "";

    const gc = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/guides`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
        "Idempotency-Key": newIdempotencyKey(`f024-guides-${suffix}`),
      },
      data: {
        city: "Shanghai",
        country_code: "CN",
        languages: ["zh"],
        service_types: ["walking"],
        bio: "e2e-f024 stake list",
      },
    });
    expect(gc.ok(), `POST guides ${gc.status()}`).toBeTruthy();
    const gcJ = (await gc.json()) as { guide?: { id?: string } };
    const guideRowId = gcJ.guide?.id ?? "";
    expect(guideRowId.length).toBeGreaterThan(0);

    const stake = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/guides/${guideRowId}/stake`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenGuide}`,
          "Idempotency-Key": newIdempotencyKey(`f024-stake-${suffix}`),
        },
        data: { amount: "100" },
      },
    );
    expect(stake.ok(), `stake ${stake.status()}`).toBeTruthy();
    const sj = (await stake.json()) as { status?: string; guide_status?: string };
    expect(sj.status).toBe("ok");
    expect(sj.guide_status).toBe("active");

    const list = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/guides?city=Shanghai`,
    );
    expect(list.ok(), `GET guides ${list.status()}`).toBeTruthy();
    const lj = (await list.json()) as {
      status?: string;
      items?: Array<{ id?: string }>;
    };
    expect(lj.status).toBe("ok");
    const items = lj.items ?? [];
    expect(items.some((it) => it.id === guideRowId)).toBe(true);
  });

});
