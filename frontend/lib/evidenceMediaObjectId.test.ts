import { describe, expect, it } from "vitest";
import { evidenceSignedUrlObjectId } from "./evidenceMediaObjectId";

describe("evidenceSignedUrlObjectId", () => {
  const oid = "550e8400-e29b-41d4-a716-446655440000";

  it("builds evidence pipe id with lowercase hash", () => {
    expect(evidenceSignedUrlObjectId(oid, "AbCdEf01")).toBe(`evidence|${oid}|abcdef01`);
  });

  it("strips 0x prefix", () => {
    expect(evidenceSignedUrlObjectId(oid, "0xAA")).toBe(`evidence|${oid}|aa`);
  });

  it("returns null for invalid uuid", () => {
    expect(evidenceSignedUrlObjectId("not-a-uuid", "aa")).toBeNull();
  });

  it("returns null for non-hex hash", () => {
    expect(evidenceSignedUrlObjectId(oid, "gg")).toBeNull();
  });

  it("returns null when hash too long", () => {
    expect(evidenceSignedUrlObjectId(oid, "a".repeat(129))).toBeNull();
  });
});
