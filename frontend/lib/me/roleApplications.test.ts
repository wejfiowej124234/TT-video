import { describe, expect, it } from "vitest";
import {
  parseMeRoleApplicationsResponse,
  roleApplicationStatusForSurface,
} from "./roleApplications";

describe("roleApplications PD-007", () => {
  it("parses applications array", () => {
    const rows = parseMeRoleApplicationsResponse({
      status: "ok",
      applications: [
        {
          id: "a1",
          kind: "provider_onboarding",
          status: "submitted",
          legacy_ref: {},
          metadata: {},
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("submitted");
  });

  it("roleApplicationStatusForSurface picks onboarding kind", () => {
    const rows = parseMeRoleApplicationsResponse({
      status: "ok",
      applications: [
        { id: "1", kind: "provider_onboarding", status: "approved" },
        { id: "2", kind: "region_steward_onboarding", status: "draft" },
      ],
    });
    expect(roleApplicationStatusForSurface(rows, "provider")).toBe("approved");
    expect(roleApplicationStatusForSurface(rows, "steward")).toBe("draft");
  });
});
