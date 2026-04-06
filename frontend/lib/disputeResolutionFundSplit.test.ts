import { describe, it, expect } from "vitest";
import {
  computeDisputeResolutionFundSplit,
  orderStateTriggersDisputeFundSplit,
} from "./disputeResolutionFundSplit";

describe("orderStateTriggersDisputeFundSplit", () => {
  it("is true for post-resolution states", () => {
    expect(orderStateTriggersDisputeFundSplit("refunded")).toBe(true);
    expect(orderStateTriggersDisputeFundSplit("partially_refunded")).toBe(true);
    expect(orderStateTriggersDisputeFundSplit("slashed")).toBe(true);
  });
  it("is false otherwise", () => {
    expect(orderStateTriggersDisputeFundSplit("completed")).toBe(false);
    expect(orderStateTriggersDisputeFundSplit("disputed")).toBe(false);
    expect(orderStateTriggersDisputeFundSplit(undefined)).toBe(false);
  });
});

describe("computeDisputeResolutionFundSplit", () => {
  it("splits partial refund without slash", () => {
    const x = computeDisputeResolutionFundSplit(100, 0.3, false);
    expect(x.tourist).toBe(30);
    expect(x.guide).toBe(70);
    expect(x.platformPool).toBe(0);
  });
  it("sends remainder to platform pool when slash", () => {
    const x = computeDisputeResolutionFundSplit(100, 0.5, true);
    expect(x.tourist).toBe(50);
    expect(x.guide).toBe(0);
    expect(x.platformPool).toBe(50);
  });
  it("full refund to tourist", () => {
    const x = computeDisputeResolutionFundSplit(100, 1, false);
    expect(x.tourist).toBe(100);
    expect(x.guide).toBe(0);
    expect(x.platformPool).toBe(0);
  });
});
