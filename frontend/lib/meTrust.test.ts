import { describe, expect, it } from "vitest";
import { formatGuideRegistrationStatus, parseMeTrustFromMeResponse, userFromGetMePayload } from "./meTrust";
import type { UserShape } from "@/components/me/constants";

const t = (k: string) => k;

describe("parseMeTrustFromMeResponse", () => {
  it("uses trust block when present", () => {
    const user: UserShape = {
      id: "u1",
      kyc_status: "none",
      default_wallet_address: "",
    };
    const data = {
      trust: {
        kyc_status: "pending",
        wallet_linked: true,
        guide_registration_status: "active",
        identity_status: "pending_review",
        risk_level: "medium",
        risk_basis: "open_disputes_as_party:2",
        risk_reason_codes: ["IDENTITY_PENDING_VERIFICATION", "OPEN_DISPUTES_ELEVATED"],
        recommended_actions: ["await_verification", "enhanced_monitoring"],
      },
    };
    expect(parseMeTrustFromMeResponse(data, user)).toEqual({
      kyc_status: "pending",
      wallet_linked: true,
      guide_registration_status: "active",
      identity_status: "pending_review",
      risk_level: "medium",
      risk_basis: "open_disputes_as_party:2",
      risk_reason_codes: ["IDENTITY_PENDING_VERIFICATION", "OPEN_DISPUTES_ELEVATED"],
      recommended_actions: ["await_verification", "enhanced_monitoring"],
    });
  });

  it("parses trust.reputation when present for guide", () => {
    const user: UserShape = { id: "g1", kyc_status: "none", default_wallet_address: "" };
    const data = {
      trust: {
        kyc_status: "none",
        wallet_linked: false,
        guide_registration_status: "active",
        reputation: {
          rule_version: "me_reputation_summary_v2",
          as_guide: {
            reviews_received_count: 2,
            sum_review_weights: 0.5,
            weighted_avg_score: 4.25,
          },
          as_reviewer: { reviews_written_count: 1, sum_review_weights: 0.3 },
          formula: "weighted_avg_score = sum(score*weight)/sum(weight)",
        },
      },
    };
    expect(parseMeTrustFromMeResponse(data, user).reputation).toEqual({
      rule_version: "me_reputation_summary_v2",
      as_guide: {
        reviews_received_count: 2,
        sum_review_weights: 0.5,
        weighted_avg_score: 4.25,
      },
      as_reviewer: { reviews_written_count: 1, sum_review_weights: 0.3 },
      formula: "weighted_avg_score = sum(score*weight)/sum(weight)",
    });
  });

  it("parses trust.reputation with null as_guide for non-guide role", () => {
    const data = {
      trust: {
        kyc_status: "none",
        wallet_linked: false,
        guide_registration_status: null,
        reputation: {
          rule_version: "me_reputation_summary_v2",
          as_guide: null,
          as_reviewer: { reviews_written_count: 0, sum_review_weights: 0 },
          note: "weighted guide reputation applies when role=guide",
        },
      },
    };
    const s = parseMeTrustFromMeResponse(data, null);
    expect(s.reputation?.as_guide).toBeNull();
    expect(s.reputation?.as_reviewer).toEqual({ reviews_written_count: 0, sum_review_weights: 0 });
    expect(s.reputation?.note).toBe("weighted guide reputation applies when role=guide");
  });

  it("falls back when trust missing", () => {
    const user: UserShape = {
      kyc_status: "verified",
      default_wallet_address: " 0xabc ",
    };
    expect(parseMeTrustFromMeResponse({}, user)).toEqual({
      kyc_status: "verified",
      wallet_linked: true,
      guide_registration_status: null,
    });
  });

  it("treats explicit null guide_registration_status", () => {
    const data = { trust: { kyc_status: "none", wallet_linked: false, guide_registration_status: null } };
    expect(parseMeTrustFromMeResponse(data, null).guide_registration_status).toBeNull();
  });

  it("parses guide_registration_rejection fields when present", () => {
    const data = {
      trust: {
        kyc_status: "none",
        wallet_linked: false,
        guide_registration_status: "rejected",
        guide_registration_rejection_codes: ["doc_blur", "  "],
        guide_registration_rejection_message: "  please re-upload  ",
      },
    };
    const s = parseMeTrustFromMeResponse(data, null);
    expect(s.guide_registration_rejection_codes).toEqual(["doc_blur"]);
    expect(s.guide_registration_rejection_message).toBe("please re-upload");
  });
});

describe("userFromGetMePayload", () => {
  it("returns user from nested shape", () => {
    expect(
      userFromGetMePayload({
        status: "ok",
        user: { id: "550e8400-e29b-41d4-a716-446655440000", nickname: "A" },
      })?.id
    ).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("returns null for anonymous or flat wrong shape", () => {
    expect(userFromGetMePayload({ user: { id: "anonymous" } })).toBeNull();
    expect(userFromGetMePayload({ id: "x", nickname: "flat" } as { id: string; nickname: string })).toBeNull();
  });
});

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
