import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api/routes";

describe("O-S1 official accounts management contract", () => {
  it("routes expose official accounts admin API", () => {
    expect(routes.adminOfficialAccounts).toBe("/api/v1/admin/official/accounts");
    expect(routes.adminOfficialAccount("acc-id")).toBe("/api/v1/admin/official/accounts/acc-id");
    expect(routes.adminOfficialAccountSubmitReview("acc-id")).toBe(
      "/api/v1/admin/official/accounts/acc-id/submit-review",
    );
    expect(routes.adminOfficialAccountBindReferral("acc-id")).toBe(
      "/api/v1/admin/official/accounts/acc-id/bind-referral-code",
    );
  });
});
