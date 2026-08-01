/**
 * Batch-11 W14 · P2 polish pack · HU-313/314/315/316/319/327/331/335/336/337
 * Remaining P2 in W14 scope → DEFER_NON_BLOCKING (Owner Solo sign)
 * ≠ fund write · ≠ Escrow state-machine · ≠ Production GO
 */

export const P2_POLISH_L5_W14_PROBE = "p2-polish-l5-batch11-w14-v1" as const;

/** FIXED this bake（②） */
export const P2_POLISH_FIXED_HUS = [
  "HU-313",
  "HU-314",
  "HU-315",
  "HU-316",
  "HU-319",
  "HU-327",
  "HU-331",
  "HU-335",
  "HU-336",
  "HU-337",
] as const;

/** DEFER_NON_BLOCKING · Owner Solo 签收 · 不挡 Batch-11 收口 */
export const P2_POLISH_DEFER_HUS = [
  "HU-320",
  "HU-328",
  "HU-329",
  "HU-330",
  "HU-333",
  "HU-334",
  "HU-339",
  "HU-340",
  "HU-348",
  "HU-349",
  "HU-350",
  "HU-369",
  "HU-370",
  "HU-386",
  "HU-387",
  "HU-388",
  "HU-389",
  "HU-405",
  "HU-406",
  "HU-407",
  "HU-408",
  "HU-409",
  "HU-425",
  "HU-426",
  "HU-428",
  "HU-429",
] as const;

export type P2PolishDeferPolicy = "defer_non_blocking_owner_solo";

export function resolveP2PolishDeferPolicy(): {
  policy: P2PolishDeferPolicy;
  fixed: readonly string[];
  defer: readonly string[];
} {
  return {
    policy: "defer_non_blocking_owner_solo",
    fixed: P2_POLISH_FIXED_HUS,
    defer: P2_POLISH_DEFER_HUS,
  };
}
