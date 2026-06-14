import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORKSPACE_L5_MARKER } from "./workspaceWorkbenchL5";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("workspaceWorkbenchL5 (① · settings-aligned operator shell)", () => {
  it("exports stable L5 marker", () => {
    expect(WORKSPACE_L5_MARKER).toBe("workspace-workbench-l5-v1");
  });

  it("guide / provider / steward workbenches use WorkspaceL5PageShell + AuthL5 backdrop family", () => {
    const shell = read("components/workspace/WorkspaceL5PageShell.tsx");
    expect(shell).toContain("AuthL5PageBackdrop");
    expect(shell).toContain("WorkspaceL5PageShell");

    const guide = read("app/guide/page.tsx");
    expect(guide).toContain("WorkspaceL5PageShell");
    expect(guide).toContain("WorkspaceL5Header");
    expect(guide).toContain("WorkspaceL5SettingsIngress");

    const provider = read("app/provider/page.tsx");
    expect(provider).toContain("WorkspaceL5SettingsIngress");
    expect(provider).toContain("MerchantWorkbenchMarketExposureCard");
    expect(provider).toContain("ProviderWorkbenchStatsTeaser");
    expect(provider).toContain("meMerchantWorkspaceUnlocked");
    expect(provider).toContain("WorkspaceOperatorLockedPanel");
    expect(provider).not.toContain("/provider/register");

    const steward = read("app/governance/StewardRegionWorkbenchMain.tsx");
    expect(steward).toContain("WorkspaceL5SettingsIngress");
    expect(steward).toContain("StewardWorkbenchTodoSection");
    expect(steward).toContain("meStewardWorkspaceUnlocked");
    expect(steward).not.toMatch(/WorkspaceL5BackLink[\s\S]*MeSettingsExtensionIngressBlock/);
  });

  it("governance routes region steward view to dedicated L5 workbench", () => {
    const page = read("app/governance/page.tsx");
    expect(page).toContain('searchParams?.get("view") === "region"');
    expect(page).toContain("StewardRegionWorkbenchMain");
  });
});
