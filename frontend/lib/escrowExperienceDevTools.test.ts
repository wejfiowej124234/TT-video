import { describe, expect, it, vi, afterEach } from "vitest";
import {
  isEscrowExperienceDevToolsEnabled,
  truncateItineraryPreviewLine,
} from "./escrowExperienceDevTools";

describe("escrowExperienceDevTools", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("truncateItineraryPreviewLine trims and ellipsizes", () => {
    expect(truncateItineraryPreviewLine("  hello  ")).toBe("hello");
    expect(truncateItineraryPreviewLine("a".repeat(80), 10)).toBe(`${"a".repeat(10)}…`);
    expect(truncateItineraryPreviewLine("")).toBe("");
  });

  it("isEscrowExperienceDevToolsEnabled is opt-in via NEXT_PUBLIC_ESCROW_DEV_TOOLS", () => {
    vi.stubEnv("NEXT_PUBLIC_ESCROW_DEV_TOOLS", undefined);
    expect(isEscrowExperienceDevToolsEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_ESCROW_DEV_TOOLS", "1");
    expect(isEscrowExperienceDevToolsEnabled()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_ESCROW_DEV_TOOLS", "true");
    expect(isEscrowExperienceDevToolsEnabled()).toBe(true);
  });
});
