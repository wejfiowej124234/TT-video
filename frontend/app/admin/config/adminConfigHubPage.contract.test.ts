import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  CONFIG_HUB_LINKS,
  CONFIG_HUB_MAINTAINER_LINKS,
  CONFIG_HUB_OPS_LINKS,
} from "./adminConfigHubPageModel";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminConfigHubPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminConfigHubPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminConfigHubPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin config hub page", () => {
  const src = readModuleSources();

  it("keeps ops cards first and maintainer fold with meta build", () => {
    expect(CONFIG_HUB_OPS_LINKS.length).toBeGreaterThanOrEqual(5);
    expect(CONFIG_HUB_MAINTAINER_LINKS.map((l) => l.href)).toEqual([
      "/admin/lifecycle",
      "/admin/api-versions",
      "/admin/backup",
    ]);
    expect(CONFIG_HUB_LINKS.length).toBe(
      CONFIG_HUB_OPS_LINKS.length + CONFIG_HUB_MAINTAINER_LINKS.length,
    );
    expect(src).toContain("CONFIG_HUB_OPS_LINKS");
    expect(src).toContain("CONFIG_HUB_MAINTAINER_LINKS");
    expect(src).toContain('data-tt-admin-config-hub-ops="1"');
    expect(src).toContain('data-tt-admin-config-hub-maintainer-fold="1"');
    expect(src).toContain("AdminConfigHubMetaBuild");
    expect(src).toContain("AdminMetaBuildSection");
    expect(src).toContain("AdminPlatformHubRelatedNav");
    expect(src).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    // Batch-13 FP-C · CF6/CF10/CF11
    expect(src).toContain("AdminConfigPublishApprovalNotice");
    expect(src).toContain("data-tt-admin-config-hub-writable-honesty");
    expect(src).toContain('data-tt-admin-config-hub-truth-footer="1"');
    expect(src).toContain('data-tt-admin-config-hub-hard-gate="LOCKED"');
    expect(src).toContain("admin_config_hub_truth_footer_body");
  });
});
