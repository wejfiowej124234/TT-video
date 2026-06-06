import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isMeSettingsDeleteAccountFeedbackIntent,
  isMeSettingsExtensionFromSettings,
  parseMeSettingsExtensionFrom,
} from "@/lib/me/meSettingsExtensionContext";

const ROOT = process.cwd();

describe("me settings feedback extension (①)", () => {
  it("parses settings extension query", () => {
    expect(parseMeSettingsExtensionFrom("settings")).toBe("settings");
    expect(parseMeSettingsExtensionFrom("settings-data")).toBe("settings-data");
    expect(isMeSettingsExtensionFromSettings("settings")).toBe(true);
    expect(
      isMeSettingsDeleteAccountFeedbackIntent("settings-data", "delete-account"),
    ).toBe(true);
  });

  it("feedback page wires settings chrome and delete-account prefill", () => {
    const page = readFileSync(join(ROOT, "app/community/feedback/page.tsx"), "utf8");
    expect(page).toContain("MeSettingsExtensionChrome");
    expect(page).toContain("data-tt-community-feedback-from-settings");
    expect(page).toContain("data-tt-community-feedback-delete-account-intent");
    expect(page).toContain("data-tt-community-feedback-delete-account-modal");
    expect(page).toContain("data-tt-community-feedback-post-modal");
    expect(page).toContain("data-tt-community-feedback-submit-ok");
    expect(page).toContain("data-tt-community-feedback-delete-account-submitted");
    expect(page).toContain("deleteAccountIntent");
    expect(page).toContain("setPostOpen(true)");
    expect(page).toContain("feedback_category_account");
  });

  it("data page routes delete flow to feedback with settings-data intent", () => {
    const data = readFileSync(join(ROOT, "app/me/settings/data/page.tsx"), "utf8");
    expect(data).toContain("intent=delete-account");
    expect(data).toContain("from=settings-data");
    expect(data).toContain('id="delete_account"');
  });

  it("hub nav links feedback with from=settings", () => {
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain("/community/feedback?from=settings");
  });

  it("trust subpage offers email verify resend for unverified users", () => {
    const trust = readFileSync(join(ROOT, "app/me/settings/trust/page.tsx"), "utf8");
    expect(trust).toContain("MeSettingsResendVerifyEmailPanel");
    expect(trust).toContain("isMeEmailVerified");
    const inner = readFileSync(join(ROOT, "app/me/settings/MeSettingsPageInner.tsx"), "utf8");
    expect(inner).not.toContain("MeSettingsHubStatusStrip");
  });
});
