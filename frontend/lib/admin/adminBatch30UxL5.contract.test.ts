import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



import { adminAppliedFilterFieldLabel } from "./adminAppliedFilterFieldLabel";

import { formatAdminAppliedFiltersHuman } from "./formatAdminAppliedFiltersHuman";



const __dir = dirname(fileURLToPath(import.meta.url));

const fe = join(__dir, "..", "..");



const t = (key: string) => key;



/** ① 第三十批 UX · applied_filters 字段标签 i18n（非 raw key dump）。 */

describe("admin batch30 UX L5 (①)", () => {

  const fieldMap = readFileSync(join(__dir, "adminAppliedFilterFieldLabel.ts"), "utf8");

  const fmt = readFileSync(join(__dir, "formatAdminAppliedFiltersHuman.ts"), "utf8");

  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");



  it("field label map SSOT wired into formatAdminAppliedFiltersHuman", () => {

    expect(fieldMap).toContain("adminAppliedFilterFieldLabel");

    expect(fmt).toContain("adminAppliedFilterFieldLabel(key, t)");

  });



  it("common filter fields resolve to i18n keys", () => {

    expect(adminAppliedFilterFieldLabel("status", t)).toBe("admin_filter_field_status");

    expect(adminAppliedFilterFieldLabel("chain_id", t)).toBe("admin_filter_field_chain_id");

    expect(adminAppliedFilterFieldLabel("unknown_field", t)).toBe("unknown field");

  });



  it("formatAdminAppliedFiltersHuman uses localized labels", () => {

    const out = formatAdminAppliedFiltersHuman({ status: "pending", limit: 50 }, t);

    expect(out).toContain("admin_filter_field_status: pending");

    expect(out).toContain("admin_filter_field_limit: 50");

    expect(out).not.toContain('"status"');

  });



  it("en locale defines English filter field labels", () => {

    expect(en).toMatch(/admin_filter_field_limit:\s*"Limit"/);

    expect(en).toMatch(/admin_filter_field_status:\s*"Status"/);

  });

});


