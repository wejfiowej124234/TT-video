import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const appAdmin = join(fe, "app", "admin");

/** ① 第二十七批 UX · 核心列表 subtitle 产品化（L5 _subtitle 键 · 非 API dump 主文案）。 */
describe("admin batch27 UX L5 (①)", () => {
  const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");
  const users = readFileSync(join(appAdmin, "users", "AdminUsersPageMain.tsx"), "utf8");
  const reviews = readFileSync(join(appAdmin, "reviews", "AdminReviewsPageMain.tsx"), "utf8");
  const audit = readFileSync(join(appAdmin, "audit", "AdminAuditPageMain.tsx"), "utf8");
  const finance = readFileSync(join(appAdmin, "finance", "AdminFinancePageMain.tsx"), "utf8");

  it("defines L5 product subtitle keys in zh", () => {
    expect(zh).toContain("admin_users_subtitle_l5");
    expect(zh).toContain("admin_reviews_subtitle_l5");
    expect(zh).toContain("admin_audit_list_subtitle_l5");
    expect(zh).toContain("admin_finance_subtitle_l5");
    const usersL5 = zh.match(/admin_users_subtitle_l5:\s*"([^"]*)"/)?.[1] ?? "";
    expect(usersL5).not.toMatch(/GET \/api/);
  });

  it("core list pages use _subtitle_l5 on chrome", () => {
    expect(users).toContain("admin_users_subtitle_l5");
    expect(reviews).toContain("admin_reviews_subtitle_l5");
    expect(audit).toContain("admin_audit_list_subtitle_l5");
    expect(finance).toContain("admin_finance_subtitle_l5");
  });
});
