import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("O-S2 official guides contract", () => {
  it("routes.adminOfficialGuides* paths", () => {
    expect(routes.adminOfficialGuides).toBe("/api/v1/admin/official/guides");
    expect(routes.adminOfficialGuide("guide-id")).toBe("/api/v1/admin/official/guides/guide-id");
    expect(routes.adminOfficialGuideSubmitReview("guide-id")).toBe(
      "/api/v1/admin/official/guides/guide-id/submit-review",
    );
    expect(routes.adminOfficialGuideRequestPublish("guide-id")).toBe(
      "/api/v1/admin/official/guides/guide-id/request-publish",
    );
    expect(routes.adminOfficialGuidePublish("guide-id")).toBe(
      "/api/v1/admin/official/guides/guide-id/publish",
    );
    expect(routes.adminOfficialGuideArchive("guide-id")).toBe(
      "/api/v1/admin/official/guides/guide-id/archive",
    );
  });
});
