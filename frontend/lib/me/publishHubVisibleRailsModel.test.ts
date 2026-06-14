import { describe, expect, it } from "vitest";
import {
  publishHubShouldRenderRail,
  type PublishHubVisibleRailsSnapshot,
} from "@/lib/me/publishHubVisibleRailsModel";

const EMPTY: PublishHubVisibleRailsSnapshot = {
  tripOrderCount: 0,
  tripLoading: false,
  tripError: false,
  governanceProposalCount: 0,
  governanceLoading: false,
  governanceError: false,
  guideVisible: false,
  guideHasListing: false,
  guideLoading: false,
  guideError: false,
  stewardUnlocked: false,
  merchantUnlocked: false,
  merchantRowCount: 0,
  merchantLoading: false,
  merchantError: false,
  acquisitionUnlocked: false,
  acquisitionRowCount: 0,
  acquisitionLoading: false,
  acquisitionError: false,
};

describe("publishHubVisibleRailsModel", () => {
  it("shows any rail when filter is not all", () => {
    expect(
      publishHubShouldRenderRail({
        filter: "governance",
        rail: "governance",
        snapshot: EMPTY,
      }),
    ).toBe(true);
  });

  it("all view hides governance when steward off and empty", () => {
    expect(
      publishHubShouldRenderRail({ filter: "all", rail: "governance", snapshot: EMPTY }),
    ).toBe(false);
  });

  it("all view shows trip when orders exist", () => {
    expect(
      publishHubShouldRenderRail({
        filter: "all",
        rail: "trip",
        snapshot: { ...EMPTY, tripOrderCount: 1 },
      }),
    ).toBe(true);
  });

  it("all view shows acquisition only on load signal not unlock alone", () => {
    expect(
      publishHubShouldRenderRail({
        filter: "all",
        rail: "acquisition",
        snapshot: { ...EMPTY, acquisitionUnlocked: true },
      }),
    ).toBe(false);
    expect(
      publishHubShouldRenderRail({
        filter: "all",
        rail: "acquisition",
        snapshot: { ...EMPTY, acquisitionError: true },
      }),
    ).toBe(true);
  });

  it("all view hides unlocked empty merchant", () => {
    expect(
      publishHubShouldRenderRail({
        filter: "all",
        rail: "merchant",
        snapshot: { ...EMPTY, merchantUnlocked: true },
      }),
    ).toBe(false);
  });
});
