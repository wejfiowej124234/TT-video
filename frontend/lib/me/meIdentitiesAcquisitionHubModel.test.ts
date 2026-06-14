import { describe, expect, it } from "vitest";
import { deriveMeIdentitiesAcquisitionCardView } from "@/lib/me/meIdentitiesAcquisitionHubModel";
import { ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF } from "@/lib/me/meIdentitiesCoreCardModel";

describe("meIdentitiesAcquisitionHubModel (PD-009 capability)", () => {
  it("always routes to acquisition subsite workspace", () => {
    expect(deriveMeIdentitiesAcquisitionCardView(null).href).toBe(ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF);
    expect(deriveMeIdentitiesAcquisitionCardView("inactive").href).toBe(ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF);
    expect(deriveMeIdentitiesAcquisitionCardView("active").href).toBe(ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF);
  });

  it("maps inactive slot to browse-ready pill (not hidden apply)", () => {
    const view = deriveMeIdentitiesAcquisitionCardView("inactive");
    expect(view.statusLabelKey).toBe("me_identities_acquisition_state_browse_ready");
    expect(view.showStatus).toBe(true);
    expect(view.ctaLabelKey).toBe("me_identities_card_acquisition_workspace_cta");
  });

  it("maps active slot to publish-ready", () => {
    const view = deriveMeIdentitiesAcquisitionCardView("active");
    expect(view.statusLabelKey).toBe("me_identities_acquisition_state_publish_ready");
    expect(view.statusPillState).toBe("active");
  });
});
