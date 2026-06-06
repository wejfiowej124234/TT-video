/**
 * `getGovernanceProposal` 详情 GET 与路由/`parseResponse` 分岔对齐。
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { AUTH_USER_ID_KEY } from "../core";
import { getGovernanceProposal } from ".";
import { governanceMockTextResponse, GOVERNANCE_TEST_PROPOSAL_ID } from "./governance.vitestShared";

const PID = GOVERNANCE_TEST_PROPOSAL_ID;

describe("getGovernanceProposal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("404 proposal_not_found", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        governanceMockTextResponse(false, { error: "proposal_not_found", message: "proposal_not_found" }, 404),
      ),
    );
    await expect(getGovernanceProposal(PID)).rejects.toThrow("proposal_not_found");
    expect(fetch).toHaveBeenCalledWith(
      apiUrl(routes.governanceProposal(PID)),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      }),
    );
  });
});
