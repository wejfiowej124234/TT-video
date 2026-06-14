import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  deriveMeIdentitiesCoreCardView,
  ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF,
  ME_IDENTITIES_MERCHANT_WORKSPACE_HREF,
  ME_IDENTITIES_STEWARD_WORKSPACE_HREF,
} from "@/lib/me/meIdentitiesCoreCardModel";
import { deriveMeIdentitiesAcquisitionCardView } from "@/lib/me/meIdentitiesAcquisitionHubModel";

const root = join(process.cwd());

describe("Multi-Identity Workspace Sprint (① · SSOT CONFIRMED)", () => {
  it("does not add standalone /acquisition or /steward operator routes", () => {
    expect(() => readFileSync(join(root, "app/acquisition/page.tsx"), "utf8")).toThrow();
    expect(() => readFileSync(join(root, "app/steward/page.tsx"), "utf8")).toThrow();
  });

  it("governance hub stays at /governance (no redirect to /steward)", () => {
    const gov = readFileSync(join(root, "app/governance/page.tsx"), "utf8");
    expect(gov).toContain("GovernanceHubPageMain");
    expect(gov).not.toContain("GovernanceHubPageWithRedirect");
    expect(gov).not.toContain('router.replace("/steward")');
  });

  it("hub active CTAs point to workspaces (not settings)", () => {
    const hub = readFileSync(join(root, "app/me/identities/page.tsx"), "utf8");
    expect(hub).toContain("deriveMeIdentitiesCoreCardView");
    expect(hub).toContain("stewardAdmissionWorkbenchHref");
    expect(hub).toContain("deriveMeIdentitiesAcquisitionCardView");
    expect(deriveMeIdentitiesAcquisitionCardView("active").href).toBe(ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF);

    const merchantView = deriveMeIdentitiesCoreCardView(
      {
        surface: "provider",
        loggedIn: true,
        userRole: "provider",
        slotState: "active",
        applicationStatus: "approved",
        hasRegistrationDraft: false,
        hasActivePaidEntitlement: true,
        hasPendingEntitlement: false,
      },
      {
        applyHref: "/provider/register",
        onboardingHref: "/me/onboarding?role=provider",
        activeHref: "/market/provider",
      },
    );
    expect(merchantView.href).toBe(ME_IDENTITIES_MERCHANT_WORKSPACE_HREF);

    const stewardView = deriveMeIdentitiesCoreCardView(
      {
        surface: "steward",
        loggedIn: true,
        userRole: "region_steward",
        slotState: "active",
        applicationStatus: "approved",
        hasRegistrationDraft: false,
        hasActivePaidEntitlement: true,
        hasPendingEntitlement: false,
      },
      {
        applyHref: "/steward/register",
        onboardingHref: "/governance?view=region&from=identities_hub#steward-b-track-admission",
        activeHref: "/governance",
      },
    );
    expect(stewardView.href).toBe(ME_IDENTITIES_STEWARD_WORKSPACE_HREF);
    expect(ME_IDENTITIES_STEWARD_WORKSPACE_HREF).toBe("/governance?view=region");
    expect(ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF).toBe("/market/acquisition");
  });

  it("settings nav exposes workspace hubs at confirmed hrefs (profile links stay on identities hub)", () => {
    const nav = readFileSync(join(root, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain("showStewardHub");
    expect(nav).toContain("showAcquisitionHub");
    expect(nav).not.toContain("identity_profiles");
    expect(nav).not.toContain("showAcquisitionProfile");
    expect(nav).toContain('meSettingsNavExtensionHref("/market/acquisition")');
    expect(nav).toContain('meSettingsNavExtensionHref("/governance?view=region")');
  });

  it("W4 data layer: business_line query + workspace stats model", () => {
    const orders = readFileSync(join(root, "lib/apiClient/orders.ts"), "utf8");
    expect(orders).toContain("business_line?:");
    expect(orders).toContain('q.set("business_line"');
    const stats = readFileSync(join(root, "lib/workspace/workspaceStatsModel.ts"), "utf8");
    expect(stats).toContain("orders_merchant_total");
    expect(stats).toContain("acquisition_in_progress_count");
    const backend = readFileSync(
      join(process.cwd(), "..", "crates/api/src/chain_off/workspace_stats.rs"),
      "utf8",
    );
    expect(backend).toContain("order_business_line_for_chain_off");
    expect(backend).toContain("merchant_workspace_stats");
  });
});
