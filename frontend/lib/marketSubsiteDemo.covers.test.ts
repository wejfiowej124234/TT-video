import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const demoSrc = readFileSync(join(import.meta.dirname, "marketSubsiteDemo.ts"), "utf8");
const ids = [...demoSrc.matchAll(/unsplash\("([^"]+)"\)/g)].map((m) => m[1]);

describe("marketSubsiteDemo cover URLs", () => {
  it("uses only reachable Unsplash photo ids (no 404 slugs in demo data)", () => {
    const knownDead = new Set([
      "photo-1564890369478-cc83c8abdff4",
      "photo-1619983081563-430f4e6a527a",
    ] as const);
    const overlap = ids.filter((id) => knownDead.has(id));
    expect(overlap, `replace dead Unsplash ids: ${overlap.join(", ")}`).toEqual([]);
  });

  it("declares demo listing covers", () => {
    expect(ids.length).toBeGreaterThan(10);
  });
});
