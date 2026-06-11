import { describe, expect, it } from "vitest";
import { canViewerAcceptOrder, viewerIsGuideForBilateralOrder } from "./canViewerAcceptOrder";

describe("canViewerAcceptOrder", () => {
  const touristId = "11111111-1111-4111-8111-111111111111";
  const guideUserId = "22222222-2222-4222-8222-222222222222";
  const guideRowId = "33333333-3333-4333-8333-333333333333";
  const otherGuideRowId = "44444444-4444-4444-8444-444444444444";

  it("returns false without guide profile", () => {
    expect(
      canViewerAcceptOrder({
        meUserId: guideUserId,
        orderTouristId: touristId,
      }),
    ).toBe(false);
  });

  it("returns false when viewer is order tourist (even with guide profile)", () => {
    expect(
      canViewerAcceptOrder({
        meUserId: touristId,
        meGuideRowId: guideRowId,
        orderTouristId: touristId,
      }),
    ).toBe(false);
  });

  it("returns true for open grab when viewer is guide and not tourist", () => {
    expect(
      canViewerAcceptOrder({
        meUserId: guideUserId,
        meGuideRowId: guideRowId,
        orderTouristId: touristId,
      }),
    ).toBe(true);
  });

  it("returns true when assigned guide matches viewer guide row", () => {
    expect(
      canViewerAcceptOrder({
        meUserId: guideUserId,
        meGuideRowId: guideRowId,
        orderTouristId: touristId,
        orderGuideId: guideRowId,
      }),
    ).toBe(true);
  });

  it("returns false when order is assigned to another guide", () => {
    expect(
      canViewerAcceptOrder({
        meUserId: guideUserId,
        meGuideRowId: guideRowId,
        orderTouristId: touristId,
        orderGuideId: otherGuideRowId,
      }),
    ).toBe(false);
  });
});

describe("viewerIsGuideForBilateralOrder", () => {
  const touristId = "11111111-1111-4111-8111-111111111111";
  const guideUserId = "22222222-2222-4222-8222-222222222222";
  const guideRowId = "33333333-3333-4333-8333-333333333333";

  it("returns false for order tourist even before getMe guide profile hydrates", () => {
    expect(
      viewerIsGuideForBilateralOrder({
        meUserId: touristId,
        orderTouristId: touristId,
        orderGuideId: guideRowId,
      }),
    ).toBe(false);
  });

  it("returns true for assigned guide participant before getMe guide profile hydrates", () => {
    expect(
      viewerIsGuideForBilateralOrder({
        meUserId: guideUserId,
        orderTouristId: touristId,
        orderGuideId: guideRowId,
      }),
    ).toBe(true);
  });
});
