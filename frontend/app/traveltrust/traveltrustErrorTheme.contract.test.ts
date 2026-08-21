import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ERROR_TSX = join(process.cwd(), "app", "traveltrust", "error.tsx");

describe("traveltrust error boundary theme (wave B · ①)", () => {
  it("uses warm marketing primary + deepShell focus, no ref-cyan chrome", () => {
    const src = readFileSync(ERROR_TSX, "utf8");
    expect(src).toContain("TT_MARKETING_BTN_MARKET_PRIMARY");
    expect(src).toContain("deepShellInlineLinkFocusClasses");
    expect(src).toContain("border-ref-sun/");
    expect(src).not.toMatch(/ref-cyan/);
    expect(src).not.toMatch(/communityCardLinkFocus/);
  });
});
