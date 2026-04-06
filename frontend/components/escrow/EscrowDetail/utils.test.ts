import { describe, expect, it } from "vitest";
import { orderAmountToBigInt, sameWallet } from "./utils";

describe("orderAmountToBigInt", () => {
  it("returns undefined for empty / missing", () => {
    expect(orderAmountToBigInt(undefined)).toBeUndefined();
    expect(orderAmountToBigInt("")).toBeUndefined();
  });

  it("converts USD-like strings to 6-decimal USDC units", () => {
    expect(orderAmountToBigInt("100")).toBe(BigInt(100_000_000));
    expect(orderAmountToBigInt("0")).toBe(BigInt(0));
    expect(orderAmountToBigInt("1.5")).toBe(BigInt(1_500_000));
  });

  it("strips thousands separators (US-style)", () => {
    expect(orderAmountToBigInt("1,000")).toBe(BigInt(1_000_000_000));
    expect(orderAmountToBigInt("1,234.56")).toBe(BigInt(1_234_560_000));
  });

  it("returns undefined for invalid or negative", () => {
    expect(orderAmountToBigInt("x")).toBeUndefined();
    expect(orderAmountToBigInt("-1")).toBeUndefined();
  });
});

describe("sameWallet", () => {
  it("is false when either side missing", () => {
    expect(sameWallet(null, "0xabc")).toBe(false);
    expect(sameWallet("0xabc", "")).toBe(false);
  });

  it("compares case-insensitive and optional 0x", () => {
    expect(sameWallet("0xAbCdef1234567890123456789012345678901234", "0xabcdef1234567890123456789012345678901234")).toBe(
      true
    );
    expect(sameWallet("ABCDEF1234567890123456789012345678901234", "0xabcdef1234567890123456789012345678901234")).toBe(
      true
    );
    expect(sameWallet("0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222")).toBe(
      false
    );
  });
});
