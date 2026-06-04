import { describe, expect, it } from "vitest";

import { adminFinancePartialDepthHref } from "./adminFinancePartialDepthHref";

describe("adminFinancePartialDepthHref", () => {
  it("builds partial depth query for finance module", () => {
    expect(adminFinancePartialDepthHref("/admin/finance", "export")).toBe(
      "/admin/finance?fin_suite_depth=partial&fin_suite_module=export",
    );
  });
});
