import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



import { adminAppliedFilterValueLabel } from "./adminAppliedFilterValueLabel";

import { formatAdminAppliedFiltersHuman } from "./formatAdminAppliedFiltersHuman";



const __dir = dirname(fileURLToPath(import.meta.url));

const fe = join(__dir, "..", "..");

const fmt = readFileSync(join(__dir, "formatAdminAppliedFiltersHuman.ts"), "utf8");



const t = (key: string) => key;



/** ① 第三十四批 UX · applied_filters 枚举值人话。 */

describe("admin batch34 UX L5 (①)", () => {

  it("formatAdminAppliedFiltersHuman wires value label SSOT", () => {

    expect(fmt).toContain("adminAppliedFilterValueLabel");

  });



  it("maps common status enums to i18n keys", () => {

    expect(adminAppliedFilterValueLabel("status", "open", t)).toBe("admin_reports_status_open");

    expect(adminAppliedFilterValueLabel("status", "draft", t)).toBe("admin_config_releases_status_draft");

    expect(adminAppliedFilterValueLabel("limit", "50", t)).toBeNull();

  });



  it("human summary uses localized status value", () => {

    const out = formatAdminAppliedFiltersHuman({ status: "open", limit: 25 }, t);

    expect(out).toContain("admin_filter_field_status: admin_reports_status_open");

    expect(out).not.toContain(": open");

  });



  it("zh/en define extended filter field labels", () => {

    const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");

    const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");

    expect(zh).toContain("admin_filter_field_report_id");

    expect(en).toMatch(/admin_filter_field_report_id:\s*"Report"/);

  });

});


