import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminObservabilityPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminObservabilityPageHeader.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminObservabilityOverviewSection.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminObservabilityJsonBlock.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminObservabilityPage.ts"), "utf8"),
    readFileSync(join(__dir, "observabilityPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin observability page", () => {
  const src = readModuleSources();

  it("keeps observability overview route and admin fetch", () => {
    expect(src).toContain("routes.admin.observabilityOverview");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("apiUrl(");
  });

  it("keeps admin DOM anchor and fetch log tag", () => {
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminObservabilityPage"');
    expect(src).toContain("AdminListFetchError");
  });
});
