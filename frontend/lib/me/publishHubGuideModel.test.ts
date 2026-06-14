import { describe, expect, it } from "vitest";
import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import {
  publishHubGuideHeadline,
  publishHubGuideHasListing,
  publishHubGuideStatusLabelKey,
} from "@/lib/me/publishHubGuideModel";

describe("publishHubGuideModel", () => {
  it("maps application status to label keys", () => {
    expect(publishHubGuideStatusLabelKey({ application_status: "approved" }, null)).toBe(
      "publish_hub_guide_status_active",
    );
    expect(publishHubGuideStatusLabelKey({ status: "pending" }, null)).toBe(
      "publish_hub_guide_status_pending",
    );
    expect(publishHubGuideStatusLabelKey(null, "active")).toBe("me_identity_state_active");
  });

  it("builds headline from public title or city", () => {
    const profile: MeGuideProfile = { public_title: "Paris culture", city: "Paris" };
    expect(publishHubGuideHeadline(profile, "untitled")).toBe("Paris culture");
    expect(publishHubGuideHeadline({ city: "Tokyo", country_code: "JP" }, "untitled")).toBe("Tokyo, JP");
    expect(publishHubGuideHeadline(null, "untitled")).toBe("untitled");
  });

  it("detects listing presence via guide_id", () => {
    expect(publishHubGuideHasListing({ guide_id: "g-1" })).toBe(true);
    expect(publishHubGuideHasListing({})).toBe(false);
  });
});
