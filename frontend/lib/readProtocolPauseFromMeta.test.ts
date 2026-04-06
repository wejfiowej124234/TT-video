import { describe, expect, it } from "vitest";
import { readProtocolPauseFromMeta } from "./readProtocolPauseFromMeta";

describe("readProtocolPauseFromMeta", () => {
  it("returns false when meta is null", () => {
    expect(readProtocolPauseFromMeta(null)).toBe(false);
  });

  it("returns false when pause is missing", () => {
    expect(readProtocolPauseFromMeta({ chain: {} })).toBe(false);
  });

  it("returns true when pause.enabled is true", () => {
    expect(readProtocolPauseFromMeta({ pause: { enabled: true } })).toBe(true);
  });

  it("returns false when pause.enabled is false or non-boolean", () => {
    expect(readProtocolPauseFromMeta({ pause: { enabled: false } })).toBe(false);
    expect(readProtocolPauseFromMeta({ pause: { enabled: "1" } } as Record<string, unknown>)).toBe(false);
  });
});
