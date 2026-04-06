import { describe, expect, it } from "vitest";
import { size } from "viem";
import { tryOrderUuidToOrderIdBytes32 } from "./orderIdBytes32";

describe("tryOrderUuidToOrderIdBytes32", () => {
  it("returns null for non-uuid", () => {
    expect(tryOrderUuidToOrderIdBytes32("not-a-uuid")).toBeNull();
    expect(tryOrderUuidToOrderIdBytes32("")).toBeNull();
    expect(tryOrderUuidToOrderIdBytes32("1234567812345678123456781234567")).toBeNull();
    expect(tryOrderUuidToOrderIdBytes32("gggggggggggggggggggggggggggggggg")).toBeNull();
  });

  it("accepts dashed or undashed 32-hex (case-insensitive)", () => {
    const dashed = tryOrderUuidToOrderIdBytes32("11111111-1111-1111-1111-111111111111");
    const plain = tryOrderUuidToOrderIdBytes32("11111111111111111111111111111111");
    const upper = tryOrderUuidToOrderIdBytes32("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA");
    expect(dashed).not.toBeNull();
    expect(plain).not.toBeNull();
    expect(upper).not.toBeNull();
    expect(dashed).toBe(plain);
    expect(size(dashed!)).toBe(32);
  });

  it("left-pads uuid to 32 bytes", () => {
    const h = tryOrderUuidToOrderIdBytes32("00000000-0000-4000-8000-0000000000ab");
    expect(h).not.toBeNull();
    expect(size(h!)).toBe(32);
    expect(h!.toLowerCase().endsWith("000000000000400080000000000000ab")).toBe(true);
  });
});
