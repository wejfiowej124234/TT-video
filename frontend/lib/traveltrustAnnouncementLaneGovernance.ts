/**
 * Announcement lane governance · immutable audience SSOT (TS mirror of registry)
 *
 * Registry: registry/traveltrust-announcement-lane-governance.v1.yaml
 * Unlock lane audience changes only via new registry version + Owner sign-off.
 */

import {
  TRAVELTRUST_GOVERNANCE_ANNOUNCEMENTS,
  TRAVELTRUST_PRODUCT_ANNOUNCEMENTS,
  TRAVELTRUST_PROTOCOL_STATUS_ANNOUNCEMENTS,
  type TravelTrustAnnouncementLane,
} from "./traveltrustAnnouncementCatalog";
import { TRAVELTRUST_NETWORK_ANNOUNCEMENTS } from "./traveltrustNetworkAnnouncements";
import { TRAVELTRUST_ROADMAP_2026 } from "./traveltrustRoadmap2026";
import { TRAVELTRUST_TTG_PUBLIC_ROUNDS } from "./traveltrustTtgPublicRounds";

export const TRAVELTRUST_ANNOUNCEMENT_LANE_GOVERNANCE_REGISTRY =
  "registry/traveltrust-announcement-lane-governance.v1.yaml" as const;

export type TravelTrustAnnouncementLaneAudience =
  | "public_user"
  | "token_holder"
  | "technical_public"
  | "participant";

/** All announcement tracks including ttg_round + roadmap (not on TravelTrustAnnouncement.lane) */
export type TravelTrustAnnouncementGovernanceLaneId =
  | TravelTrustAnnouncementLane
  | "ttg_round"
  | "roadmap";

export type TravelTrustAnnouncementLaneGovernanceSpec = {
  audience: TravelTrustAnnouncementLaneAudience;
  immutable: true;
  pulseDefault: boolean;
};

/** Frozen lane → audience map (must match registry YAML) */
export const TRAVELTRUST_ANNOUNCEMENT_LANE_GOVERNANCE: Readonly<
  Record<TravelTrustAnnouncementGovernanceLaneId, TravelTrustAnnouncementLaneGovernanceSpec>
> = {
  product: { audience: "public_user", immutable: true, pulseDefault: true },
  governance: { audience: "token_holder", immutable: true, pulseDefault: false },
  protocol_status: { audience: "technical_public", immutable: true, pulseDefault: false },
  ttg_round: { audience: "participant", immutable: true, pulseDefault: false },
  roadmap: { audience: "public_user", immutable: true, pulseDefault: false },
} as const;

export const TRAVELTRUST_TTG_ROUND_STATUS_VALUES = [
  "upcoming",
  "active",
  "paused",
  "closed",
  "cancelled",
  "governance_approval_required",
] as const;

export type TraveltrustTtgRoundGovernanceStatus = (typeof TRAVELTRUST_TTG_ROUND_STATUS_VALUES)[number];

/** Allowed status transitions (ops / governance · registry mirror) */
export const TRAVELTRUST_TTG_ROUND_TRANSITIONS: Readonly<
  Record<TraveltrustTtgRoundGovernanceStatus, readonly TraveltrustTtgRoundGovernanceStatus[]>
> = {
  upcoming: ["active", "cancelled"],
  active: ["paused", "closed"],
  paused: ["active", "closed", "cancelled"],
  governance_approval_required: ["active", "cancelled"],
  closed: [],
  cancelled: [],
};

export function traveltrustAnnouncementLaneAudience(
  lane: TravelTrustAnnouncementGovernanceLaneId,
): TravelTrustAnnouncementLaneAudience {
  return TRAVELTRUST_ANNOUNCEMENT_LANE_GOVERNANCE[lane].audience;
}

export function isTraveltrustAnnouncementLanePulseDefault(
  lane: TravelTrustAnnouncementGovernanceLaneId,
): boolean {
  return TRAVELTRUST_ANNOUNCEMENT_LANE_GOVERNANCE[lane].pulseDefault;
}

export function assertTraveltrustAnnouncementLaneGovernanceContract(): string[] {
  const errors: string[] = [];

  for (const item of TRAVELTRUST_NETWORK_ANNOUNCEMENTS) {
    const spec = TRAVELTRUST_ANNOUNCEMENT_LANE_GOVERNANCE[item.lane];
    if (!spec) {
      errors.push(`${item.id}: unknown lane ${item.lane}`);
      continue;
    }
    if (!spec.immutable) {
      errors.push(`${item.id}: lane ${item.lane} must be immutable`);
    }
  }

  const catalogCounts: Record<TravelTrustAnnouncementLane, number> = {
    product: TRAVELTRUST_PRODUCT_ANNOUNCEMENTS.length,
    governance: TRAVELTRUST_GOVERNANCE_ANNOUNCEMENTS.length,
    protocol_status: TRAVELTRUST_PROTOCOL_STATUS_ANNOUNCEMENTS.length,
  };

  for (const [lane, count] of Object.entries(catalogCounts) as [TravelTrustAnnouncementLane, number][]) {
    const inNetwork = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.filter((a) => a.lane === lane).length;
    if (inNetwork !== count) {
      errors.push(`lane ${lane}: catalog/network count mismatch (${count} vs ${inNetwork})`);
    }
  }

  if (TRAVELTRUST_ROADMAP_2026.length < 1) {
    errors.push("roadmap lane: TRAVELTRUST_ROADMAP_2026 empty");
  }

  if (TRAVELTRUST_TTG_PUBLIC_ROUNDS.length !== 3) {
    errors.push("ttg_round lane: expected 3 public rounds");
  }

  for (const round of TRAVELTRUST_TTG_PUBLIC_ROUNDS) {
    if (!TRAVELTRUST_TTG_ROUND_STATUS_VALUES.includes(round.status)) {
      errors.push(`${round.id}: invalid ttg round status ${round.status}`);
    }
  }

  const pulseItems = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.filter((a) =>
    isTraveltrustAnnouncementLanePulseDefault(a.lane),
  );
  if (!pulseItems.every((a) => a.lane === "product")) {
    errors.push("pulse default lane must be product only");
  }
  if (TRAVELTRUST_NETWORK_ANNOUNCEMENTS.some((a) => a.lane === "protocol_status" && pulseItems.includes(a))) {
    errors.push("protocol_status must never appear in pulse default set");
  }

  return errors;
}

export function isValidTraveltrustTtgRoundTransition(
  from: TraveltrustTtgRoundGovernanceStatus,
  to: TraveltrustTtgRoundGovernanceStatus,
): boolean {
  return TRAVELTRUST_TTG_ROUND_TRANSITIONS[from].includes(to);
}
