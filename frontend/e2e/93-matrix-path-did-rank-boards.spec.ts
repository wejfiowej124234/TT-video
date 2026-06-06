/**
 * 93 矩阵 · DID 排行榜路径（**§4.3**）：**D-DID-001**（榜 API + `period`）· **D-DID-002**（竖脊 Tab：旅行者 / 向导 / 商家 / **旅行收购**）
 *
 * 证据：`evidence/GO_20260419/93-path-did-rank-boards-period/REAL_CHAIN_VERIFY.md`
 *
 * 与 **`93-path-register-order-mockpay-governance-read`**（冻结）及 **`93-path-community-feed-post-detail`** 正交；**不**依赖 `P3_CHAIN_OFF`。
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = (process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`).replace(/\/$/, "");

test.describe("93-matrix · DID rank API + board tabs (D-DID-001 / D-DID-002)", () => {
  test("GET travelers/guides/itineraries + /did-rank 脊签切换无 pageerror", async ({ page, request }) => {
    test.setTimeout(180_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    const period = "all";
    const r1 = await request.get(`${API_BASE}/api/v1/did-rank/travelers?period=${period}`);
    expect(r1.ok(), await r1.text()).toBeTruthy();
    const j1 = (await r1.json()) as { travelers?: unknown };
    expect(Array.isArray(j1.travelers)).toBeTruthy();

    const r2 = await request.get(
      `${API_BASE}/api/v1/did-rank/guides?period=${period}&sort=weighted`,
    );
    expect(r2.ok(), await r2.text()).toBeTruthy();
    const j2 = (await r2.json()) as { guides?: unknown };
    expect(Array.isArray(j2.guides)).toBeTruthy();

    const r3 = await request.get(`${API_BASE}/api/v1/did-rank/itineraries?period=${period}`);
    expect(r3.ok(), await r3.text()).toBeTruthy();
    const j3 = (await r3.json()) as { itineraries?: unknown };
    expect(Array.isArray(j3.itineraries)).toBeTruthy();

    const rPool = await request.get(`${API_BASE}/api/v1/did-rank/prize-pool`);
    expect(rPool.ok(), await rPool.text()).toBeTruthy();
    const jPool = (await rPool.json()) as { monthly_amount?: unknown; status?: string };
    expect(jPool.status).toBe("ok");
    expect(typeof jPool.monthly_amount).toBe("number");
    const jPoolFull = jPool as { source?: string; illustrative?: boolean };
    expect(["env", "governance_pool_db", "default"]).toContain(jPoolFull.source);

    const rT1 = await request.get(`${API_BASE}/api/v1/did-rank/travelers?period=${period}`);
    const rT2 = await request.get(`${API_BASE}/api/v1/did-rank/travelers?period=${period}`);
    expect(rT1.ok() && rT2.ok()).toBeTruthy();
    const t2 = (await rT2.json()) as {
      travelers?: Array<{ rank?: number; rank_delta?: number }>;
    };
    if ((t2.travelers?.length ?? 0) >= 1) {
      const hasDeltaField = t2.travelers?.some(
        (row) => row.rank_delta === undefined || typeof row.rank_delta === "number",
      );
      expect(hasDeltaField).toBe(true);
    }

    const rProv = await request.get(`${API_BASE}/api/v1/did-rank/providers?period=${period}`);
    expect(rProv.ok(), await rProv.text()).toBeTruthy();
    const jProv = (await rProv.json()) as {
      providers?: Array<{ rank?: number; rank_delta?: number; published_listings?: number }>;
      rank_basis?: string;
      owner_role_filter?: string;
    };
    expect(Array.isArray(jProv.providers)).toBeTruthy();
    expect(jProv.rank_basis).toBe("provider_fulfillment_orders_then_gross_then_published_listings_in_window");
    expect(jProv.owner_role_filter).toBe("provider");
    const rProv2 = await request.get(`${API_BASE}/api/v1/did-rank/providers?period=${period}`);
    expect(rProv2.ok()).toBeTruthy();
    const jProv2 = (await rProv2.json()) as typeof jProv;
    if ((jProv2.providers?.length ?? 0) >= 1) {
      expect(
        jProv2.providers?.some(
          (row) => row.rank_delta === undefined || typeof row.rank_delta === "number",
        ),
      ).toBe(true);
    }
    if ((jProv.providers?.length ?? 0) >= 1) {
      expect(typeof jProv.providers![0]?.published_listings).toBe("number");
    }

    const rAcq = await request.get(`${API_BASE}/api/v1/did-rank/acquisitions?period=${period}`);
    expect(rAcq.ok(), await rAcq.text()).toBeTruthy();
    const jAcq = (await rAcq.json()) as {
      acquisitions?: Array<{ published_listings?: number }>;
      rank_basis?: string;
      owner_role_filter?: string;
    };
    expect(Array.isArray(jAcq.acquisitions)).toBeTruthy();
    expect(jAcq.rank_basis).toBe("acquisition_fulfillment_orders_then_gross_then_published_listings_in_window");
    expect(jAcq.owner_role_filter).toBe("region_steward");
    if ((jAcq.acquisitions?.length ?? 0) >= 1) {
      expect(typeof jAcq.acquisitions![0]?.published_listings).toBe("number");
    }

    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto(`/did-rank?period=${period}`, { timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Ranking|排行榜/i })).toBeVisible({ timeout: 40_000 });

    const travelerTab = page.getByRole("tab", { name: /旅行者榜|Travelers/i });
    const guideTab = page.getByRole("tab", { name: /向导榜|Guides/i });
    const providerTab = page.getByRole("tab", { name: /商家榜|Merchants/i });
    const acquisitionTab = page.getByRole("tab", { name: /旅行收购|Travel acquisition/i });

    await expect(travelerTab).toBeVisible({ timeout: 25_000 });
    await expect(guideTab).toBeVisible();
    await expect(providerTab).toBeVisible();
    await expect(acquisitionTab).toBeVisible();

    await guideTab.click();
    await expect(page.locator("#did-rank-board-panel-guide")).toBeVisible({ timeout: 30_000 });
    expect(page.url()).toMatch(/board=guide/);

    await providerTab.click();
    await expect(page.locator("#did-rank-board-panel-provider")).toBeVisible({ timeout: 30_000 });
    expect(page.url()).toMatch(/board=provider/);
    await expect(
      page.getByRole("status").filter({ hasText: /排行 API 已连通|Ranking API connected/i }),
    ).toBeVisible({ timeout: 25_000 });

    await acquisitionTab.click();
    await expect(page.locator("#did-rank-board-panel-acquisition")).toBeVisible({ timeout: 30_000 });
    expect(page.url()).toMatch(/board=acquisition/);
    await expect(
      page.getByRole("status").filter({ hasText: /排行 API 已连通|Ranking API connected/i }),
    ).toBeVisible({ timeout: 25_000 });

    await travelerTab.click();
    await expect(page.locator("#did-rank-board-panel-traveler")).toBeVisible({ timeout: 30_000 });

    expect(pageErrors, `pageerror:\n${pageErrors.join("\n")}`).toEqual([]);
  });
});
