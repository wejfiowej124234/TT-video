import { describe, expect, it } from "vitest";
import { parseGuideDetailForRoute } from "./guideDetailRoutePayload";

describe("parseGuideDetailForRoute", () => {
  it("accepts object whose id matches route", () => {
    const g = { id: "abc", city: "X" };
    expect(parseGuideDetailForRoute(g, "abc")).toEqual(g);
  });

  it("rejects null, array, or non-object", () => {
    expect(parseGuideDetailForRoute(null, "abc")).toBeNull();
    expect(parseGuideDetailForRoute([], "abc")).toBeNull();
    expect(parseGuideDetailForRoute("x", "abc")).toBeNull();
  });

  it("rejects missing or mismatched id", () => {
    expect(parseGuideDetailForRoute({ city: "Y" }, "abc")).toBeNull();
    expect(parseGuideDetailForRoute({ id: "other" }, "abc")).toBeNull();
  });

  it("trims ids", () => {
    expect(parseGuideDetailForRoute({ id: "  abc  " }, "abc")).toEqual({ id: "  abc  " });
  });
});
