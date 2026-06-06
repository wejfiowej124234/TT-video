import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/apiClient", () => ({
  getMeFull: vi.fn(),
  getOnboardingEntitlementsMe: vi.fn(),
}));

import { getMeFull, getOnboardingEntitlementsMe } from "@/lib/apiClient";
import { fetchMerchantPublishEligibility } from "./merchantPublishEligibility";

describe("fetchMerchantPublishEligibility", () => {
  beforeEach(() => {
    vi.mocked(getMeFull).mockReset();
    vi.mocked(getOnboardingEntitlementsMe).mockReset();
  });

  it("requires provider role, approved application, and paid entitlement", async () => {
    vi.mocked(getMeFull).mockResolvedValue({
      status: "ok",
      user: { id: "u1", role: "traveler" },
      trust: { provider_registration_status: "approved" },
    });
    vi.mocked(getOnboardingEntitlementsMe).mockResolvedValue({
      status: "ok",
      entitlements: [{ id: "e1", role_target: "provider", sku: "p", status: "paid" }],
    });

    const gate = await fetchMerchantPublishEligibility();
    expect(gate.roleOk).toBe(false);
    expect(gate.applicationOk).toBe(true);
    expect(gate.entitlementPaidOk).toBe(true);
    expect(gate.ok).toBe(false);
  });

  it("ok when provider role, approved, and paid entitlement", async () => {
    vi.mocked(getMeFull).mockResolvedValue({
      status: "ok",
      user: { id: "u1", role: "provider" },
      trust: { provider_registration_status: "approved" },
    });
    vi.mocked(getOnboardingEntitlementsMe).mockResolvedValue({
      status: "ok",
      entitlements: [{ id: "e1", role_target: "provider", sku: "p", status: "paid" }],
    });

    const gate = await fetchMerchantPublishEligibility();
    expect(gate.ok).toBe(true);
  });
});
