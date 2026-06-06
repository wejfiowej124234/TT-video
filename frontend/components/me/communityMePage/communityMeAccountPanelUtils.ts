export type CommunityMeAccountPanelTFunc = (key: string, vars?: Record<string, string | number>) => string;

/** Client-side guard before `postMeProfileAvatar` (aligned with API body limits). */
export const COMMUNITY_ME_PROFILE_AVATAR_MAX_BYTES = 512 * 1024;

export function mePageStatNumber(stats: unknown, key: string): number | null {
  if (!stats || typeof stats !== "object") return 0;
  const o = stats as Record<string, unknown>;
  if (!(key in o)) return 0;
  const v = o[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}
