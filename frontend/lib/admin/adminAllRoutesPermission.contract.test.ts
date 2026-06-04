import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { adminPermissionForPathname } from "./adminRoutePermission";

const FE = join(dirname(fileURLToPath(import.meta.url)), "../..");

function collectAdminPageRoutes(dir: string, base = "/admin"): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "api") continue;
      const seg = name.startsWith("[") && name.endsWith("]") ? "sample-id" : name;
      out.push(...collectAdminPageRoutes(full, `${base}/${seg}`));
      continue;
    }
    if (name === "page.tsx") out.push(base);
  }
  return out;
}

describe("admin all routes permission map", () => {
  it("every app/admin page has a non-null permission (except /admin home)", () => {
    const routes = collectAdminPageRoutes(join(FE, "app/admin"));
    expect(routes.length).toBeGreaterThan(60);
    const missing = routes.filter(
      (r) => r !== "/admin" && adminPermissionForPathname(r) === null,
    );
    expect(missing, `unmapped: ${missing.join(", ")}`).toEqual([]);
  });
});
