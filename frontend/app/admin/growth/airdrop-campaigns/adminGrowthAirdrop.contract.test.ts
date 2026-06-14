import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("G-S6 airdrop contract", () => {
  it("routes expose admin airdrop campaigns API", () => {
    expect(routes.adminGrowthAirdropCampaigns).toBe("/api/v1/admin/growth/airdrop-campaigns");
  });
});
