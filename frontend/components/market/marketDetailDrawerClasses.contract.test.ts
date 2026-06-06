import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("market detail drawer classes (theme V1)", () => {
  it("uses warm focus and primary CTA tokens not cyan/travel", () => {
    const src = readFileSync(join(import.meta.dirname, "marketDetailDrawerClasses.ts"), "utf8");
    expect(src).toContain("TT_MARKETING_BTN_MARKET_PRIMARY");
    expect(src).toContain("drawerCloseFocus");
    expect(src).not.toContain("focus-visible:ring-cyan-400");
    expect(src).not.toContain("bg-travel-500");
    expect(src).not.toContain("text-ref-cyan/90");
    expect(src).not.toMatch(/border-white\/25/);
    expect(src).not.toMatch(/bg-white\/\[0\.06\]/);
  });
});
