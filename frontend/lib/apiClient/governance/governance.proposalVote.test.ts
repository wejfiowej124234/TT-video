/**
 * 与 `governance_proposals/`（**`router`/`vote`**）的 HTTP 分岔对齐（`parseResponse` 稳定 **`Error.message`**）。
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { AUTH_USER_ID_KEY } from "../core";
import { postGovernanceProposalVote } from ".";
import { governanceMockTextResponse, GOVERNANCE_TEST_PROPOSAL_ID } from "./governance.vitestShared";

const PID = GOVERNANCE_TEST_PROPOSAL_ID;

describe("postGovernanceProposalVote", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("401 login_required", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(false, { error: "login_required", message: "login_required" }, 401),
      ),
    );
    await expect(postGovernanceProposalVote(PID, "yes")).rejects.toThrow("login_required");
    expect(fetch).toHaveBeenCalledWith(
      apiUrl(routes.governanceProposalVote(PID)),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ vote: "yes" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String),
        }),
      }),
    );
  });

  it("400 invalid_vote", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(false, { error: "invalid_vote", message: "invalid_vote", hint: "vote must be yes, no, or abstain" }, 400),
      ),
    );
    await expect(postGovernanceProposalVote(PID, "yes")).rejects.toThrow("invalid_vote");
  });

  it("400 invalid_proposal_id", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(false, { error: "invalid_proposal_id", message: "invalid_proposal_id" }, 400),
      ),
    );
    await expect(postGovernanceProposalVote("not-uuid", "yes")).rejects.toThrow("invalid_proposal_id");
  });

  it("400 vote_on_chain_required (Governor indexed mode)", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(
          false,
          {
            error: "vote_on_chain_required",
            message: "vote_on_chain_required",
            hint: "Governor mode: submit castVote(uint256,uint8) on-chain; API does not record signal votes (B-089 Completion)",
            cast_vote_calldata: { yes: "0x" },
          },
          400,
        ),
      ),
    );
    await expect(postGovernanceProposalVote(PID, "yes")).rejects.toThrow("vote_on_chain_required");
  });

  it("403 delegation_active_cannot_vote", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(
          false,
          {
            error: "delegation_active_cannot_vote",
            message: "delegation_active_cannot_vote",
            delegate_to: "550e8400-e29b-41d4-a716-446655440099",
            hint: "revoke delegation with DELETE /api/v1/governance/delegate before casting your own vote (B-092)",
          },
          403,
        ),
      ),
    );
    await expect(postGovernanceProposalVote(PID, "abstain")).rejects.toThrow("delegation_active_cannot_vote");
  });

  it("404 proposal_not_found", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(false, { error: "proposal_not_found", message: "proposal_not_found" }, 404),
      ),
    );
    await expect(postGovernanceProposalVote(PID, "no")).rejects.toThrow("proposal_not_found");
  });

  it("409 already_voted", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(
          false,
          {
            error: "already_voted",
            message: "already_voted",
            existing_vote: "yes",
            hint: "use the same vote again for idempotent success, or contact admin to change vote in a future release",
          },
          409,
        ),
      ),
    );
    await expect(postGovernanceProposalVote(PID, "no")).rejects.toThrow("already_voted");
  });

  it("200 first vote", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(true, {
          status: "ok",
          proposal_id: PID,
          my_vote: "yes",
          weight_applied: 2,
          idempotent: false,
        }),
      ),
    );
    const out = await postGovernanceProposalVote(PID, "yes", "idem-gov-1");
    expect(out.status).toBe("ok");
    expect(out.my_vote).toBe("yes");
    expect(out.idempotent).toBe(false);
    expect(fetch).toHaveBeenCalledWith(
      apiUrl(routes.governanceProposalVote(PID)),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key": "idem-gov-1",
          "X-Idempotency-Key": "idem-gov-1",
        }),
      }),
    );
  });
});
