/**
 * 96-18：`GET …/onboarding/quote`、`POST …/payment-intents` / `role-confirm` 头与体（04 §3.4）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl } from "../api";
import { routes } from "../api/routes";
import { mapApiReadError } from "../mapApiReadError";
import {
  getOnboardingEntitlementsMe,
  getOnboardingQuote,
  postOnboardingPaymentIntent,
  postOnboardingRoleConfirm,
} from "./onboarding";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
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

describe("postOnboardingPaymentIntent", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs JSON with idempotency and auth headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        entitlement_id: "e1",
        meta: { implementation_status: "onboarding_payment_intent_persisted_fee_schedule_v1" },
      })
    );
    const data = await postOnboardingPaymentIntent({ role: "provider" }, "idem-onb-1");
    expect(data).toMatchObject({ status: "ok", entitlement_id: "e1" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.onboardingPaymentIntents),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ role: "provider" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "idem-onb-1",
          "X-Idempotency-Key": "idem-onb-1",
        }),
      })
    );
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "missing_onboarding_idempotency_key" })
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" })).rejects.toThrow("missing_onboarding_idempotency_key");
    expect(
      mapApiReadError(new Error("missing_onboarding_idempotency_key"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_missingIdempotencyKey");
  });

  it("throws chain_off_unavailable on HTTP 503 (mapApiReadError → common_apiHttpServer)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-chain-off")).rejects.toThrow(
      "chain_off_unavailable"
    );
    expect(mapApiReadError(new Error("chain_off_unavailable"), tEcho, "me_onboarding_paymentIntentFailed")).toBe(
      "common_apiHttpServer"
    );
  });

  /** `ONBOARDING_PAYMENT_INTENTS_DISABLED=1`：仅拦新建 intent；与 `matrix_93_b_onb_007_*` / 96-10 §2.1 对读。 */
  it("throws onboarding_payment_intents_disabled on HTTP 503 (mapApiReadError parity for /me/onboarding)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_payment_intents_disabled", message: "onboarding_payment_intents_disabled" }, 503)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-kill-1")).rejects.toThrow(
      "onboarding_payment_intents_disabled"
    );
    expect(
      mapApiReadError(new Error("onboarding_payment_intents_disabled"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_paymentIntentsDisabled");
  });

  /** `list_file` 模式下列文件不可读：503，与 `matrix_93_b_onb_006g_*` / 04-附录 §1 对读。 */
  it("throws onboarding_compliance_screening_unavailable on HTTP 503 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        {
          error: "onboarding_compliance_screening_unavailable",
          message: "onboarding_compliance_screening_unavailable",
        },
        503
      )
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-list-unavail")).rejects.toThrow(
      "onboarding_compliance_screening_unavailable"
    );
    expect(
      mapApiReadError(
        new Error("onboarding_compliance_screening_unavailable"),
        tEcho,
        "me_onboarding_paymentIntentFailed"
      )
    ).toBe("me_onboarding_error_complianceScreeningUnavailable");
  });

  it("throws onboarding_idempotency_conflict on HTTP 409 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_idempotency_conflict", message: "onboarding_idempotency_conflict" }, 409)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-dup")).rejects.toThrow(
      "onboarding_idempotency_conflict"
    );
    expect(
      mapApiReadError(new Error("onboarding_idempotency_conflict"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_idempotencyConflict");
  });

  it("throws onboarding_forbidden_sanctions on HTTP 403 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_forbidden_sanctions", message: "onboarding_forbidden_sanctions" }, 403)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-block")).rejects.toThrow(
      "onboarding_forbidden_sanctions"
    );
    expect(
      mapApiReadError(new Error("onboarding_forbidden_sanctions"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_complianceBlocked");
  });

  it("throws onboarding_user_write_rate_limited on HTTP 429 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_user_write_rate_limited", message: "onboarding_user_write_rate_limited" }, 429)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-rl")).rejects.toThrow(
      "onboarding_user_write_rate_limited"
    );
    expect(
      mapApiReadError(new Error("onboarding_user_write_rate_limited"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_userWriteRateLimited");
  });

  it("throws onboarding_payment_not_configured on HTTP 503 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_payment_not_configured", message: "onboarding_payment_not_configured" }, 503)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-no-pg")).rejects.toThrow(
      "onboarding_payment_not_configured"
    );
    expect(
      mapApiReadError(new Error("onboarding_payment_not_configured"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_paymentNotConfigured");
  });

  it("throws onboarding_psp_unavailable on HTTP 502 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_psp_unavailable", message: "onboarding_psp_unavailable" }, 502)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-psp")).rejects.toThrow("onboarding_psp_unavailable");
    expect(mapApiReadError(new Error("onboarding_psp_unavailable"), tEcho, "me_onboarding_paymentIntentFailed")).toBe(
      "me_onboarding_error_pspUnavailable"
    );
  });

  it("throws missing_return_url_for_stripe_checkout on HTTP 400 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "missing_return_url_for_stripe_checkout", message: "missing_return_url_for_stripe_checkout" }, 400)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-chk")).rejects.toThrow(
      "missing_return_url_for_stripe_checkout"
    );
    expect(
      mapApiReadError(new Error("missing_return_url_for_stripe_checkout"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_missingReturnUrlCheckout");
  });

  it("throws invalid_return_url_for_stripe_checkout on HTTP 400 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "invalid_return_url_for_stripe_checkout", message: "invalid_return_url_for_stripe_checkout" }, 400)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-url")).rejects.toThrow(
      "invalid_return_url_for_stripe_checkout"
    );
    expect(
      mapApiReadError(new Error("invalid_return_url_for_stripe_checkout"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_invalidReturnUrlCheckout");
  });

  it("throws invalid_onboarding_idempotency_key on HTTP 400 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "invalid_onboarding_idempotency_key", message: "invalid_onboarding_idempotency_key" }, 400)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "x".repeat(300))).rejects.toThrow(
      "invalid_onboarding_idempotency_key"
    );
    expect(
      mapApiReadError(new Error("invalid_onboarding_idempotency_key"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_invalidIdempotencyKey");
  });

  it("throws onboarding_user_missing on HTTP 500 (mapApiReadError → serverSide)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_user_missing", message: "onboarding_user_missing" }, 500)
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-500-user")).rejects.toThrow("onboarding_user_missing");
    expect(mapApiReadError(new Error("onboarding_user_missing"), tEcho, "me_onboarding_paymentIntentFailed")).toBe(
      "me_onboarding_error_serverSide"
    );
  });

  it("throws onboarding_intent_user_read_failed on HTTP 500 (mapApiReadError → serverSide)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        { error: "onboarding_intent_user_read_failed", message: "onboarding_intent_user_read_failed" },
        500
      )
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-500-read")).rejects.toThrow(
      "onboarding_intent_user_read_failed"
    );
    expect(
      mapApiReadError(new Error("onboarding_intent_user_read_failed"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_serverSide");
  });

  it("throws onboarding_intent_persist_failed on HTTP 500 (mapApiReadError → serverSide)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        { error: "onboarding_intent_persist_failed", message: "onboarding_intent_persist_failed" },
        500
      )
    );
    await expect(postOnboardingPaymentIntent({ role: "provider" }, "idem-500-persist")).rejects.toThrow(
      "onboarding_intent_persist_failed"
    );
    expect(
      mapApiReadError(new Error("onboarding_intent_persist_failed"), tEcho, "me_onboarding_paymentIntentFailed")
    ).toBe("me_onboarding_error_serverSide");
  });
});

