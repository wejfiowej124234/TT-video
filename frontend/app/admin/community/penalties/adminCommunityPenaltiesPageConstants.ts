export const PENALTY_STATUS_OPTIONS = ["", "active", "lifted", "superseded"] as const;
export const PENALTY_STATUS_URL = new Set(["active", "lifted", "superseded"]);
export const PENALTY_ACTIONS = [
  "warn",
  "limit_feed",
  "mute",
  "ban",
  "shadow_ban",
  "content_remove",
  "other",
] as const;
export type CommunityPenaltyAction = (typeof PENALTY_ACTIONS)[number];
