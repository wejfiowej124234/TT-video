import { describe, expect, it } from "vitest";

import { shouldShowAdminCapabilityStrip } from "./adminCapabilityStripVisibility";

describe("adminCapabilityStripVisibility", () => {
  it("hides strip for healthy approvers unless maintainer UI", () => {
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: true,
        capabilitiesUnavailable: false,
        loading: false,
        canApprove: true,
        maintainerUi: false,
      }),
    ).toBe(false);
  });

  it("shows strip for Ops without approve", () => {
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: true,
        capabilitiesUnavailable: false,
        loading: false,
        canApprove: false,
        maintainerUi: false,
      }),
    ).toBe(true);
  });

  it("shows strip while capabilities loading", () => {
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: false,
        capabilitiesUnavailable: false,
        loading: true,
        canApprove: false,
        maintainerUi: false,
      }),
    ).toBe(true);
  });
});
