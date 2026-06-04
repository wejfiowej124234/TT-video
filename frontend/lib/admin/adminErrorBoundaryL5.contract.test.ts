import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

/** VIS-05/07：Admin 路由 error 边界使用 adminUi token。 */
describe("admin error boundary L5 (①)", () => {
  const errorPage = readFileSync(join(__dir, "..", "..", "app", "admin", "error.tsx"), "utf8");

  it("uses adminUi error button tokens", () => {
    expect(errorPage).toContain("adminErrorRetryBtnClass");
    expect(errorPage).toContain("adminErrorSecondaryBtnClass");
    expect(errorPage).not.toMatch(/bg-travel-500 px-4 py-2 text-small font-medium text-white/);
  });
});
