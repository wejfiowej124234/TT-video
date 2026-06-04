import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminIndexerPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminIndexerHealthPanel.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminIndexerOpsHintCard.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminIndexerPage.ts"), "utf8"),
    readFileSync(join(__dir, "indexerPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin indexer page", () => {
  const src = readModuleSources();

  it("keeps indexer health route and admin fetch", () => {
    expect(src).toContain("routes.admin.indexerHealth");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("apiUrl(");
  });

  it("keeps admin DOM anchor and fetch log tag", () => {
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminIndexerPage"');
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("ADMIN_INDEXER_OPS_HINT_CARD_CLASS");
    expect(src).toContain('data-tt-admin-indexer-ops-hint="1"');
    expect(src).not.toContain("border-dashed");
  });
});
