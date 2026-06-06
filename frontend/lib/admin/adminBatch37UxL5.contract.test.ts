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



/** ① 第三十七批 UX · reason_code 等 domain 枚举值人话。 */

describe("admin batch37 UX L5 (①)", () => {

  it("value label map includes reason_code SSOT", () => {

    expect(valueMap).toContain("REASON_CODE_VALUE_KEYS");

    expect(valueMap).toContain('field === "reason_code"');

  });



  it("maps report reason_code to localized label keys", () => {

    expect(adminAppliedFilterValueLabel("reason_code", "spam", t)).toBe("admin_reports_reason_spam");

    expect(adminAppliedFilterValueLabel("reason_code", "harassment", t)).toBe("admin_reports_reason_harassment");

  });



  it("human summary uses localized reason_code", () => {

    const out = formatAdminAppliedFiltersHuman({ reason_code: "spam" }, t);

    expect(out).toContain("admin_filter_field_reason_code: admin_reports_reason_spam");

    expect(out).not.toContain(": spam");

  });



  it("zh/en define reason_code filter field label", () => {

    const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");

    const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");

    expect(zh).toContain('admin_filter_field_reason_code: "举报原因"');

    expect(en).toMatch(/admin_filter_field_reason_code:\s*"Reason code"/);

  });

});


