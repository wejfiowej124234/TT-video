import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** ① 第二十六批 UX · zh 业务命名统一（去 Admin 前缀 · 能力条人话）。 */
describe("admin batch26 UX L5 (①)", () => {
  const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");
  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");
  const capStrip = readFileSync(join(fe, "components", "admin", "AdminActorCapabilityStrip.tsx"), "utf8");

  const zhTitles = [
    "admin_users_title",
    "admin_orders_title",
    "admin_disputes_title",
    "admin_reviews_title",
    "admin_audit_list_title",
    "admin_user_detail_title",
    "admin_order_detail_title",
    "admin_finance_title",
  ] as const;

  it("zh admin list titles avoid English Admin prefix", () => {
    for (const key of zhTitles) {
      const m = zh.match(new RegExp(`${key}:\\s*"([^"]+)"`));
      expect(m?.[1], key).toBeDefined();
      expect(m?.[1], key).not.toMatch(/^Admin /);
    }
  });

  it("back links use workspace wording not Admin home", () => {
    expect(zh).toContain('admin_schema_back: "返回工作台"');
    expect(zh).not.toContain("返回 Admin 首页");
    expect(en).toContain('admin_schema_back: "Back to workspace"');
    expect(en).not.toMatch(/Back to Admin home/);
  });

  it("capability strip uses product wording keys", () => {
    expect(capStrip).toContain("admin_capability_strip_no_approve_short");
    expect(capStrip).toContain("admin_capability_strip_summary_preview");
    expect(capStrip).toContain("useAdminEffectiveShellRole");
    expect(capStrip).toContain("data-tt-admin-capability-strip-preview");
    expect(zh).toContain('admin_capability_strip_no_approve_short: "无审批权限"');
    expect(zh).toContain('admin_capability_strip_summary_role: "当前角色：{{role}}"');
    expect(zh).toContain('admin_capability_strip_summary_preview: "预览视角：{{preview}} · 账号：{{account}}"');
    expect(en).toContain('admin_capability_strip_no_approve_short: "No approval permission"');
    expect(en).toContain('admin_capability_strip_summary_preview: "Preview: {{preview}} · Account: {{account}}"');
  });
});
