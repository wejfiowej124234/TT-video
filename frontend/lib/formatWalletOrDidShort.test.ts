import { describe, expect, it } from "vitest";
import { formatWalletOrDidShort } from "./formatWalletOrDidShort";

describe("formatWalletOrDidShort", () => {
  it("returns null for empty", () => {
    expect(formatWalletOrDidShort(null)).toBeNull();
    expect(formatWalletOrDidShort("")).toBeNull();
    expect(formatWalletOrDidShort("   ")).toBeNull();
  });

  it("abbreviates long 0x address", () => {
    const full = "0x1234567890abcdef1234567890abcdef12345678";
    expect(formatWalletOrDidShort(full)).toBe("0x1234…5678");
  });

  it("keeps short hex tail as-is", () => {
    expect(formatWalletOrDidShort("0xabc")).toBe("0xabc");
  });

  it("abbreviates long non-hex strings", () => {
    expect(formatWalletOrDidShort("did:example:verylongidentifierhere")).toMatch(/^did:ex…here$/);
  });
});
