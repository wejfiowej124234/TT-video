import { describe, expect, it } from "vitest";
import { buildLoginReturnPathWithQuery } from "./marketLoginReturnPath";

describe("buildLoginReturnPathWithQuery", () => {
  it("preserves pathname and query for market travel", () => {
    expect(
      buildLoginReturnPathWithQuery("/market", "view=orders&country=JP&city=Tokyo", "/market"),
    ).toBe("/market?view=orders&country=JP&city=Tokyo");
  });

  it("strips leading ? from search string", () => {
    expect(buildLoginReturnPathWithQuery("/market", "?view=guides", "/market")).toBe(
      "/market?view=guides",
    );
  });

  it("uses fallback when pathname empty or root", () => {
    expect(buildLoginReturnPathWithQuery("", "", "/market")).toBe("/market");
    expect(buildLoginReturnPathWithQuery("/", "view=split", "/market")).toBe("/market?view=split");
    expect(buildLoginReturnPathWithQuery(null, "guide_id=g1", "/market")).toBe("/market?guide_id=g1");
  });

  it("supports orders list base", () => {
    expect(
      buildLoginReturnPathWithQuery("/orders", "book_guide=x", "/orders"),
    ).toBe("/orders?book_guide=x");
  });
});
