import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTsx(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const RAW_LIST_LOADING =
  /<p\b[^>]*className="[^"]*text-body text-ink-(500|600)[^"]*"[^>]*role="status"/;

/** HON-03：StatusBlock / 列表页统一 loading 组件。 */
describe("admin loading L5 (①)", () => {
  const loading = readFileSync(
    join(__dir, "..", "..", "components", "admin", "AdminListLoadingStatus.tsx"),
    "utf8",
  );
  const adminAppRoot = join(__dir, "..", "..", "app", "admin");

  it("defines AdminListLoadingStatus marker", () => {
    expect(loading).toContain("data-tt-admin-list-loading");
    expect(loading).toContain('role="status"');
  });

  it("StatusBlock modules use AdminListLoadingStatus", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      if (!file.endsWith("StatusBlock.tsx")) continue;
      const src = readFileSync(file, "utf8");
      if (!src.includes("loading")) continue;
      if (!src.includes("AdminListLoadingStatus")) offenders.push(file.replace(/\\/g, "/"));
    }
    expect(offenders).toEqual([]);
  });

  it("list/table PageMain and sections avoid raw ink loading paragraphs", () => {
    const offenders: string[] = [];
    const rawLoadingParagraph =
      /<p\b[^>]*className="[^"]*text-ink-(500|600)[^"]*"[^>]*>\{t\("[^"]*loading/i;
    for (const file of walkTsx(adminAppRoot)) {
      const base = file.replace(/\\/g, "/");
      if (base.endsWith("loading.tsx") || base.endsWith("error.tsx")) continue;
      const src = readFileSync(file, "utf8");
      if (!rawLoadingParagraph.test(src)) continue;
      offenders.push(base);
    }
    expect(offenders).toEqual([]);
  });

  it("app/admin files using AdminListLoadingStatus import the component", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("AdminListLoadingStatus")) continue;
      if (!/import\s*\{[^}]*AdminListLoadingStatus/.test(src)) {
        offenders.push(file.replace(/\\/g, "/"));
      }
    }
    expect(offenders).toEqual([]);
  });
});
