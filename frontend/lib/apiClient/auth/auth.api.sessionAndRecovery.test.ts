/**
 * 认证 HTTP：`postLogout` / `postRefresh` / `postVerifyEmail` / `postForgotPassword` / `postResetPassword`（51-H2）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { postLogout, postRefresh, postVerifyEmail, postForgotPassword, postResetPassword } from ".";
import { mockAuthApiTextResponse } from "./auth.api.vitestShared";

describe("postLogout", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs {} when body omitted", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(true, { status: "ok" })
    );
    await postLogout();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.logout),
      expect.objectContaining({ body: "{}" })
    );
  });

  it("rejects HTTP 503 chain_off_unavailable (auth_logout)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(postLogout()).rejects.toThrow("chain_off_unavailable");
  });
});

describe("postRefresh", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs optional body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(true, { status: "ok", token: "tts_new" })
    );
    await postRefresh({ refresh_token: "r" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.refresh),
      expect.objectContaining({
        body: JSON.stringify({ refresh_token: "r" }),
      })
    );
  });

  it("rejects HTTP 503 chain_off_unavailable (auth_refresh)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(postRefresh({})).rejects.toThrow("chain_off_unavailable");
  });
});

describe("postVerifyEmail", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs JSON body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(true, { status: "ok" })
    );
    await postVerifyEmail({ token: "t" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.verifyEmail),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "t" }),
      })
    );
  });

  it("rejects HTTP 503 chain_off_unavailable (auth_verify_email)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(postVerifyEmail({ token: "x" })).rejects.toThrow("chain_off_unavailable");
  });
});

describe("postForgotPassword", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs email", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(true, { status: "ok" })
    );
    await postForgotPassword({ email: "a@b.c" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.forgotPassword),
      expect.objectContaining({ body: JSON.stringify({ email: "a@b.c" }) })
    );
  });

  it("rejects HTTP 503 chain_off_unavailable (auth_forgot_password)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(postForgotPassword({ email: "a@b.c" })).rejects.toThrow("chain_off_unavailable");
  });
});

describe("postResetPassword", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs reset payload", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(true, { status: "ok" })
    );
    await postResetPassword({ token: "t", new_password: "n" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.resetPassword),
      expect.objectContaining({ body: JSON.stringify({ token: "t", new_password: "n" }) })
    );
  });

  it("rejects HTTP 503 chain_off_unavailable (auth_reset_password)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(postResetPassword({ token: "t", new_password: "n" })).rejects.toThrow(
      "chain_off_unavailable"
    );
  });
});
