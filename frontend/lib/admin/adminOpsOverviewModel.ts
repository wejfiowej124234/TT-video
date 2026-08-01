/**
 * Production Admin Ops Overview SSOT (B-ADMIN-001 eng).
 *
 * Separate from Batch-9 `ADMIN_HOME_CARDS = []` freeze (sidebar = sole nav).
 * Each card must declare: data source · API · permission · updated_at · Evidence.
 * Does NOT uplift Matrix 144/200; seven-column completeness only.
 */

import { ADMIN_PERM, type AdminPermissionId } from "@/lib/admin/adminPermissionIds";

export type AdminOpsOverviewDomain =
  | "users"
  | "itinerary"
  | "orders"
  | "escrow"
  | "settlement"
  | "dispute"
  | "merchant"
  | "guide"
  | "media"
  | "risk"
  | "governance";

export type AdminOpsOverviewCard = {
  id: AdminOpsOverviewDomain;
  titleKey: string;
  href: string;
  /** Human-readable persistence / truth source */
  dataSource: string;
  /** Primary admin API path (①/② cite) */
  api: string;
  permission: AdminPermissionId;
  /** Evidence pack path or runbook cite */
  evidence: string;
  /** Static model stamp — runtime UI may overlay live `updated_at` */
  modelUpdatedAt: string;
  /** Seven-column matrix cell id (no score chase) */
  matrixCellId: string;
};

export const ADMIN_OPS_OVERVIEW_MODEL_STAMP = "20260727T071146Z";

/**
 * Production ops overview cards (fixed set).
 * Keep `ADMIN_HOME_CARDS` empty — this is not a second nav wall.
 */
export const ADMIN_OPS_OVERVIEW_CARDS: readonly AdminOpsOverviewCard[] = [
  {
    id: "users",
    titleKey: "admin_ops_overview_users",
    href: "/admin/users",
    dataSource: "postgres.users + admin users sample",
    api: "GET /api/v1/admin/users",
    permission: ADMIN_PERM.USERS_READ,
    evidence: "evidence/PSG-PRODUCTION-READINESS/blocking-remediation-phase/",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-USERS-OPS",
  },
  {
    id: "itinerary",
    titleKey: "admin_ops_overview_itinerary",
    href: "/admin/orders",
    dataSource: "postgres.itineraries + cover_media_asset_id",
    api: "GET /api/v1/admin/orders (itinerary-linked)",
    permission: ADMIN_PERM.ORDERS_READ,
    evidence: "docs/runbook/TT-PRODUCTION-GRADE-PARALLEL-ENGINEERING-TRACK-LATEST.md#itinerary",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-ITINERARY-OPS",
  },
  {
    id: "orders",
    titleKey: "admin_ops_overview_orders",
    href: "/admin/orders",
    dataSource: "postgres.orders / chain_off hydrate",
    api: "GET /api/v1/admin/orders",
    permission: ADMIN_PERM.ORDERS_READ,
    evidence: "evidence/PSG-PRODUCTION-READINESS/blocking-remediation-phase/",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-ORDERS-OPS",
  },
  {
    id: "escrow",
    titleKey: "admin_ops_overview_escrow",
    href: "/admin/orders",
    dataSource: "orders.escrow_address + escrow detail API",
    api: "GET /api/v1/orders/:id (escrow)",
    permission: ADMIN_PERM.ORDERS_READ,
    evidence: "frontend/evidence/GO_local_web3_itinerary_l5/ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-ESCROW-OPS",
  },
  {
    id: "settlement",
    titleKey: "admin_ops_overview_settlement",
    href: "/admin/finance-suite",
    dataSource: "SettlementRouter / fee_router (Finance Reality CITED_FROZEN)",
    api: "GET /api/v1/admin/finance/*",
    permission: ADMIN_PERM.FINANCE_READ,
    evidence: "docs/runbook/TT-FINANCE-SETTLEMENT-REALITY-ALIGNMENT-LATEST.md",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-SETTLEMENT-OPS",
  },
  {
    id: "dispute",
    titleKey: "admin_ops_overview_dispute",
    href: "/admin/disputes",
    dataSource: "postgres disputes (source=postgres)",
    api: "GET /api/v1/admin/disputes",
    permission: ADMIN_PERM.DISPUTES_WRITE,
    evidence: "evidence/PSG-PRODUCTION-READINESS/blocking-remediation-phase/",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-DISPUTE-OPS",
  },
  {
    id: "merchant",
    titleKey: "admin_ops_overview_merchant",
    href: "/admin/provider-applications",
    dataSource: "provider onboarding applications",
    api: "GET /api/v1/admin/provider-applications",
    permission: ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW,
    evidence: "frontend/evidence/GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-MERCHANT-OPS",
  },
  {
    id: "guide",
    titleKey: "admin_ops_overview_guide",
    href: "/admin/onboarding",
    dataSource: "guide / steward onboarding queues",
    api: "GET /api/v1/admin/onboarding/*",
    permission: ADMIN_PERM.ONBOARDING_STEWARD_REVIEW,
    evidence: "frontend/evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-GUIDE-OPS",
  },
  {
    id: "media",
    titleKey: "admin_ops_overview_media",
    href: "/admin",
    dataSource: "platform_media_assets + community_media_assets (eng SSOT)",
    api: "GET /api/v1/community/media/capabilities (≠ CDN Acceptance)",
    permission: ADMIN_PERM.PLATFORM_READ,
    evidence: "docs/runbook/TT-MEDIA-THREE-TIER-ARCHITECTURE.md",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-MEDIA-OPS",
  },
  {
    id: "risk",
    titleKey: "admin_ops_overview_risk",
    href: "/admin/growth",
    dataSource: "growth fraud / trust ops",
    api: "GET /api/v1/admin/growth/*",
    permission: ADMIN_PERM.GROWTH_FRAUD,
    evidence: "docs/runbook/TT-PRODUCTION-GRADE-USER-ADMIN-REALITY-ALIGNMENT-LATEST.md",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-RISK-OPS",
  },
  {
    id: "governance",
    titleKey: "admin_ops_overview_governance",
    href: "/admin/community",
    dataSource: "community governance + proposals corridor",
    api: "GET /api/v1/admin/community/*",
    permission: ADMIN_PERM.COMMUNITY_READ,
    evidence: "scripts/dev/smoke-governance-proposals-l5-local.sh",
    modelUpdatedAt: ADMIN_OPS_OVERVIEW_MODEL_STAMP,
    matrixCellId: "ADMIN-GOVERNANCE-OPS",
  },
] as const;

export function adminOpsOverviewCardById(
  id: AdminOpsOverviewDomain,
): AdminOpsOverviewCard | undefined {
  return ADMIN_OPS_OVERVIEW_CARDS.find((c) => c.id === id);
}

/** Contract: every card has seven-column-facing metadata fields. */
export function assertAdminOpsOverviewCompleteness(
  cards: readonly AdminOpsOverviewCard[] = ADMIN_OPS_OVERVIEW_CARDS,
): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  for (const c of cards) {
    if (!c.dataSource) missing.push(`${c.id}.dataSource`);
    if (!c.api) missing.push(`${c.id}.api`);
    if (!c.permission) missing.push(`${c.id}.permission`);
    if (!c.modelUpdatedAt) missing.push(`${c.id}.modelUpdatedAt`);
    if (!c.evidence) missing.push(`${c.id}.evidence`);
    if (!c.matrixCellId) missing.push(`${c.id}.matrixCellId`);
  }
  return missing.length ? { ok: false, missing } : { ok: true };
}
