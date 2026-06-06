import { describe, expect, it } from "vitest";
import { buildLoginReturnPathWithQuery, buildPathnameSearchHref } from "./marketLoginReturnPath";

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

describe("buildPathnameSearchHref", () => {
  it("preserves pathname and query for router.replace", () => {
    expect(buildPathnameSearchHref("/market", "view=orders&country=JP")).toBe(
      "/market?view=orders&country=JP",
    );
  });

  it("strips leading ? from search string", () => {
    expect(buildPathnameSearchHref("/orders", "?tab=open")).toBe("/orders?tab=open");
  });

  it("returns pathname only when query empty", () => {
    expect(buildPathnameSearchHref("/community/me/reports/r1", "")).toBe(
      "/community/me/reports/r1",
    );
  });
});
