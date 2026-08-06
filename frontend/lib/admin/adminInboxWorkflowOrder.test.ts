import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_WORKFLOW_IDS, adminInboxWorkflowRank } from "./adminInboxWorkflowOrder";

describe("adminInboxWorkflowOrder (①)", () => {
  it("fixes provider → steward → approvals → disputes → reports", () => {
    expect(ADMIN_INBOX_WORKFLOW_IDS).toEqual([
      "provider",
      "steward",
      "approvals",
      "disputes",
      "reports",
    ]);
    expect(adminInboxWorkflowRank("provider")).toBeLessThan(adminInboxWorkflowRank("approvals"));
    expect(adminInboxWorkflowRank("approvals")).toBeLessThan(adminInboxWorkflowRank("disputes"));
    expect(adminInboxWorkflowRank("disputes")).toBeLessThan(adminInboxWorkflowRank("reports"));
  });
});
