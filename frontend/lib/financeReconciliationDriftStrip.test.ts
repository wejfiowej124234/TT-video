import { describe, expect, it } from "vitest";
import {
  deriveChainAlignmentStatus,
  summarizeDeltaForHub,
} from "./financeReconciliationDriftStrip";

const NA = "data_unavailable";

describe("deriveChainAlignmentStatus", () => {
  it("maps true/false/undefined", () => {
    expect(deriveChainAlignmentStatus(true)).toBe("not_aligned");
    expect(deriveChainAlignmentStatus(false)).toBe("aligned");
    expect(deriveChainAlignmentStatus(undefined)).toBe("unknown");
  });
});

describe("summarizeDeltaForHub", () => {
  it("uses label for undefined and empty string", () => {
    expect(summarizeDeltaForHub(undefined, NA)).toBe(NA);
    expect(summarizeDeltaForHub("", NA)).toBe(NA);
    expect(summarizeDeltaForHub("   ", NA)).toBe(NA);
  });

  it("summarizes array and object without summing contents", () => {
    expect(summarizeDeltaForHub([1, 2, 3], NA)).toBe("delta.length=3");
    expect(summarizeDeltaForHub({ a: 1, b: 2 }, NA)).toBe("delta.object keys=2");
  });
});
