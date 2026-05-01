import { describe, expect, it } from "vitest";
import { readChainOffMountedFromMeta } from "./readChainOffMountedFromMeta";

describe("readChainOffMountedFromMeta", () => {
  it("returns true when order_messages.chain_off_mounted is true", () => {
    expect(readChainOffMountedFromMeta({ order_messages: { chain_off_mounted: true } })).toBe(true);
  });

  it("returns false when chain_off_mounted is false", () => {
    expect(readChainOffMountedFromMeta({ order_messages: { chain_off_mounted: false } })).toBe(false);
  });

  it("returns null when missing or malformed", () => {
    expect(readChainOffMountedFromMeta(null)).toBeNull();
    expect(readChainOffMountedFromMeta({})).toBeNull();
    expect(readChainOffMountedFromMeta({ order_messages: {} })).toBeNull();
  });
});
