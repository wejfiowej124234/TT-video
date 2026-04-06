import { describe, expect, it } from "vitest";
import { normalizeChainSyncReadStatus } from "./types";

describe("normalizeChainSyncReadStatus (B-038)", () => {
  it("normalizes casing", () => {
    expect(normalizeChainSyncReadStatus("PENDING")).toBe("pending");
    expect(normalizeChainSyncReadStatus(" Confirmed ")).toBe("confirmed");
  });

  it("maps unknown literals to unknown", () => {
    expect(normalizeChainSyncReadStatus("weird")).toBe("unknown");
  });
});
