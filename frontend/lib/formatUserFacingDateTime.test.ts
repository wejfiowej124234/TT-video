import { describe, expect, it } from "vitest";
import { formatUserFacingDateTime } from "@/lib/formatUserFacingDateTime";

describe("formatUserFacingDateTime", () => {
  it("formats ISO to locale short datetime", () => {
    const out = formatUserFacingDateTime("2026-06-02T11:50:19.649Z", "zh-CN", "—");
    expect(out).not.toContain("T11:50:19");
    expect(out.length).toBeGreaterThan(4);
  });

  it("returns fallback for empty input", () => {
    expect(formatUserFacingDateTime(null, "en", "—")).toBe("—");
  });
});
