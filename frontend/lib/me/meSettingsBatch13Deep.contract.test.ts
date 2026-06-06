import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("me settings batch 13 deep flows (①)", () => {
  it("hub logout button exposes settings logout marker", () => {
    const btn = readFileSync(join(ROOT, "components/me/MeLogoutL5Button.tsx"), "utf8");
    const wrap = readFileSync(join(ROOT, "components/me/MeSettingsLogoutButton.tsx"), "utf8");
    expect(btn).toContain("data-tt-me-settings-logout");
    expect(wrap).toContain("MeLogoutL5Button");
    expect(btn).toContain("MeSettingsL5ConfirmDialog");
  });

  it("data export sets done marker after download", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/data/page.tsx"), "utf8");
    const exp = readFileSync(join(ROOT, "lib/me/meSettingsDataExport.ts"), "utf8");
    expect(page).toContain("data-tt-me-settings-data-export-done");
    expect(page).toContain("downloadMeSettingsDataJson");
    expect(exp).toContain("traveltrust.me-settings-data-export.v1");
  });

  it("hub status hook exposes failed state for nav row enrichment", () => {
    const hook = readFileSync(join(ROOT, "lib/me/useMeSettingsHubStatus.ts"), "utf8");
    expect(hook).toContain("setFailed(true)");
    const enrich = readFileSync(join(ROOT, "lib/me/meSettingsNavEnrich.ts"), "utf8");
    expect(enrich).toContain("me_settings_desc_hub_status_failed");
    const inner = readFileSync(join(ROOT, "app/me/settings/MeSettingsPageInner.tsx"), "utf8");
    expect(inner).not.toContain("MeSettingsHubStatusStrip");
  });

  it("verify-email from settings wires resend dev token panel", () => {
    const page = readFileSync(join(ROOT, "app/auth/verify-email/page.tsx"), "utf8");
    const panel = readFileSync(join(ROOT, "components/me/MeSettingsResendVerifyEmailPanel.tsx"), "utf8");
    expect(page).toContain("MeSettingsResendVerifyEmailPanel");
    expect(page).toContain('searchParams.get("from") === "settings"');
    expect(panel).toContain("data-tt-me-settings-verify-dev-token");
    expect(readFileSync(join(ROOT, "lib/apiClient/auth.ts"), "utf8")).toContain(
      "postResendVerificationEmail",
    );
  });

  it("e2e spec covers batch 13 flows", () => {
    const spec = readFileSync(join(ROOT, "e2e/me-settings-l5-hub.spec.ts"), "utf8");
    const helpers = readFileSync(join(ROOT, "e2e/helpers/meSettingsE2e.ts"), "utf8");
    expect(spec).toContain("hubSettingsLogoutWithL5Confirm");
    expect(spec).toContain("hub nav shows failed security desc");
    expect(spec).toContain("ensureDisputeIdForBearer");
    expect(spec).toContain("verify-email from settings");
    expect(spec).toContain("data export triggers json download");
    expect(helpers).toContain("installHubStatusApiFailureRoutes");
  });
});
