import { describe, expect, it } from "vitest";
import { parseDistributionIdForClaim } from "./distributionClaimBytes32";

describe("distributionClaimBytes32 (P5-4-1)", () => {
  it("accepts full-width bytes32 hex (lowercase)", () => {
    const h = "0x" + "ab".padStart(64, "0");
    expect(parseDistributionIdForClaim(h)).toBe(h);
  });

  /// 与 `db::distribution_uuid_to_bytes32_hex_for_claim(Uuid::from_u128(0x00ab))` 一致。
  it("maps u128=0x00ab into lower 128 bits of bytes32", () => {
    const exp = "0x00000000000000000000000000000000000000000000000000000000000000ab";
    expect(parseDistributionIdForClaim(exp)).toBe(exp);
  });

  it("parses a v4-shaped UUID to deterministic bytes32", () => {
    const fromUuid = parseDistributionIdForClaim("00000000-0000-4000-8000-0000000000ab");
    expect(fromUuid).toBe(
      "0x00000000000000000000000000000000000000000000400080000000000000ab"
    );
  });

  it("returns null for garbage", () => {
    expect(parseDistributionIdForClaim("not-a-uuid")).toBeNull();
    expect(parseDistributionIdForClaim("0x01")).toBeNull();
  });
});
