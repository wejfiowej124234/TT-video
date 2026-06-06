/**
 * 与 `governance_voting_power/`（**`handler`**）的 HTTP 分岔对齐（`parseResponse` 稳定 **`Error.message`**）。
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { AUTH_USER_ID_KEY } from "../core";
import { getGovernanceVotingPower } from ".";
import { governanceMockTextResponse } from "./governance.vitestShared";

describe("getGovernanceVotingPower", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("200 anonymous: authenticated false, can_cast_vote null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(true, {
          status: "ok",
          authenticated: false,
          vote_kind: "signal_off_chain",
          triggers_on_chain_execution: false,
          weight_ssot: "mvp_delegation_units",
          anchor: "B-092",
          unified_on_chain_vote_weight_u256_dec: null,
          weight_formula_anchor: "B-098",
          can_cast_vote: null,
          delegate_to: null,
          delegator_count: null,
          total_weight_units: null,
          note: "Sign in to compute voting-power units (B-092)",
          on_chain_vote_weight: {},
          stake_snapshot: null,
          country_pool_share_snapshot: null,
        }),
      ),
    );
    const out = await getGovernanceVotingPower();
    expect(out.status).toBe("ok");
    expect(out.authenticated).toBe(false);
    expect(out.can_cast_vote).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      apiUrl(routes.governanceVotingPower),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      }),
    );
  });

  it("200 logged-in with active delegation: can_cast_vote false (HTTP still 200)", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    const del = "550e8400-e29b-41d4-a716-446655440099";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(true, {
          status: "ok",
          authenticated: true,
          vote_kind: "signal_off_chain",
          triggers_on_chain_execution: false,
          weight_ssot: "mvp_delegation_units",
          can_cast_vote: false,
          reason: "delegation_active_cannot_vote",
          delegate_to: del,
          note: "Revoke delegation at DELETE /api/v1/governance/delegate to cast votes yourself (B-092)",
          on_chain_vote_weight: {},
          stake_snapshot: null,
          country_pool_share_snapshot: null,
        }),
      ),
    );
    const out = await getGovernanceVotingPower();
    expect(out.can_cast_vote).toBe(false);
    expect(out.reason).toBe("delegation_active_cannot_vote");
    expect(out.delegate_to).toBe(del);
  });
});
