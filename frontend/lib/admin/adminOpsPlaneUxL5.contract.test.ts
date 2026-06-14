import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const feRoot = join(__dirname, "../..");
const repoRoot = join(__dirname, "../../..");

function readFe(rel: string) {
  return readFileSync(join(feRoot, rel), "utf8");
}

function readRepo(rel: string) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("Ops plane UX L5 contract (159 UX-P0 closure)", () => {
  it("unified ops plane fetch state kit", () => {
    expect(readFe("components/admin/ops/OpsPlaneFetchStates.tsx")).toContain("data-tt-ops-plane-loading");
    expect(readFe("components/admin/ops/OpsPlaneFetchStates.tsx")).toContain("data-tt-ops-plane-error");
    expect(readFe("components/admin/ops/OpsPlaneFetchStates.tsx")).toContain("data-tt-ops-plane-retry");
    expect(readFe("components/admin/ops/OpsPlanePageShell.tsx")).toContain("OpsPlaneFetchStates");
    expect(readFe("components/admin/content/AdminContentPageShell.tsx")).toContain("OpsPlanePageShell");
  });

  it("consumer cold start full state machine", () => {
    const cs = readFe("components/coldStartCampaign/ColdStartCampaignSurfaceSection.tsx");
    const panel = readFe("components/consumer/ConsumerSurfaceStatePanel.tsx");
    expect(cs).toContain("ConsumerSurfaceStatePanel");
    expect(cs).toContain('state="loading"');
    expect(cs).toContain('state="empty"');
    expect(cs).toContain('state="error"');
    expect(cs).toContain("data-tt-cold-start-ready");
    expect(panel).toContain("data-tt-cold-start-loading");
    expect(panel).toContain('state === "empty"');
    expect(panel).toContain("data-tt-cold-start-error");
    expect(panel).toContain("data-tt-cold-start-retry");
    expect(panel).toContain("ConsumerSurfaceStatePanel");
  });

  it("growth hub ops console home", () => {
    const hub = readFe("app/admin/growth/AdminGrowthHubMain.tsx");
    expect(hub).toContain("data-tt-admin-growth-hub");
    expect(hub).toContain("data-tt-admin-growth-hub-kpi");
    expect(hub).toContain("AdminOpsPlaneSidebarHint");
    expect(hub).not.toContain("data-tt-admin-growth-hub-link");
  });

  it("run-admin-l5-green includes ops plane contracts", () => {
    const sh = readRepo("scripts/dev/run-admin-l5-green.sh");
    expect(sh).toContain("adminOpsPlaneUxL5.contract.test.ts");
    expect(sh).toContain("adminOfficialGrowthOpsL5.contract.test.ts");
    expect(sh).toContain("adminContentOpsL5.contract.test.ts");
    expect(sh).toContain("adminAdminPerfectClosureL5.contract.test.ts");
    expect(sh).toContain("adminContentCs1.contract.test.ts");
    expect(sh).toContain("adminOfficialOs1.contract.test.ts");
    expect(sh).toContain("adminGrowthReferralCodes.contract.test.ts");
  });

  it("ops plane SSOT components exist", () => {
    expect(readFe("components/admin/ops/OfficialOpsPublishRowActions.tsx")).toContain(
      "data-tt-admin-official-publish-actions",
    );
    expect(readFe("components/admin/ops/AdminOpsPlaneSidebarHint.tsx")).toContain(
      "data-tt-admin-ops-plane-sidebar-hint",
    );
    expect(readFe("components/admin/ops/AdminOpsPlanePermissionBanners.tsx")).toContain(
      "data-tt-admin-ops-plane-perm-banners",
    );
  });
});
