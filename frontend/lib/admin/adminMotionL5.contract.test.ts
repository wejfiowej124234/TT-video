import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const adminComponents = join(__dir, "..", "..", "components", "admin");

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTsx(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** U9 · ① Admin 动效克制：transition/animate 须带 motion-reduce 回退。 */
describe("admin motion L5 (① · U9)", () => {
  const adminUi = readFileSync(join(__dir, "..", "adminUi.ts"), "utf8");
  const loading = readFileSync(join(adminComponents, "AdminSubpageRouteLoading.tsx"), "utf8");

  it("defines motion tokens with motion-reduce", () => {
    expect(adminUi).toContain("ADMIN_MOTION_NAV_CLASS");
    expect(adminUi).toContain("ADMIN_MOTION_SKELETON_CLASS");
    expect(adminUi).toMatch(/ADMIN_MOTION_SKELETON_CLASS[\s\S]*motion-reduce:animate-none/);
  });

  it("route loading skeletons use ADMIN_MOTION_SKELETON_CLASS", () => {
    expect(loading).toContain("ADMIN_MOTION_SKELETON_CLASS");
    expect(loading).not.toMatch(/animate-pulse"(?!.*motion-reduce)/);
  });

  it("admin components with transition-colors include motion-reduce", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminComponents)) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("transition-colors") && !src.includes(" transition ")) continue;
      if (src.includes("motion-reduce:transition-none") || src.includes("ADMIN_MOTION_")) continue;
      if (!src.includes("transition")) continue;
      if (src.includes("transition") && !src.includes("motion-reduce")) {
        offenders.push(file.replace(/\\/g, "/"));
      }
    }
    expect(offenders).toEqual([]);
  });
});
