import { describe, it, expect, vi, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { getGovernanceProposalStatus } from ".";

describe("getGovernanceProposalStatus", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns parsed body on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({ status: "active", is_chain_ssot: true }),
          }) as Response,
      ),
    );
    await expect(getGovernanceProposalStatus("1")).resolves.toEqual({
      status: "active",
      is_chain_ssot: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      apiUrl(routes.governanceProposalStatus("1")),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-request-id": expect.any(String),
        }) as Record<string, unknown>,
      }),
    );
  });

  it("returns null on !res.ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: false,
            json: async () => ({ error: "proposal_not_found" }),
          }) as Response,
      ),
    );
    await expect(getGovernanceProposalStatus("1")).resolves.toBeNull();
  });

  it("returns null when body missing is_chain_ssot", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({ status: "active" }),
          }) as Response,
      ),
    );
    await expect(getGovernanceProposalStatus("1")).resolves.toBeNull();
  });

  it("returns null on empty id without fetch", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    await expect(getGovernanceProposalStatus("   ")).resolves.toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("passes through data_source and note when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({
              status: "active",
              is_chain_ssot: false,
              data_source: "governance_proposals_projection",
              note: "rpc fallback",
            }),
          }) as Response,
      ),
    );
    await expect(getGovernanceProposalStatus("7")).resolves.toEqual({
      status: "active",
      is_chain_ssot: false,
      data_source: "governance_proposals_projection",
      note: "rpc fallback",
    });
  });
});
