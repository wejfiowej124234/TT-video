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

  it("hides strip while capabilities boot on subpages", () => {
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: false,
        capabilitiesUnavailable: false,
        loading: true,
        canApprove: false,
        maintainerUi: false,
        onWorkspace: false,
      }),
    ).toBe(false);
  });

  it("hides strip on workspace while capabilities boot", () => {
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: false,
        capabilitiesUnavailable: false,
        loading: true,
        canApprove: false,
        maintainerUi: false,
        onWorkspace: true,
      }),
    ).toBe(false);
  });

  it("hides strip on home inbox focus when capabilities are healthy", () => {
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: true,
        capabilitiesUnavailable: false,
        loading: false,
        canApprove: true,
        maintainerUi: true,
        shellPreviewActive: true,
        homeInboxFocus: true,
      }),
    ).toBe(false);
  });

  it("still shows strip on home inbox focus when capabilities unavailable", () => {
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: true,
        capabilitiesUnavailable: true,
        loading: false,
        canApprove: false,
        maintainerUi: false,
        homeInboxFocus: true,
      }),
    ).toBe(true);
  });
});
