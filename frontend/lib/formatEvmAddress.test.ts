import { describe, expect, it } from "vitest";
import { shortEvmAddress } from "./formatEvmAddress";

describe("shortEvmAddress", () => {
  it("abbreviates long 0x address", () => {
    const a = "0x1234567890abcdef1234567890abcdef12345678";
    expect(shortEvmAddress(a)).toBe("0x123456…345678");
  });

  it("returns short strings unchanged", () => {
    expect(shortEvmAddress("0xabc")).toBe("0xabc");
    expect(shortEvmAddress("  0xshort  ")).toBe("0xshort");
  });

  it("respects custom head and tail lengths", () => {
    const a = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    expect(shortEvmAddress(a, 4, 4)).toBe("0xaa…aaaa");
  });

  it("returns full string when length <= head + tail + 1", () => {
    const s = "0x1234567890123";
    expect(s.length).toBe(15);
    expect(shortEvmAddress(s, 8, 6)).toBe(s);
  });
});
