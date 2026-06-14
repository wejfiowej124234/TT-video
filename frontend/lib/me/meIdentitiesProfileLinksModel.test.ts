import { describe, expect, it } from "vitest";
import { meIdentitiesProfileLinks } from "@/lib/me/meIdentitiesProfileLinksModel";

describe("meIdentitiesProfileLinksModel", () => {
  it("returns acquisition profile for any logged-in user", () => {
    const links = meIdentitiesProfileLinks({ loggedIn: true, userRole: "tourist" });
    expect(links.map((l) => l.id)).toEqual(["acquisition"]);
  });

  it("includes guide profile when role is guide", () => {
    const links = meIdentitiesProfileLinks({ loggedIn: true, userRole: "guide" });
    expect(links.map((l) => l.id)).toEqual(["acquisition", "guide"]);
  });

  it("includes guide profile when guide slot is active", () => {
    const links = meIdentitiesProfileLinks({
      loggedIn: true,
      userRole: "tourist",
      guideSlotState: "active",
    });
    expect(links.map((l) => l.id)).toContain("guide");
  });

  it("excludes merchant profile when provider slot pending only", () => {
    const links = meIdentitiesProfileLinks({
      loggedIn: true,
      userRole: "tourist",
      merchantSlotState: "pending",
    });
    expect(links.map((l) => l.id)).toEqual(["acquisition"]);
  });

  it("includes merchant profile when provider slot active", () => {
    const links = meIdentitiesProfileLinks({
      loggedIn: true,
      userRole: "tourist",
      merchantSlotState: "active",
    });
    expect(links.map((l) => l.id)).toContain("merchant");
  });

  it("returns empty when logged out", () => {
    expect(meIdentitiesProfileLinks({ loggedIn: false })).toEqual([]);
  });
});
