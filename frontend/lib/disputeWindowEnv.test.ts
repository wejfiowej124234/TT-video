import { afterEach, describe, expect, it } from "vitest";
import { getDisputeWindowSeconds } from "./disputeWindowEnv";

describe("getDisputeWindowSeconds", () => {
  const key = "NEXT_PUBLIC_DISPUTE_WINDOW_SECONDS";
  const orig = process.env[key];

  afterEach(() => {
    if (orig === undefined) delete process.env[key];
    else process.env[key] = orig;
  });

  it("returns 7 days when unset", () => {
    delete process.env[key];
    expect(getDisputeWindowSeconds()).toBe(604_800);
  });

  it("returns 7 days for empty or whitespace-only", () => {
    process.env[key] = "   ";
    expect(getDisputeWindowSeconds()).toBe(604_800);
  });

  it("parses positive integer seconds", () => {
    process.env[key] = "86400";
    expect(getDisputeWindowSeconds()).toBe(86_400);
  });

  it("trims and floors non-integer", () => {
    process.env[key] = "  172800.9 ";
    expect(getDisputeWindowSeconds()).toBe(172_800);
  });

  it("returns default for non-finite, non-positive, or over max", () => {
    for (const v of ["0", "-1", "nan", "1e400", String(365 * 86_400 + 1)]) {
      process.env[key] = v;
      expect(getDisputeWindowSeconds()).toBe(604_800);
    }
  });

  it("accepts max boundary one year in seconds", () => {
    process.env[key] = String(365 * 86_400);
    expect(getDisputeWindowSeconds()).toBe(365 * 86_400);
  });
});
