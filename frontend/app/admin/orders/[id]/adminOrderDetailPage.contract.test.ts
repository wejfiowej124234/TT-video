import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminOrderDetailPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminOrderDetailPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminOrderDetailPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin order detail page", () => {
  const src = readModuleSources();

  it("keeps admin order by id route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.orderById");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminOrderDetailPage"');
    expect(src).toContain("stashEscrowOrderPrefetchFromAdminOrderDetailBody");
    expect(src).toContain("AdminListFetchError");
  });
});
