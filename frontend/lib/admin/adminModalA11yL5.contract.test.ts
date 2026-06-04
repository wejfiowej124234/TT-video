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

/** ① A11y：Admin Modal/Wizard 壳层（ADM-UX-A11Y-01 子集）。 */
describe("admin modal a11y L5 (①)", () => {
  const adminAppRoot = join(__dir, "..", "..", "app", "admin");

  it("Modal/Wizard components expose dialog semantics", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      const base = file.replace(/\\/g, "/").split("/").pop() ?? "";
      if (!/(Modal|Wizard)\.tsx$/.test(base)) continue;
      const src = readFileSync(file, "utf8");
      if (!src.includes('role="dialog"')) offenders.push(`${file} (missing role=dialog)`);
      else if (!src.includes('aria-modal="true"')) offenders.push(`${file} (missing aria-modal)`);
      else if (!/aria-labelledby=/.test(src)) offenders.push(`${file} (missing aria-labelledby)`);
    }
    expect(offenders).toEqual([]);
  });

  it("all Modal/Wizard use AdminDialogFocusPanel", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      const base = file.replace(/\\/g, "/").split("/").pop() ?? "";
      if (!/(Modal|Wizard)\.tsx$/.test(base)) continue;
      const src = readFileSync(file, "utf8");
      if (!src.includes("AdminDialogFocusPanel")) offenders.push(base);
    }
    expect(offenders).toEqual([]);
  });
});
