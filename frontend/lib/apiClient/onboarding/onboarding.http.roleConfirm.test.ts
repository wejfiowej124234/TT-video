/**
 * 96-18：`GET …/onboarding/quote`、`POST …/payment-intents` / `role-confirm` 头与体（04 §3.4）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl } from "../../api";
import { routes } from "../../api/routes";
import { mapApiReadError } from "../../mapApiReadError";
import { postOnboardingRoleConfirm } from ".";

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
