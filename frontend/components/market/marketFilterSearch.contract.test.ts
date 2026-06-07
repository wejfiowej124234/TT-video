import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(name: string): string {
  return readFileSync(join(ROOT, "components", "market", name), "utf8");
}

describe("/market filter search affordance (RP-001)", () => {
  it("StickyFilterBar exposes type=search with machine-readable anchor", () => {
    const src = read("StickyFilterBar.tsx");
    expect(src).toContain('type="search"');
    expect(src).toContain('data-tt-market-filter-search="1"');
    expect(src).toContain('role="search"');
    expect(src).toContain("market_filter_search_placeholder");
    expect(src).toContain("market_filter_search_label");
  });

  it("uses warm market search tokens from marketingUi", () => {
    const src = read("StickyFilterBar.tsx");
    expect(src).toContain("marketFilterSearchInput");
    expect(src).not.toContain("ref-cyan");
  });
});
