/**
 * Epic F-08：真实路径（normal-release）— 仅 chain_off REST，不 `page.route` mock `/api/v1/*`。
 * 与 [Epic-F-real-path-adr.md](../../docs/runbook/Epic-F-real-path-adr.md) 一致：本地 API + 测试账号。
 *
 * CI：默认跳过（`CI=true` 且未设 `RUN_EPIC_F_E2E_REAL_PATH=1`）。
 * 本地无栈：`PLAYWRIGHT_SKIP_EPIC_F_REAL_PATH=1` 跳过。
 *
 * API 须 `SEED_TEST_ACCOUNTS=1`、`P3_CHAIN_OFF=1`（mock-pay 门禁），见 ladder F-08。
 */
import { test, expect, type APIRequestContext } from "@playwright/test";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";
import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const apiBase = (
  process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8080"
).replace(/\/$/, "");

const skipLocal = process.env.PLAYWRIGHT_SKIP_EPIC_F_REAL_PATH === "1";
const skipCiDefault =
  process.env.CI === "true" && process.env.RUN_EPIC_F_E2E_REAL_PATH !== "1";

async function login(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${apiBase}/auth/login`, {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });
  expect(
    res.ok(),
    `login ${email} failed: ${res.status()} ${await res.text()}`
  ).toBeTruthy();
  const body = (await res.json()) as { token?: string };
  expect(body.token, "login response missing token").toBeTruthy();
  return body.token as string;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

test.describe("Epic F-08 · real path normal-release @e2e-three-pack-real", {
  tag: ["@e2e-three-pack-real", "@e2e-chain-off-mock-pay"],
}, () => {
  test.beforeEach(({}, testInfo) => {
    if (skipLocal) {
      testInfo.skip(
        true,
        "PLAYWRIGHT_SKIP_EPIC_F_REAL_PATH=1（本地未起 API 时可设）"
      );
    }
    if (skipCiDefault) {
      testInfo.skip(
        true,
        "CI 默认不跑；手动设 RUN_EPIC_F_E2E_REAL_PATH=1 并起 API（见 Epic-F ladder F-08）"
      );
    }
  });

  test("chain_off：下单 → 接单 → mock-pay → confirm-completion → completed", async ({
    request,
  }) => {
    test.setTimeout(60_000);

    let touristToken: string;
    let guideToken: string;
    let guideRowId: string | null;
    let orderId: string;

    await test.step("GET /meta", async () => {
      const meta = await request.get(`${apiBase}/meta`);
      expect(
        meta.ok(),
        `GET /meta failed (${meta.status()}). Is traveltrust-api on ${apiBase}?`
      ).toBeTruthy();
    });

    await test.step("skip if mock-pay unavailable (chain-on)", async () => {
      await skipUnlessOrderMockPayAvailable(request, apiBase);
    });

    await test.step("POST /auth/seed-test-accounts", async () => {
      await request
        .post(`${apiBase}/auth/seed-test-accounts`, {
          headers: { "Content-Type": "application/json" },
          data: "{}",
        })
        .catch(() => null);
    });

    await test.step("releaseSeedGuideSlotIfBlocked", async () => {
      await releaseSeedGuideSlotIfBlocked(request, apiBase);
    });

    await test.step("login tourist@test.com", async () => {
      touristToken = await login(request, "tourist@test.com", "Test123!");
    });

    await test.step("login guide@test.com", async () => {
      guideToken = await login(request, "guide@test.com", "Test123!");
    });

    await test.step("guideRowId (GET /api/v1/me guide.id)", async () => {
      guideRowId = await guideRowIdForSeedGuideAccount(request, apiBase);
      expect(
        guideRowId,
        "seed guide id (guide@test GET /me guide.id) missing"
      ).toBeTruthy();
    });

    await test.step("POST /api/v1/orders (create)", async () => {
      const createRes = await request.post(`${apiBase}/api/v1/orders`, {
        headers: authHeaders(touristToken),
        data: {
          guide_id: guideRowId as string,
          amount: "500",
          currency: "USD",
        },
      });
      expect(createRes.ok(), await createRes.text()).toBeTruthy();
      const created = (await createRes.json()) as {
        order?: { id?: string; status?: string };
      };
      orderId = created.order?.id as string;
      expect(orderId, "create order missing id").toBeTruthy();
      expect(created.order?.status).toBe("created");
    });

    await test.step("POST …/accept", async () => {
      const acceptRes = await request.post(
        `${apiBase}/api/v1/orders/${orderId}/accept`,
        { headers: authHeaders(guideToken), data: {} }
      );
      expect(acceptRes.ok(), await acceptRes.text()).toBeTruthy();
      const accepted = (await acceptRes.json()) as {
        order?: { status?: string };
      };
      expect(accepted.order?.status).toBe("accepted");
    });

    await test.step("POST …/mock-pay", async () => {
      const payRes = await request.post(
        `${apiBase}/api/v1/orders/${orderId}/mock-pay`,
        { headers: authHeaders(touristToken), data: {} }
      );
      expect(
        payRes.ok(),
        `${await payRes.text()} — API needs P3_CHAIN_OFF=1 for mock-pay`
      ).toBeTruthy();
      const paid = (await payRes.json()) as { order?: { status?: string } };
      expect(paid.order?.status).toBe("escrowed");
    });

    await test.step("POST …/confirm-completion", async () => {
      const completeRes = await request.post(
        `${apiBase}/api/v1/orders/${orderId}/confirm-completion`,
        { headers: authHeaders(guideToken), data: {} }
      );
      expect(completeRes.ok(), await completeRes.text()).toBeTruthy();
      const done = (await completeRes.json()) as {
        order?: { status?: string };
      };
      expect(done.order?.status).toBe("completed");
    });

    await test.step("GET /api/v1/orders/:id (verify completed)", async () => {
      const getRes = await request.get(`${apiBase}/api/v1/orders/${orderId}`, {
        headers: authHeaders(touristToken),
      });
      expect(getRes.ok(), await getRes.text()).toBeTruthy();
      const finalJson = (await getRes.json()) as {
        order?: { status?: string };
      };
      expect(finalJson.order?.status).toBe("completed");
    });
  });
});
