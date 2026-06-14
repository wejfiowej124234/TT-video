import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isMeEmailVerified } from "@/lib/me/meSettingsUser";
import { meSettingsNavSections } from "@/lib/me/meSettingsNavModel";

const ROOT = process.cwd();

describe("me settings family L5 (①)", () => {
  it("settings error boundary uses L5 flow not me cyan shell", () => {
    const err = readFileSync(join(ROOT, "app/me/settings/error.tsx"), "utf8");
    expect(err).toContain("MeSettingsL5FlowPage");
    expect(err).toContain("MeSettingsHubBackLink");
    expect(err).not.toContain('from "../error"');
  });

  it("does not inject email verify nav row (register-time verification)", () => {
    const flat = meSettingsNavSections().flatMap((s) => s.items);
    expect(flat.some((i) => i.id === "email_verify")).toBe(false);
    expect(flat.some((i) => i.href === "/auth/verify-email?from=settings")).toBe(false);
  });

  it("isMeEmailVerified reads email_verified_at", () => {
    expect(isMeEmailVerified({ email_verified_at: "2026-01-01" })).toBe(true);
    expect(isMeEmailVerified({ email: "a@b.c" })).toBe(false);
    expect(isMeEmailVerified(null)).toBe(true);
  });

  it("hub reloads status on pathname return", () => {
    const inner = readFileSync(join(ROOT, "app/me/settings/MeSettingsPageInner.tsx"), "utf8");
    expect(inner).toContain("useMeSettingsHubPathnameReload");
    expect(inner).toContain("hubStatus.reload");
    expect(inner).toContain("meSettingsShowAcquisitionHub");
    expect(inner).toMatch(/import[\s\S]*meSettingsShowAcquisitionHub[\s\S]*from "@\/lib\/me\/meIdentitySlotVisibility"/);
  });

  it("hub flash banner and wallet success link to settings", () => {
    const inner = readFileSync(join(ROOT, "app/me/settings/MeSettingsPageInner.tsx"), "utf8");
    const wallet = readFileSync(join(ROOT, "app/me/security/MeSecurityWalletVerifySection.tsx"), "utf8");
    expect(inner).toContain("MeSettingsHubFlashBanner");
    expect(inner).toContain("useMeSettingsHubFlash");
    expect(wallet).toContain('meSettingsHubHref("wallet")');
  });

  it("password and security errors use settings L5 boundary", () => {
    expect(readFileSync(join(ROOT, "app/me/password/error.tsx"), "utf8")).toContain("../settings/error");
    expect(readFileSync(join(ROOT, "app/me/security/error.tsx"), "utf8")).toContain("../settings/error");
  });

  it("does not surface onboarding rows in settings hub (header identities SSOT)", () => {
    const flat = meSettingsNavSections({ showGuideHub: true }).flatMap((s) => s.items);
    expect(flat.some((i) => i.id === "onboarding")).toBe(false);
    expect(flat.some((i) => i.id === "provider_register")).toBe(false);
    expect(flat.some((i) => i.id === "steward_register")).toBe(false);
    expect(flat.some((i) => i.href === "/me/onboarding?from=settings")).toBe(false);
  });

  it("security page links to notification prefs subpage", () => {
    const main = readFileSync(join(ROOT, "app/me/security/MeSecurityPageMain.tsx"), "utf8");
    expect(main).toContain("/me/settings/notifications-prefs");
    expect(main).toContain("me_security_page_link_notification_prefs");
  });

  it("notifications-prefs subpage exists with hub back link", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/notifications-prefs/page.tsx"), "utf8");
    expect(page).toContain("MeSettingsHubBackLink");
    expect(page).toContain("me_settings_item_security_events");
  });

  it("splits notification prefs from security event log", () => {
    const flat = meSettingsNavSections().flatMap((s) => s.items);
    expect(flat.some((i) => i.href === "/me/settings/notifications-prefs")).toBe(true);
    expect(flat.some((i) => i.id === "security_events")).toBe(true);
    expect(flat.some((i) => i.href === "/community/feedback?from=settings")).toBe(true);
    expect(flat.some((i) => i.href === "/disputes?from=settings")).toBe(true);
    expect(flat.some((i) => i.href === "/help?from=settings")).toBe(true);
    expect(flat.some((i) => i.href === "/privacy?from=settings")).toBe(true);
    expect(flat.some((i) => i.href === "/terms?from=settings")).toBe(true);
    expect(flat.some((i) => i.href === "/terms/community-guidelines?from=settings")).toBe(true);
    expect(flat.some((i) => i.href === "/trust?from=settings")).toBe(true);
    expect(flat.some((i) => i.id === "kyc_status")).toBe(false);
    const prefs = flat.find((i) => i.id === "notification_prefs");
    expect(prefs?.partialSoon).toBeUndefined();
    expect(flat.some((i) => i.id === "community_visibility")).toBe(true);
    const visibility = flat.find((i) => i.id === "community_visibility");
    expect(visibility?.partialSoon).toBeUndefined();
  });

  it("hub nav dedupes header menu primary routes", () => {
    const flat = meSettingsNavSections().flatMap((s) => s.items);
    expect(flat.some((i) => i.href === "/orders")).toBe(false);
    expect(flat.some((i) => i.href === "/community/me/collects")).toBe(false);
    expect(flat.some((i) => i.href === "/community/me/reports")).toBe(false);
    expect(flat.some((i) => i.id === "my_content_menu_hint")).toBe(false);
    const nav = readFileSync(join(ROOT, "components/header/headerUserMenuNavModel.ts"), "utf8");
    expect(nav).toContain('section: isAuthL5 ? "tools"');
    expect(nav).toContain("/community/me/reports");
  });
});
