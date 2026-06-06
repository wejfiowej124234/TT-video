import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_WORKFLOW_IDS, adminInboxWorkflowRank } from "./adminInboxWorkflowOrder";

describe("adminInboxWorkflowOrder (①)", () => {
  it("fixes provider → steward → approvals → reports", () => {
    expect(ADMIN_INBOX_WORKFLOW_IDS).toEqual(["provider", "steward", "approvals", "reports"]);
    expect(adminInboxWorkflowRank("provider")).toBeLessThan(adminInboxWorkflowRank("reports"));
  });
});
