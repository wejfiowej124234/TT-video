/**
 * 认证 HTTP 客户端：seed、login、register、logout、refresh、verify/forgot/reset（51-H2）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import {
  postSeedTestAccounts,
  postLogin,
  postRegister,
  postLogout,
  postRefresh,
  postVerifyEmail,
  postForgotPassword,
  postResetPassword,
} from "./auth";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("postSeedTestAccounts", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("returns seeded merged with JSON on 200", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok", count: 2 }),
    });
    const out = await postSeedTestAccounts();
    expect(out).toEqual({ seeded: true, status: "ok", count: 2 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.seedTestAccounts),
      expect.objectContaining({
        method: "POST",
        body: "{}",
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("returns disabled on 403", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    });
    expect(await postSeedTestAccounts()).toEqual({ disabled: true });
  });

  it("returns disabled when HTTP not ok (non-403)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    expect(await postSeedTestAccounts()).toEqual({ disabled: true });
  });
});

describe("postLogin", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("throws when HTTP 200 but envelope status is not ok (aligned with postRegister)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "invalid_credentials" })
    );
    await expect(postLogin({ email: "a@b.c", password: "x" })).rejects.toThrow("invalid_credentials");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.login),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.c", password: "x" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String),
        }),
      })
    );
  });

  it("returns ok payload on success", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", user_id: "u1", token: "tts_x" })
    );
    expect(await postLogin({ email: "a@b.c", password: "p" })).toMatchObject({
      status: "ok",
      user_id: "u1",
    });
  });
});

describe("postRegister", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("returns data on ok envelope", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", user_id: "new-u" })
    );
    expect(await postRegister({ email: "n@b.c", password: "pw" })).toMatchObject({
      status: "ok",
      user_id: "new-u",
    });
  });

  it("POSTs optional role for 693 provider/steward registration", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", user_id: "p1" })
    );
    await postRegister({ email: "p@b.c", password: "password1", role: "provider" });
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body as string) as Record<string, unknown>;
    expect(body.role).toBe("provider");
  });

  it("POSTs role traveler for 697 (87 protocol; backend stores traveler)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", user_id: "t1", role: "traveler" })
    );
    const out = await postRegister({ email: "t@b.c", password: "password1", role: "traveler" });
    expect(out).toMatchObject({ status: "ok", role: "traveler" });
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body as string) as Record<string, unknown>;
    expect(body.role).toBe("traveler");
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "email_already_registered" })
    );
    await expect(postRegister({ email: "x@y.z", password: "p" })).rejects.toThrow("email_already_registered");
  });
});

describe("postLogout", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs {} when body omitted", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postLogout();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.logout),
      expect.objectContaining({ body: "{}" })
    );
  });
});

describe("postRefresh", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs optional body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", token: "tts_new" })
    );
    await postRefresh({ refresh_token: "r" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.refresh),
      expect.objectContaining({
        body: JSON.stringify({ refresh_token: "r" }),
      })
    );
  });
});

describe("postVerifyEmail", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs JSON body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
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
});

describe("postForgotPassword", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs email", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postForgotPassword({ email: "a@b.c" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.forgotPassword),
      expect.objectContaining({ body: JSON.stringify({ email: "a@b.c" }) })
    );
  });
});

describe("postResetPassword", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs reset payload", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postResetPassword({ token: "t", new_password: "n" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.auth.resetPassword),
      expect.objectContaining({ body: JSON.stringify({ token: "t", new_password: "n" }) })
    );
  });
});
