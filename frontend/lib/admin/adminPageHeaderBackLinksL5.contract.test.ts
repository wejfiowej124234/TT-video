import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const appAdmin = join(__dir, "..", "..", "app", "admin");

function walkPageHeaders(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkPageHeaders(p));
    else if (name.endsWith("PageHeader.tsx")) out.push(p);
  }
  return out;
}

/** ① 遗留 PageHeader 与 PageMain 顶栏 SSOT 对齐（防复活重复 observability 链）。 */
describe("admin PageHeader back links L5 (①)", () => {
  const headers = walkPageHeaders(appAdmin);

  it("observability links use data-tt-admin-back-observability-hub", () => {
    for (const file of headers) {
      const src = readFileSync(file, "utf8");
      if (!src.includes('href="/admin/observability"')) continue;
      expect(src, file).toContain("data-tt-admin-back-observability-hub");
    }
  });

  it("PageMain SSOT routes do not duplicate observability inside section wrappers", () => {
    const penalties = readFileSync(
      join(appAdmin, "community", "penalties", "AdminCommunityPenaltiesPageMain.tsx"),
      "utf8",
    );
    expect(penalties).toContain("AdminCommunityListHeaderAside");
    expect(penalties).not.toMatch(
      /AdminCommunityListHeaderAside[\s\S]{0,800}href="\/admin\/observability"/,
    );
  });
});