describe("postOnboardingRoleConfirm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws chain_off_unavailable on HTTP 503 (mapApiReadError → common_apiHttpServer)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(postOnboardingRoleConfirm("provider", "idem-rc-co")).rejects.toThrow("chain_off_unavailable");
    expect(mapApiReadError(new Error("chain_off_unavailable"), tEcho, "me_onboarding_roleConfirmFailed")).toBe(
      "common_apiHttpServer"
    );
  });

  it("POSTs role JSON with idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        role: "provider",
        updated: true,
        meta: { implementation_status: "onboarding_role_confirm_db" },
      })
    );
    const data = await postOnboardingRoleConfirm("provider", "idem-role-1");
    expect(data).toMatchObject({ status: "ok", role: "provider" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.onboardingRoleConfirm),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ role: "provider" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "idem-role-1",
          "X-Idempotency-Key": "idem-role-1",
        }),
      })
    );
  });

  it("throws onboarding_entitlement_required on HTTP 400 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_entitlement_required", message: "onboarding_entitlement_required" }, 400)
    );
    await expect(postOnboardingRoleConfirm("provider", "idem-no-paid")).rejects.toThrow("onboarding_entitlement_required");
    expect(
      mapApiReadError(new Error("onboarding_entitlement_required"), tEcho, "me_onboarding_roleConfirmFailed")
    ).toBe("me_onboarding_error_entitlementRequired");
  });

  it("throws onboarding_user_write_rate_limited on HTTP 429 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_user_write_rate_limited", message: "onboarding_user_write_rate_limited" }, 429)
    );
    await expect(postOnboardingRoleConfirm("provider", "idem-rl2")).rejects.toThrow("onboarding_user_write_rate_limited");
    expect(
      mapApiReadError(new Error("onboarding_user_write_rate_limited"), tEcho, "me_onboarding_roleConfirmFailed")
    ).toBe("me_onboarding_error_userWriteRateLimited");
  });

  it("throws invalid_onboarding_role on HTTP 400 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "invalid_onboarding_role", message: "invalid_onboarding_role" }, 400)
    );
    await expect(postOnboardingRoleConfirm("provider", "idem-bad-role")).rejects.toThrow("invalid_onboarding_role");
    expect(mapApiReadError(new Error("invalid_onboarding_role"), tEcho, "me_onboarding_roleConfirmFailed")).toBe(
      "me_onboarding_error_invalidRole"
    );
  });

  it("throws onboarding_forbidden_sanctions on HTTP 403 (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "onboarding_forbidden_sanctions", message: "onboarding_forbidden_sanctions" }, 403)
    );
    await expect(postOnboardingRoleConfirm("provider", "idem-rc-block")).rejects.toThrow("onboarding_forbidden_sanctions");
    expect(
      mapApiReadError(new Error("onboarding_forbidden_sanctions"), tEcho, "me_onboarding_roleConfirmFailed")
    ).toBe("me_onboarding_error_complianceBlocked");
  });

  it("throws onboarding_compliance_screening_unavailable on HTTP 503 for role-confirm (mapApiReadError parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        {
          error: "onboarding_compliance_screening_unavailable",
          message: "onboarding_compliance_screening_unavailable",
        },
        503
      )
    );
    await expect(postOnboardingRoleConfirm("provider", "idem-rc-list-unavail")).rejects.toThrow(
      "onboarding_compliance_screening_unavailable"
    );
    expect(
      mapApiReadError(
        new Error("onboarding_compliance_screening_unavailable"),
        tEcho,
        "me_onboarding_roleConfirmFailed"
      )
    ).toBe("me_onboarding_error_complianceScreeningUnavailable");
  });

  it("throws onboarding_role_confirm_user_read_failed on HTTP 500 (mapApiReadError → serverSide)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        {
          error: "onboarding_role_confirm_user_read_failed",
          message: "onboarding_role_confirm_user_read_failed",
        },
        500
      )
    );
    await expect(postOnboardingRoleConfirm("provider", "idem-rc-500-ur")).rejects.toThrow(
      "onboarding_role_confirm_user_read_failed"
    );
    expect(
      mapApiReadError(new Error("onboarding_role_confirm_user_read_failed"), tEcho, "me_onboarding_roleConfirmFailed")
    ).toBe("me_onboarding_error_serverSide");
  });

  it("throws onboarding_role_confirm_read_failed on HTTP 500 (mapApiReadError → serverSide)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        { error: "onboarding_role_confirm_read_failed", message: "onboarding_role_confirm_read_failed" },
        500
      )
    );
    await expect(postOnboardingRoleConfirm("provider", "idem-rc-500-r")).rejects.toThrow(
      "onboarding_role_confirm_read_failed"
    );
    expect(
      mapApiReadError(new Error("onboarding_role_confirm_read_failed"), tEcho, "me_onboarding_roleConfirmFailed")
    ).toBe("me_onboarding_error_serverSide");
  });

  it("throws onboarding_role_confirm_write_failed on HTTP 500 (mapApiReadError → serverSide)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        { error: "onboarding_role_confirm_write_failed", message: "onboarding_role_confirm_write_failed" },
        500
      )
    );
    await expect(postOnboardingRoleConfirm("provider", "idem-rc-500-w")).rejects.toThrow(
      "onboarding_role_confirm_write_failed"
    );
    expect(
      mapApiReadError(new Error("onboarding_role_confirm_write_failed"), tEcho, "me_onboarding_roleConfirmFailed")
    ).toBe("me_onboarding_error_serverSide");
  });
});
