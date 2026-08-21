/**
 * `/traveltrust` Homepage Module Registry (code mirror).
 * YAML SSOT: `registry/traveltrust-home-module-registry.v1.yaml`
 *
 * LOCKED is this-wave release policy, not a permanent architecture name.
 * Do not invent official/local dual-track bodies.
 */

export const TRAVELTRUST_HOME_MODULE_REGISTRY_ID = "TRAVELTRUST_HOME_MODULAR_RELEASE_V1" as const;

export const TRAVELTRUST_HOME_MODULE_MARKER_ATTR = "data-tt-home-module" as const;

export const TRAVELTRUST_HOME_MODULE_IDS = [
  "M01",
  "M02",
  "M03",
  "M04",
  "M05",
  "M06",
  "M07",
  "M08",
  "M09",
  "M10",
  "M11",
] as const;

export type TraveltrustHomeModuleId = (typeof TRAVELTRUST_HOME_MODULE_IDS)[number];

export const TRAVELTRUST_HOME_MODULE_SLUGS = {
  M01: "M01_HEADER",
  M02: "M02_LIVE_NAV",
  M03: "M03_PULSE",
  M04: "M04_HERO",
  M05: "M05_TRUST",
  M06: "M06_SETTLEMENT",
  M07: "M07_UNLOCK",
  M08: "M08_LIQUIDITY",
  M09: "M09_ROLES",
  M10: "M10_FAQ",
  M11: "M11_START_CTA",
} as const satisfies Record<TraveltrustHomeModuleId, string>;

/** Layout-lock section id → Module ID. pulse is chrome, not in sectionOrder. */
export const TRAVELTRUST_HOME_SECTION_TO_MODULE = {
  pulse: "M03",
  hero: "M04",
  trust: "M05",
  settlement: "M06",
  unlock: "M07",
  liquidity: "M08",
  roles: "M09",
  faq: "M10",
  start: "M11",
} as const;

export type TraveltrustHomeModuleSectionId = keyof typeof TRAVELTRUST_HOME_SECTION_TO_MODULE;

export const TRAVELTRUST_HOME_THIS_WAVE_LOCKED_MODULE_IDS = ["M01", "M02", "M03"] as const;

export const TRAVELTRUST_HOME_MODULE_LIFECYCLE = [
  "CANONICAL_ACTIVE",
  "LOCAL_ONLY_PENDING",
  "READY_FOR_RELEASE",
  "PROD_ONLY_REBASE",
  "DEPRECATED",
] as const;

export type TraveltrustHomeModuleLifecycle = (typeof TRAVELTRUST_HOME_MODULE_LIFECYCLE)[number];

/** Can this lifecycle status enter RELEASE_SCOPE for a product bake? */
export const TRAVELTRUST_HOME_MODULE_LIFECYCLE_SHIP = {
  CANONICAL_ACTIVE: "yes",
  LOCAL_ONLY_PENDING: "no",
  READY_FOR_RELEASE: "auth_required",
  PROD_ONLY_REBASE: "no",
  DEPRECATED: "dedicated_delete_release",
} as const satisfies Record<TraveltrustHomeModuleLifecycle, string>;

export const TRAVELTRUST_HOME_MODULE_LIFECYCLE_TRANSITIONS = {
  LOCAL_ONLY_PENDING: ["READY_FOR_RELEASE", "DEPRECATED"],
  READY_FOR_RELEASE: ["CANONICAL_ACTIVE", "LOCAL_ONLY_PENDING"],
  CANONICAL_ACTIVE: ["READY_FOR_RELEASE", "DEPRECATED"],
  PROD_ONLY_REBASE: ["CANONICAL_ACTIVE"],
  DEPRECATED: [],
} as const;

export const TRAVELTRUST_HOME_M07_LIFECYCLE_PATH = [
  "LOCAL_ONLY_PENDING",
  "READY_FOR_RELEASE",
  "RELEASE_SCOPE_PASS",
  "STAGING_OR_PRODUCTION_DEPLOY",
  "RUNTIME_VERIFICATION_PASS",
  "CANONICAL_ACTIVE",
] as const;

export const TRAVELTRUST_HOME_LIFECYCLE_EVIDENCE_FIELDS = [
  "module_id",
  "from_state",
  "to_state",
  "git_sha",
  "tests",
  "timestamp",
  "reason",
] as const;

export const TRAVELTRUST_HOME_LIFECYCLE_LEDGER_PATH =
  "registry/traveltrust-home-module-lifecycle-ledger.v1.json" as const;

/** Scope gate helper. Does not Fly-deploy. LOCAL_ONLY_PENDING never ships. */
export function traveltrustHomeModuleMayEnterReleaseScope(
  status: TraveltrustHomeModuleLifecycle,
  opts: { ownerAuth?: boolean; deleteRelease?: boolean } = {},
): boolean {
  if (status === "CANONICAL_ACTIVE") return true;
  if (status === "READY_FOR_RELEASE") return Boolean(opts.ownerAuth);
  if (status === "DEPRECATED") return Boolean(opts.deleteRelease);
  return false;
}

export function traveltrustHomeModuleMarker(id: TraveltrustHomeModuleId): {
  [TRAVELTRUST_HOME_MODULE_MARKER_ATTR]: TraveltrustHomeModuleId;
} {
  return { [TRAVELTRUST_HOME_MODULE_MARKER_ATTR]: id };
}

export function traveltrustHomeModuleIdForSection(
  sectionId: string,
): TraveltrustHomeModuleId | null {
  if (sectionId in TRAVELTRUST_HOME_SECTION_TO_MODULE) {
    return TRAVELTRUST_HOME_SECTION_TO_MODULE[sectionId as TraveltrustHomeModuleSectionId];
  }
  return null;
}
