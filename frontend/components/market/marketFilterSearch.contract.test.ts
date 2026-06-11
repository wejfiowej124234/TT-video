import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(name: string): string {
  return readFileSync(join(ROOT, "components", "market", name), "utf8");
}

describe("/market filter bar (travel reservation)", () => {
  it("StickyFilterBar no longer exposes standalone search input", () => {
    const src = read("StickyFilterBar.tsx");
    expect(src).not.toContain('type="search"');
    expect(src).not.toContain("data-tt-market-filter-search");
    expect(src).not.toContain("market_filter_search_placeholder");
  });

  it("StickyFilterBar keeps country/city/advanced filter affordances", () => {
    const src = read("StickyFilterBar.tsx");
    expect(src).toContain("filter_label_country");
    expect(src).toContain("filter_expand");
    expect(src).toContain("advancedFilterPanelId");
  });
});
