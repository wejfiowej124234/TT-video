/**
 * 96-18：`GET …/onboarding/quote`、`POST …/payment-intents` / `role-confirm` 头与体（04 §3.4）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl } from "../../api";
import { routes } from "../../api/routes";
import { mapApiReadError } from "../../mapApiReadError";
import {
  getOnboardingEntitlementsMe,
  getOnboardingQuote,
  postOnboardingPaymentIntent,
  postOnboardingRoleConfirm,
} from ".";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    headers: { get: (_name: string) => null },
    text: async () => JSON.stringify(body),
  };
}

const tEcho = (k: string) => k;

describe("getOnboardingQuote", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GETs quote URL with role query", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        role: "region_steward",
        sku: "default",
        fee_schedule_version: "stub-v0",
        currency: "USD",
        amount_minor: 0,
        expires_at: "2099-01-01T00:00:00+00:00",
        refund_policy_version: "stub-v0",
        meta: { implementation_status: "onboarding_quote_stub" },
      })
    );
    const data = await getOnboardingQuote("region_steward", { jurisdictions: "US,FR" });
    expect(data).toMatchObject({ status: "ok", meta: { implementation_status: "onboarding_quote_stub" } });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${apiUrl(routes.onboardingQuote)}?role=region_steward&jurisdictions=US%2CFR`,
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  /** 专桶 429：补 Playwright 不覆盖的报价 GET（StrictMode 双 mount 下路由计数不稳）。 */
  it("throws onboarding_quote_rate_limited on HTTP 429 (mapApiReadError parity for /me/onboarding)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_quote_rate_limited", message: "onboarding_quote_rate_limited" }, 429)
    );
    await expect(getOnboardingQuote("provider")).rejects.toThrow("onboarding_quote_rate_limited");
    expect(
      mapApiReadError(new Error("onboarding_quote_rate_limited"), tEcho, "me_onboarding_quoteFailed")
    ).toBe("me_onboarding_error_quoteRateLimited");
  });

  it("throws chain_off_unavailable on HTTP 503 (mapApiReadError → common_apiHttpServer)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(getOnboardingQuote("provider")).rejects.toThrow("chain_off_unavailable");
    expect(mapApiReadError(new Error("chain_off_unavailable"), tEcho, "me_onboarding_quoteFailed")).toBe(
      "common_apiHttpServer"
    );
  });
});

describe("getOnboardingEntitlementsMe", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GETs entitlements URL with auth headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        entitlements: [],
        meta: { implementation_status: "onboarding_entitlements_stub" },
      })
    );
    const data = await getOnboardingEntitlementsMe();
    expect(data).toMatchObject({ status: "ok", meta: { implementation_status: "onboarding_entitlements_stub" } });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.onboardingEntitlementsMe),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("throws onboarding_entitlements_read_failed on HTTP 500 (mapApiReadError → serverSide)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_entitlements_read_failed", message: "onboarding_entitlements_read_failed" }, 500)
    );
    await expect(getOnboardingEntitlementsMe()).rejects.toThrow("onboarding_entitlements_read_failed");
    expect(
      mapApiReadError(new Error("onboarding_entitlements_read_failed"), tEcho, "me_onboarding_entitlementsFailed")
    ).toBe("me_onboarding_error_serverSide");
  });

  it("throws chain_off_unavailable on HTTP 503 (mapApiReadError → common_apiHttpServer)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(getOnboardingEntitlementsMe()).rejects.toThrow("chain_off_unavailable");
    expect(mapApiReadError(new Error("chain_off_unavailable"), tEcho, "me_onboarding_entitlementsFailed")).toBe(
      "common_apiHttpServer"
    );
  });
});
