import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("O-S3 official itinerary templates contract", () => {
  it("routes.adminOfficialItineraryTemplates* paths", () => {
    expect(routes.adminOfficialItineraryTemplates).toBe(
      "/api/v1/admin/official/itinerary-templates",
    );
    expect(routes.adminOfficialItineraryTemplate("tpl-id")).toBe(
      "/api/v1/admin/official/itinerary-templates/tpl-id",
    );
    expect(routes.adminOfficialItineraryTemplateSubmitReview("tpl-id")).toBe(
      "/api/v1/admin/official/itinerary-templates/tpl-id/submit-review",
    );
    expect(routes.adminOfficialItineraryTemplatePublish("tpl-id")).toBe(
      "/api/v1/admin/official/itinerary-templates/tpl-id/publish",
    );
  });
});
