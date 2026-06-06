import { describe, expect, it } from "vitest";

import { resolveRegisterBackPath, type RegisterType } from "@/app/auth/register/registerPageModel";
import { ME_IDENTITIES_HUB_PATH } from "@/lib/me/meIdentitiesL5";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";

describe("resolveRegisterBackPath", () => {
  it("uses returnUrl when present", () => {
    expect(resolveRegisterBackPath("/me/identities", "provider")).toBe(ME_IDENTITIES_HUB_PATH);
    expect(resolveRegisterBackPath("/market?view=1", "provider")).toBe("/market?view=1");
  });

  it("identity apply flows default to identities hub without returnUrl", () => {
    const identityFlows: RegisterType[] = ["guide", "provider", "steward", "acquisition"];
    for (const flow of identityFlows) {
      expect(resolveRegisterBackPath(null, flow)).toBe(ME_IDENTITIES_HUB_PATH);
    }
  });

  it("traveler register defaults to home without returnUrl", () => {
    expect(resolveRegisterBackPath(null, "traveler")).toBe("/");
  });

  it("from=settings returns settings hub for apply flows", () => {
    expect(resolveRegisterBackPath(null, "provider", { fromSettings: true })).toBe(ME_SETTINGS_HUB_PATH);
    expect(resolveRegisterBackPath("/market", "steward", { fromSettings: true })).toBe(ME_SETTINGS_HUB_PATH);
  });
});
