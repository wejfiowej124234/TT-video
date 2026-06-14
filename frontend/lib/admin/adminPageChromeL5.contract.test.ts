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
    else if (name.endsWith("PageMain.tsx") || name.endsWith("PageInner.tsx")) out.push(p);
  }
  return out;
}

/** ① L5：Admin 页身须用 List/Detail/Queue Chrome，禁止裸 `main` + inner token。 */
describe("admin page chrome L5 (①)", () => {
  const adminAppRoot = join(__dir, "..", "..", "app", "admin");
  const CHROME_MARKERS = [
    "AdminListPageChrome",
    "AdminDetailPageChrome",
    "AdminQueueListPageChrome",
    /** CMS catalog · Official/Growth ops plane stack (→ AdminDetailPageChrome) */
    "AdminContentPageShell",
    "OpsPlanePageShell",
  ] as const;

  it("PageMain/PageInner use AdminListPageChrome or AdminDetailPageChrome", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      const src = readFileSync(file, "utf8");
      const usesChrome = CHROME_MARKERS.some((m) => src.includes(m));
      if (!usesChrome) offenders.push(`${file.replace(/\\/g, "/")} (missing chrome)`);
      else if (src.includes("<main className={TT_ADMIN_PAGE_INNER") || /<main\s+className=/.test(src)) {
        offenders.push(`${file.replace(/\\/g, "/")} (raw main)`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
