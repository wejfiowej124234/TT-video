import { describe, expect, it } from "vitest";
import { isDisplayableSnapshotHash } from "./snapshotHashDisplay";

const valid = `0x${"a".repeat(64)}` as const;

describe("isDisplayableSnapshotHash", () => {
  it("accepts 32-byte hex", () => {
    expect(isDisplayableSnapshotHash(valid)).toBe(true);
  });
  it("rejects empty and whitespace", () => {
    expect(isDisplayableSnapshotHash(null)).toBe(false);
    expect(isDisplayableSnapshotHash("")).toBe(false);
    expect(isDisplayableSnapshotHash("   ")).toBe(false);
  });
  it("rejects wrong length hex", () => {
    expect(isDisplayableSnapshotHash("0xaa")).toBe(false);
  });
  it("rejects all-zero placeholder (B-031)", () => {
    expect(isDisplayableSnapshotHash(`0x${"0".repeat(64)}`)).toBe(false);
  });
});
