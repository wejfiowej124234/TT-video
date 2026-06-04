import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "../../../../components/admin");

function readModuleSources(): string {
  return [
    readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminSecretsMetadataPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminSecretsMetadataFiltersCard.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminSecretsMetadataPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminSecretsMetadataPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin secrets metadata page", () => {
  const src = readModuleSources();

  it("keeps secrets metadata route + admin fetch + list chrome anchor", () => {
    expect(src).toContain("routes.admin.secretsMetadata");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminSecretsMetadataPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
  });
});
