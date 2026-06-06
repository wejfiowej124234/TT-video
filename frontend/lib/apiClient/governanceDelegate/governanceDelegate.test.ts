/**
 * 与 `governance_delegate.rs` 对齐：`parseResponse` 对 **401/400/404** 抛出稳定 **`Error.message`**。

 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { AUTH_USER_ID_KEY } from "../core";
import {
  deleteGovernanceDelegate,
  getGovernanceDelegate,
  postGovernanceDelegate,
} from ".";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("governanceDelegate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("getGovernanceDelegate: 200 unauthenticated envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(true, {
          status: "ok",
          authenticated: false,
          delegate_to: null,
          request_id: "rid-1",
          data_source: "chain_off_mvp",
          note: "Sign in",
        }),
      ),
    );
    const out = await getGovernanceDelegate();
    expect(out).toMatchObject({
      status: "ok",
      authenticated: false,
      delegate_to: null,
      data_source: "chain_off_mvp",
    });
    expect(fetch).toHaveBeenCalledWith(
      apiUrl(routes.governanceDelegate),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      }),
    );
  });

  it("postGovernanceDelegate: 401 throws login_required", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(false, { error: "login_required", message: "login_required", request_id: "r" }, 401),
      ),
    );
    await expect(postGovernanceDelegate("550e8400-e29b-41d4-a716-446655440000")).rejects.toThrow("login_required");
    expect(fetch).toHaveBeenCalledWith(
      apiUrl(routes.governanceDelegate),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ delegate_to: "550e8400-e29b-41d4-a716-446655440000" }),
      }),
    );
  });

  it("postGovernanceDelegate: 400 invalid_delegate_to", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(
          false,
          { error: "invalid_delegate_to", message: "invalid_delegate_to", request_id: "r" },
          400,
        ),
      ),
    );
    await expect(postGovernanceDelegate("not-a-uuid")).rejects.toThrow("invalid_delegate_to");
  });

  it("postGovernanceDelegate: 400 cannot_delegate_to_self", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    const self = "550e8400-e29b-41d4-a716-446655440001";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(
          false,
          { error: "cannot_delegate_to_self", message: "cannot_delegate_to_self", request_id: "r" },
          400,
        ),
      ),
    );
    await expect(postGovernanceDelegate(self)).rejects.toThrow("cannot_delegate_to_self");
  });

  it("postGovernanceDelegate: 200 ok", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    const other = "550e8400-e29b-41d4-a716-446655440002";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(true, {
          status: "ok",
          delegate_to: other,
          request_id: "r",
          tx_hash: null,
          implementation_note: "chain_off_mvp_no_onchain_tx",
          idempotent: false,
        }),
      ),
    );
    const out = await postGovernanceDelegate(`  ${other}  `);
    expect(out.delegate_to).toBe(other);
    expect(out.idempotent).toBe(false);
  });

  it("deleteGovernanceDelegate: 401 throws login_required", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(false, { error: "login_required", message: "login_required", request_id: "r" }, 401),
      ),
    );
    await expect(deleteGovernanceDelegate()).rejects.toThrow("login_required");
    expect(fetch).toHaveBeenCalledWith(
      apiUrl(routes.governanceDelegate),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("deleteGovernanceDelegate: 404 no_active_delegation", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(
          false,
          { error: "no_active_delegation", message: "no_active_delegation", request_id: "r" },
          404,
        ),
      ),
    );
    await expect(deleteGovernanceDelegate()).rejects.toThrow("no_active_delegation");
  });

  it("deleteGovernanceDelegate: 200 ok", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(true, {
          status: "ok",
          delegate_to: null,
          request_id: "r",
          tx_hash: null,
          implementation_note: "chain_off_mvp_no_onchain_tx",
        }),
      ),
    );
    const out = await deleteGovernanceDelegate();
    expect(out.status).toBe("ok");
    expect(out.delegate_to).toBeNull();
  });
});
