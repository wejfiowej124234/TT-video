/**
 * Batch-11 W13 · users search/pagination + suspend copy honesty · HU-419 / HU-424
 * ≠ fund write · ≠ Escrow state-machine · ≠ Production GO
 */

export const USERS_SEARCH_SUSPEND_L5_W13_PROBE = "users-search-suspend-l5-batch11-w13-v1" as const;

export const USERS_EMAIL_FILTER_MAX = 128;
export const USERS_OFFSET_MAX = 100_000;

export type UsersCapabilityLaneId = "profile_readonly" | "role_approval" | "acquisition_gate_write";

export type UsersCapabilityLane = {
  id: UsersCapabilityLaneId;
  titleKey: string;
  bodyKey: string;
  writeKind: "none" | "approval_queue" | "gate_write";
};

/** HU-424 · profile read ≠ acquisition suspend write */
export const USERS_CAPABILITY_LANES: UsersCapabilityLane[] = [
  {
    id: "profile_readonly",
    titleKey: "admin_users_cap_profile_title",
    bodyKey: "admin_users_cap_profile_body",
    writeKind: "none",
  },
  {
    id: "role_approval",
    titleKey: "admin_users_cap_role_title",
    bodyKey: "admin_users_cap_role_body",
    writeKind: "approval_queue",
  },
  {
    id: "acquisition_gate_write",
    titleKey: "admin_users_cap_acquisition_title",
    bodyKey: "admin_users_cap_acquisition_body",
    writeKind: "gate_write",
  },
];

export function resolveUsersCapabilityHonesty(): {
  lanes: UsersCapabilityLane[];
  policy: "profile_readonly_vs_gate_write";
} {
  return {
    lanes: USERS_CAPABILITY_LANES,
    policy: "profile_readonly_vs_gate_write",
  };
}

export function clampUserOffset(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(USERS_OFFSET_MAX, Math.max(0, Math.floor(n)));
}

export function usersListRange(input: {
  offset: number;
  loaded: number;
  total: number | null;
  limit?: number;
}): { from: number; to: number; total: number | null; hasPrev: boolean; hasNext: boolean } {
  const offset = clampUserOffset(input.offset);
  const loaded = Number.isFinite(input.loaded) ? Math.max(0, Math.floor(input.loaded)) : 0;
  const total =
    typeof input.total === "number" && Number.isFinite(input.total)
      ? Math.max(0, Math.floor(input.total))
      : null;
  const from = loaded > 0 ? offset + 1 : 0;
  const to = loaded > 0 ? offset + loaded : 0;
  const hasPrev = offset > 0;
  const limit =
    typeof input.limit === "number" && Number.isFinite(input.limit)
      ? Math.max(1, Math.floor(input.limit))
      : null;
  const hasNext =
    total != null ? offset + loaded < total : limit != null ? loaded >= limit : false;
  return { from, to, total, hasPrev, hasNext };
}
