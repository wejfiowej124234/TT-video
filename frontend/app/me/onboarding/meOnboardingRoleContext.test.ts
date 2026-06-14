import { describe, expect, it } from "vitest";

import { resolveOnboardingRoleLock } from "./meOnboardingRoleContext";

describe("resolveOnboardingRoleLock", () => {
  it("locks provider flow from merchant onboarding sources", () => {
    expect(resolveOnboardingRoleLock("provider_pending")).toBe("provider");
    expect(resolveOnboardingRoleLock("provider_register")).toBe("provider");
  });

  it("locks steward flow from steward onboarding sources", () => {
    expect(resolveOnboardingRoleLock("steward_pending")).toBe("region_steward");
    expect(resolveOnboardingRoleLock("steward_register")).toBe("region_steward");
  });

  it("does not lock hub or unknown sources", () => {
    expect(resolveOnboardingRoleLock("identities_hub")).toBeNull();
    expect(resolveOnboardingRoleLock(null)).toBeNull();
    expect(resolveOnboardingRoleLock("settings")).toBeNull();
  });
});
