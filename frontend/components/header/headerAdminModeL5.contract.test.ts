import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("header admin mode L5 (O5 · ①)", () => {
  const header = readFileSync(join(__dir, "..", "Header.tsx"), "utf8");
  const ui = readFileSync(join(__dir, "..", "..", "lib", "uiSystem.ts"), "utf8");
  const adminUi = readFileSync(join(__dir, "..", "..", "lib", "adminUi.ts"), "utf8");
  const strip = readFileSync(join(__dir, "..", "admin", "AdminActorCapabilityStrip.tsx"), "utf8");

  it("suppresses five-main marketing nav and wallet on /admin only", () => {
    expect(ui).toContain("export function isAdminHeaderPath");
    expect(ui).toMatch(/isAdminHeaderPath[\s\S]*TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC/);
    expect(ui).toMatch(/isHeaderUtilityL5Path[\s\S]*isAdminHeaderPath/);
    expect(ui).toMatch(/shouldSuppressGlobalSiteNav[\s\S]*isAdminHeaderPath/);
    expect(header).toContain("isAdminHeaderPath");
    expect(header).toContain("data-tt-admin-header-mode");
    expect(header).toContain("header_admin_mode_title");
    expect(header).toContain("text-slate-100");
    expect(header).toContain("header_admin_return_site");
    expect(adminUi).toMatch(
      /export const ADMIN_HEADER_RETURN_SITE_CLASS =[\s\S]*?TT_MARKETING_BTN_GHOST_WARM_DARK/,
    );
    expect(header).toContain("{showSiteNav ? (");
    expect(header).toContain("{!isAdminMode ? (");
    expect(header).toContain("WalletStatusMini");
  });

  it("states admin permissions come from email session, not wallet", () => {
    expect(strip).toContain("data-tt-admin-email-session-hint");
    expect(strip).toContain("admin_capability_strip_email_session_hint");
    expect(strip).toContain("admin_capability_strip_permission_model_hint");
  });
});
