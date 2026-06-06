/**
 * 认证 HTTP：`postSeedTestAccounts` / `postLogin` / `postRegister`（51-H2）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { postSeedTestAccounts, postLogin, postRegister } from ".";
import { mockAuthApiTextResponse } from "./auth.api.vitestShared";

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

  it("returns disabled on 503 chain_off_unavailable (auth_seed_test_accounts)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: "chain_off_unavailable", message: "chain_off_unavailable" }),
    });
    expect(await postSeedTestAccounts()).toEqual({ disabled: true });
  });
});

describe("postLogin", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("throws when HTTP 200 but envelope status is not ok (aligned with postRegister)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(true, { status: "error", error: "invalid_credentials" })
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
      mockAuthApiTextResponse(true, { status: "ok", user_id: "u1", token: "tts_x" })
    );
    expect(await postLogin({ email: "a@b.c", password: "p" })).toMatchObject({
      status: "ok",
      user_id: "u1",
    });
  });

  it("rejects HTTP 503 chain_off_unavailable (auth_login)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(postLogin({ email: "a@b.c", password: "p" })).rejects.toThrow("chain_off_unavailable");
  });
});

describe("postRegister", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("returns data on ok envelope", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(true, { status: "ok", user_id: "new-u" })
    );
    expect(await postRegister({ email: "n@b.c", password: "pw" })).toMatchObject({
      status: "ok",
      user_id: "new-u",
    });
  });

  it("POSTs optional role for 693 provider/steward registration", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(true, { status: "ok", user_id: "p1" })
    );
    await postRegister({ email: "p@b.c", password: "password1", role: "provider" });
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body as string) as Record<string, unknown>;
    expect(body.role).toBe("provider");
  });

  it("POSTs role traveler for 697 (87 protocol; backend stores traveler)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(true, { status: "ok", user_id: "t1", role: "traveler" })
    );
    const out = await postRegister({ email: "t@b.c", password: "password1", role: "traveler" });
    expect(out).toMatchObject({ status: "ok", role: "traveler" });
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body as string) as Record<string, unknown>;
    expect(body.role).toBe("traveler");
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(true, { status: "error", error: "email_already_registered" })
    );
    await expect(postRegister({ email: "x@y.z", password: "p" })).rejects.toThrow("email_already_registered");
  });

  it("rejects HTTP 503 chain_off_unavailable (auth_register)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAuthApiTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(postRegister({ email: "n@b.c", password: "pw" })).rejects.toThrow("chain_off_unavailable");
  });
});
