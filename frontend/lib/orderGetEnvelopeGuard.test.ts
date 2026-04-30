import { describe, expect, it } from "vitest";
import { apiOrderSliceMatchesRoute, parseApiOrderId } from "./orderGetEnvelopeGuard";

describe("orderGetEnvelopeGuard", () => {
  it("parseApiOrderId prefers order_id then id", () => {
    expect(parseApiOrderId({ order_id: "  a  ", id: "b" })).toBe("a");
    expect(parseApiOrderId({ id: "c" })).toBe("c");
  });

  it("apiOrderSliceMatchesRoute", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    expect(apiOrderSliceMatchesRoute({ order_id: id }, id)).toBe(true);
    expect(apiOrderSliceMatchesRoute({ id }, id)).toBe(true);
    expect(apiOrderSliceMatchesRoute({ order_id: "other" }, id)).toBe(false);
    expect(apiOrderSliceMatchesRoute(null, id)).toBe(false);
    expect(apiOrderSliceMatchesRoute({}, id)).toBe(false);
  });
});
