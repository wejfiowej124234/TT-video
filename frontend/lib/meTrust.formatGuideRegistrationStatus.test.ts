import { describe, expect, it } from "vitest";
import { formatGuideRegistrationStatus } from "./meTrust";

const t = (k: string) => k;

describe("formatGuideRegistrationStatus", () => {
  it("maps known statuses", () => {
    expect(formatGuideRegistrationStatus(null, t)).toBe("me_trust_guide_none");
    expect(formatGuideRegistrationStatus("pending", t)).toBe("me_trust_guide_pending");
    expect(formatGuideRegistrationStatus("active", t)).toBe("me_trust_guide_active");
    expect(formatGuideRegistrationStatus("rejected", t)).toBe("me_trust_guide_rejected");
    expect(formatGuideRegistrationStatus("suspended", t)).toBe("me_trust_guide_suspended");
  });

  it("passes through unknown", () => {
    const tRaw = (k: string) => (k === "me_trust_guide_raw" ? "{{status}}" : k);
    expect(formatGuideRegistrationStatus("weird", tRaw)).toBe("weird");
  });
});
