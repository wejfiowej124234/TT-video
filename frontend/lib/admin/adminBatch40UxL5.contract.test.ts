import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { adminAppliedFilterValueLabel } from "./adminAppliedFilterValueLabel";
import { formatAdminAppliedFiltersHuman } from "./formatAdminAppliedFiltersHuman";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const valueMap = readFileSync(join(__dir, "adminAppliedFilterValueLabel.ts"), "utf8");

const t = (key: string) => key;

/** ① 第四十批 UX · action/target_type/url_scope 筛选值人话。 */
describe("admin batch40 UX L5 (①)", () => {
  it("value label map includes media/community field SSOT", () => {
    expect(valueMap).toContain("ACTION_VALUE_KEYS");
    expect(valueMap).toContain("TARGET_TYPE_VALUE_KEYS");
    expect(valueMap).toContain("URL_SCOPE_VALUE_KEYS");
  });

  it("maps action and target_type enums", () => {
    expect(adminAppliedFilterValueLabel("action", "read_ok", t)).toBe("admin_filter_value_action_read_ok");
    expect(adminAppliedFilterValueLabel("target_type", "post", t)).toBe("admin_filter_value_target_post");
    expect(adminAppliedFilterValueLabel("url_scope", "download", t)).toBe("admin_filter_value_url_scope_download");
  });

  it("human summary localizes media action filter", () => {
    const out = formatAdminAppliedFiltersHuman({ action: "issue_ok" }, t);
    expect(out).toContain("admin_filter_value_action_issue_ok");
    expect(out).not.toContain(": issue_ok");
  });

  it("zh/en define filter value label keys", () => {
    const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");
    const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");
    expect(zh).toContain('admin_filter_value_action_read_ok: "读取成功"');
    expect(en).toMatch(/admin_filter_field_target_type:\s*"Target type"/);
  });
});
