import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("O-S4 cold start campaigns contract", () => {
  it("routes.adminOfficialColdStart* paths", () => {
    expect(routes.adminOfficialColdStartCampaigns).toBe(
      "/api/v1/admin/official/cold-start/campaigns",
    );
    expect(routes.adminOfficialColdStartCampaign("camp-id")).toBe(
      "/api/v1/admin/official/cold-start/campaigns/camp-id",
    );
    expect(routes.adminOfficialColdStartCampaignDeploy("camp-id")).toBe(
      "/api/v1/admin/official/cold-start/campaigns/camp-id/deploy",
    );
    expect(routes.adminOfficialColdStartCampaignRollback("camp-id")).toBe(
      "/api/v1/admin/official/cold-start/campaigns/camp-id/rollback",
    );
  });
});
