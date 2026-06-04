import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

/** ① 首页主 CTA：有待办计数用 inbox active CTA，fallback 用 idle。 */
describe("admin home primary CTAs L5 (①)", () => {
  const src = readFileSync(join(__dir, "AdminHomePrimaryCtas.tsx"), "utf8");

  it("uses ADMIN_INBOX_QUEUE_HREFS and score-based CTA classes", () => {
    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS");
    expect(src).toContain("ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS");
    expect(src).toContain("ADMIN_INBOX_TASK_CTA_IDLE_CLASS");
    expect(src).toMatch(/score\s*>\s*0/);
    expect(src).not.toContain("ADMIN_PRIMARY_ACTION_BTN_CLASS");
  });
});
