import { describe, expect, it, vi, afterEach } from "vitest";
import * as core from "./apiClient/core";
import {
  adminApiErrorUserText,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
} from "./adminFetchDisplay";

const t = (k: string) =>
  ({
    admin_observability_forbidden: "FORBIDDEN",
    admin_error_login_required: "LOGIN",
    admin_error_user_not_found: "USER",
    admin_error_admin_required: "ADMIN",
    admin_error_super_admin_required: "SUPER",
    admin_error_admin_db_required: "DB",
    admin_error_not_found: "NF",
    admin_error_conflict: "CF",
    admin_error_invalid_request: "IV",
    common_apiNotImplemented: "NI",
    admin_error_server: "SV",
    admin_requestFailed: "FAILED",
  })[k] ?? k;

describe("adminFetchDisplay", () => {
  it("classifies admin API error codes and HTTP markers", () => {
    expect(adminFetchErrorKind(new Error("forbidden"))).toBe("forbidden");
    expect(adminFetchErrorKind(new Error("login_required"))).toBe("login_required");
    expect(adminFetchErrorKind(new Error("user_not_found"))).toBe("user_not_found");
    expect(adminFetchErrorKind(new Error("admin_required"))).toBe("admin_required");
    expect(adminFetchErrorKind(new Error("super_admin_required"))).toBe("super_admin_required");
    expect(adminFetchErrorKind(new Error("admin_db_required"))).toBe("admin_db_required");
    expect(adminFetchErrorKind(new Error("request_failed_401"))).toBe("login_required");
    expect(adminFetchErrorKind(new Error("request_failed_403"))).toBe("forbidden");
    expect(adminFetchErrorKind(new Error("request_failed_404"))).toBe("not_found");
    expect(adminFetchErrorKind(new Error("request_failed_409"))).toBe("conflict");
    expect(adminFetchErrorKind(new Error("request_failed_422"))).toBe("invalid_request");
    expect(adminFetchErrorKind(new Error("request_failed_408"))).toBe("server_error");
    expect(adminFetchErrorKind(new Error("request_failed_429"))).toBe("server_error");
    expect(adminFetchErrorKind(new Error("request_failed_500"))).toBe("server_error");
    expect(adminFetchErrorKind(new Error("request_failed_501"))).toBe("not_implemented");
    expect(adminFetchErrorKind(new Error("request_failed_400"))).toBe("invalid_request");
    expect(adminFetchErrorKind(new Error("feature_flag_not_found"))).toBe("not_found");
    expect(adminFetchErrorKind(new Error("community_report_not_found_for_penalty"))).toBe("not_found");
    expect(adminFetchErrorKind(new Error("feature_flag_version_conflict"))).toBe("conflict");
    expect(adminFetchErrorKind(new Error("approval_request_apply_conflict"))).toBe("conflict");
    expect(adminFetchErrorKind(new Error("feature_flag_publish_race"))).toBe("conflict");
    expect(adminFetchErrorKind(new Error("admin_community_moderation_race"))).toBe("conflict");
    expect(adminFetchErrorKind(new Error("invalid_policy_id"))).toBe("invalid_request");
    expect(adminFetchErrorKind(new Error("unsupported_approval_action"))).toBe("invalid_request");
    expect(adminFetchErrorKind(new Error("approval_request_not_pending"))).toBe("invalid_request");
    expect(adminFetchErrorKind(new Error("admin_policy_query_failed"))).toBe("server_error");
    expect(adminFetchErrorKind(new Error("fee_router_list_failed"))).toBe("server_error");
    expect(adminFetchErrorKind(new Error("internal"))).toBe("failed");
  });

  it("maps kinds to user text", () => {
    expect(adminErrorUserText("forbidden", t)).toBe("FORBIDDEN");
    expect(adminErrorUserText("login_required", t)).toBe("LOGIN");
    expect(adminErrorUserText("user_not_found", t)).toBe("USER");
    expect(adminErrorUserText("admin_required", t)).toBe("ADMIN");
    expect(adminErrorUserText("super_admin_required", t)).toBe("SUPER");
    expect(adminErrorUserText("admin_db_required", t)).toBe("DB");
    expect(adminErrorUserText("not_found", t)).toBe("NF");
    expect(adminErrorUserText("conflict", t)).toBe("CF");
    expect(adminErrorUserText("invalid_request", t)).toBe("IV");
    expect(adminErrorUserText("not_implemented", t)).toBe("NI");
    expect(adminErrorUserText("server_error", t)).toBe("SV");
    expect(adminErrorUserText("failed", t)).toBe("FAILED");
  });

  it("maps API error strings via adminApiErrorUserText", () => {
    expect(adminApiErrorUserText(undefined, t)).toBe("FAILED");
    expect(adminApiErrorUserText("", t)).toBe("FAILED");
    expect(adminApiErrorUserText("request_failed_401", t)).toBe("LOGIN");
    expect(adminApiErrorUserText("request_failed_403", t)).toBe("FORBIDDEN");
    expect(adminApiErrorUserText("request_failed_404", t)).toBe("NF");
    expect(adminApiErrorUserText("request_failed_501", t)).toBe("NI");
    expect(adminApiErrorUserText("request_failed_502", t)).toBe("SV");
    expect(adminApiErrorUserText("admin_policy_query_failed", t)).toBe("SV");
    expect(adminApiErrorUserText("unknown_custom_code", t)).toBe("FAILED");
  });
});

describe("adminFetchJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delegates to fetchJsonWithApiStatusLog", async () => {
    const fakeRes = { ok: true, status: 200 } as Response;
    const spy = vi.spyOn(core, "fetchJsonWithApiStatusLog").mockResolvedValue({
      res: fakeRes,
      body: { status: "ok", items: [] as unknown[] },
    });
    const { res, body } = await adminFetchJson<{ status?: string; items?: unknown[] }>(
      "test.ctx",
      "https://api.example/admin"
    );
    expect(spy).toHaveBeenCalledWith("test.ctx", "https://api.example/admin", undefined);
    expect(res).toBe(fakeRes);
    expect(body.status).toBe("ok");
  });

  it("forwards RequestInit to core", async () => {
    const spy = vi.spyOn(core, "fetchJsonWithApiStatusLog").mockResolvedValue({
      res: { ok: true, status: 200 } as Response,
      body: {},
    });
    const init = { method: "GET", headers: { "X-Test": "1" } };
    await adminFetchJson("ctx", "https://api.example/x", init);
    expect(spy).toHaveBeenCalledWith("ctx", "https://api.example/x", init);
  });
});

describe("adminLogApiJsonStatus", () => {
  afterEach(() => vi.restoreAllMocks());

  it("delegates to logApiJsonStatusNotOk", () => {
    const spy = vi.spyOn(core, "logApiJsonStatusNotOk").mockImplementation(() => {});
    adminLogApiJsonStatus("admin.list", { status: "error", error: "x" });
    expect(spy).toHaveBeenCalledWith("admin.list", { status: "error", error: "x" });
  });
});

describe("logAdminFetch", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs error in browser context", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logAdminFetch("admin.page", new Error("boom"));
    expect(errSpy).toHaveBeenCalledWith("[admin.page]", expect.any(Error));
  });
});
