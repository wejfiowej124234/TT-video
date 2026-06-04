import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const appAdmin = join(__dir, "..", "..", "app", "admin");

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTsx(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

function appliedFiltersUiDumpLines(src: string): string[] {
  return src
    .split("\n")
    .filter(
      (line) =>
        /JSON\.stringify\(appliedFilters\)/.test(line) && !/appliedFiltersKey/.test(line),
    );
}

/** ① 第二十四批 UX · 全 Admin 列表 applied_filters 人话（非 JSON dump）。 */
describe("admin batch24 UX L5 (①)", () => {
  const fmt = readFileSync(join(__dir, "formatAdminAppliedFiltersHuman.ts"), "utf8");

  it("formatAdminAppliedFiltersHuman SSOT exists", () => {
    expect(fmt).toContain("formatAdminAppliedFiltersHuman");
  });

  it("app/admin tsx avoids JSON.stringify(appliedFilters) in UI", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(appAdmin)) {
      const src = readFileSync(file, "utf8");
      if (appliedFiltersUiDumpLines(src).length > 0) {
        offenders.push(file.replace(/\\/g, "/"));
      }
    }
    expect(offenders).toEqual([]);
  });
});
