/**
 * 钱包验签 HTTP 客户端（04 §3.4 · EIP-191 challenge/confirm/status）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  getWalletVerificationStatus,
  postWalletVerifyChallenge,
  postWalletVerifyConfirm,
} from "./meWalletVerify";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("me wallet verify API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem("traveltrust_session_token", "tts_test_wallet");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("POSTs wallet verify challenge", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        challenge_id: "c1",
        message: "sign me",
        expires_at: "2026-05-16T00:00:00Z",
      })
    );
    const out = await postWalletVerifyChallenge({ wallet_address: "0xabc" });
    expect(out.challenge_id).toBe("c1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meWalletVerifyChallenge),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("POSTs wallet verify confirm", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", verified: true, wallet_address: "0xabc" })
    );
    const out = await postWalletVerifyConfirm({
      challenge_id: "c1",
      signature: "0x" + "11".repeat(65),
    });
    expect(out.verified).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meWalletVerifyConfirm),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("GETs wallet verification status", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        verified: false,
        verification_method: "eip191_personal_sign",
        verification_ttl_seconds: 86400,
        checked_at: "2026-05-16T00:00:00Z",
      })
    );
    const out = await getWalletVerificationStatus();
    expect(out.verified).toBe(false);
    expect(out.verification_method).toBe("eip191_personal_sign");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meWalletVerificationStatus),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: expect.stringContaining("Bearer") }),
      })
    );
  });
});
