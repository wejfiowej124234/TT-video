import { describe, expect, it } from "vitest";
import { formatApiPathDisplayValue } from "./financeReconciliationPathValue";

const NA = "data_unavailable";

describe("formatApiPathDisplayValue", () => {
  it("returns label for null, undefined, empty string, NaN, object", () => {
    expect(formatApiPathDisplayValue(null, NA)).toBe(NA);
    expect(formatApiPathDisplayValue(undefined, NA)).toBe(NA);
    expect(formatApiPathDisplayValue("", NA)).toBe(NA);
    expect(formatApiPathDisplayValue("   ", NA)).toBe(NA);
    expect(formatApiPathDisplayValue(Number.NaN, NA)).toBe(NA);
    expect(formatApiPathDisplayValue(Number.POSITIVE_INFINITY, NA)).toBe(NA);
    expect(formatApiPathDisplayValue({ a: 1 }, NA)).toBe(NA);
    expect(formatApiPathDisplayValue([1], NA)).toBe(NA);
  });

  it("preserves numeric zero", () => {
    expect(formatApiPathDisplayValue(0, NA)).toBe("0");
    expect(formatApiPathDisplayValue(-0, NA)).toBe("0");
  });

  it("formats boolean and non-empty string", () => {
    expect(formatApiPathDisplayValue(true, NA)).toBe("true");
    expect(formatApiPathDisplayValue(false, NA)).toBe("false");
    expect(formatApiPathDisplayValue("ok", NA)).toBe("ok");
  });
});
