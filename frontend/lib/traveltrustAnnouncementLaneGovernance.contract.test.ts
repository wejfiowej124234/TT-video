import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertTraveltrustAnnouncementLaneGovernanceContract,
  isValidTraveltrustTtgRoundTransition,
  TRAVELTRUST_ANNOUNCEMENT_LANE_GOVERNANCE,
  TRAVELTRUST_ANNOUNCEMENT_LANE_GOVERNANCE_REGISTRY,
  TRAVELTRUST_TTG_ROUND_STATUS_VALUES,
  TRAVELTRUST_TTG_ROUND_TRANSITIONS,
} from "./traveltrustAnnouncementLaneGovernance";
import { TRAVELTRUST_TTG_PUBLIC_ROUNDS } from "./traveltrustTtgPublicRounds";

const ROOT = join(__dirname, "../..");

describe("traveltrustAnnouncementLaneGovernance", () => {
  it("registry YAML mirrors frozen lane audiences", () => {
    const reg = readFileSync(join(ROOT, TRAVELTRUST_ANNOUNCEMENT_LANE_GOVERNANCE_REGISTRY), "utf8");
    expect(reg).toContain("ANNOUNCEMENT_LANE_GOVERNANCE_FROZEN");
    for (const [lane, spec] of Object.entries(TRAVELTRUST_ANNOUNCEMENT_LANE_GOVERNANCE)) {
      expect(reg).toContain(`${lane}:`);
      expect(reg).toContain(`audience: ${spec.audience}`);
    }
  });

  it("passes lane governance contract (catalog counts, pulse, ttg statuses)", () => {
    const errors = assertTraveltrustAnnouncementLaneGovernanceContract();
    expect(errors).toEqual([]);
  });

  it("exposes full TTG round status machine", () => {
    expect(TRAVELTRUST_TTG_ROUND_STATUS_VALUES).toEqual([
      "upcoming",
      "active",
      "paused",
      "closed",
      "cancelled",
      "governance_approval_required",
    ]);
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[1]?.status).toBe("governance_approval_required");
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[1]?.requiresGovernanceApproval).toBe(true);
  });

  it("validates TTG round transitions per governance model", () => {
    expect(isValidTraveltrustTtgRoundTransition("upcoming", "active")).toBe(true);
    expect(isValidTraveltrustTtgRoundTransition("active", "paused")).toBe(true);
    expect(isValidTraveltrustTtgRoundTransition("governance_approval_required", "active")).toBe(true);
    expect(isValidTraveltrustTtgRoundTransition("closed", "active")).toBe(false);
    expect(TRAVELTRUST_TTG_ROUND_TRANSITIONS.closed).toEqual([]);
  });

  it("protocol disclaimer locale keys exist in en/zh", () => {
    for (const file of ["en.ts", "zh.ts"]) {
      const src = readFileSync(join(ROOT, "frontend/locales", file), "utf8");
      expect(src).toContain("traveltrust_announcements_protocol_section_disclaimer");
      for (const status of TRAVELTRUST_TTG_ROUND_STATUS_VALUES) {
        expect(src).toContain(`traveltrust_ttg_round_status_${status}`);
      }
    }
  });
});
