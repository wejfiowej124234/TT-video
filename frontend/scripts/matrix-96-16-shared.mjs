// Single source of truth: 96-16 app route list + N_A + COVERED_RULES (longest-prefix wins).
// Used by build-d5d6d7-coverage-matrix.mjs and build-d1-d12-coverage-matrix.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FRONTEND_ROOT = path.join(__dirname, "..");

/** Exact route paths (leading /, no /page) that have no D5–D7 interactive surface in app UI */
export const NA_EXACT = new Set([
  "/network",
  "/me",
  "/community/post/[id]",
  "/community/me/collects",
  "/community/me/likes",
  "/community/me/posts",
]);

/**
 * Longest match wins. `match` is route prefix (must be normalized, no trailing / except "/").
 * evidence = basename under frontend/evidence/
 */
export const COVERED_RULES = [
  { match: "exact", path: "/(home)", evidence: "GO_96_16_d5_d6_d7_landing_batch.json", note: "Home: LandingHero + LCP/CLS/motion" },
  { match: "prefix", path: "/community/me/reports", evidence: "GO_96_16_d5_d6_d7_reports_orders_admin_deep.json" },
  { match: "prefix", path: "/admin/compliance/requests", evidence: "GO_96_16_d5_d6_d7_reports_orders_admin_deep.json" },
  { match: "exact", path: "/admin/scheduler/jobs", evidence: "GO_96_16_d5_d6_d7_reports_orders_admin_deep.json" },
  { match: "prefix", path: "/admin/community", evidence: "GO_96_16_d5_d6_d7_admin_community_observability_config_guides_staking_traveltrust.json" },
  { match: "exact", path: "/admin/observability", evidence: "GO_96_16_d5_d6_d7_admin_community_observability_config_guides_staking_traveltrust.json" },
  { match: "prefix", path: "/admin/config", evidence: "GO_96_16_d5_d6_d7_admin_community_observability_config_guides_staking_traveltrust.json" },
  { match: "exact", path: "/admin/finance", evidence: "GO_96_16_d5_d6_d7_admin_finance_disputes_orders_governance_market.json" },
  { match: "exact", path: "/admin/finance-reconciliation", evidence: "GO_96_16_d5_d6_d7_admin_finance_disputes_orders_governance_market.json" },
  { match: "prefix", path: "/admin/disputes", evidence: "GO_96_16_d5_d6_d7_admin_finance_disputes_orders_governance_market.json" },
  { match: "prefix", path: "/admin/orders", evidence: "GO_96_16_d5_d6_d7_admin_finance_disputes_orders_governance_market.json" },
  { match: "exact", path: "/admin", evidence: "GO_96_16_d5_d6_d7_admin_orders_escrow_pay_batch5.json" },
  {
    match: "prefix",
    path: "/admin",
    evidence: "GO_96_16_d5_d6_d7_admin_subroutes_d5d6d7.json",
    note: "Residual /admin/* after longer-prefix rules; layout + AdminShellBar D5–D7 baseline",
  },
  { match: "exact", path: "/governance/params", evidence: "GO_96_16_d5_d6_d7_admin_finance_disputes_orders_governance_market.json" },
  { match: "exact", path: "/governance/delegate", evidence: "GO_96_16_d5_d6_d7_admin_finance_disputes_orders_governance_market.json" },
  { match: "exact", path: "/governance/distribution-claim", evidence: "GO_96_16_d5_d6_d7_admin_finance_disputes_orders_governance_market.json" },
  { match: "prefix", path: "/market/acquisition", evidence: "GO_96_16_d5_d6_d7_admin_finance_disputes_orders_governance_market.json", note: "acquisition + [id] via detail views" },
  { match: "prefix", path: "/market/provider", evidence: "GO_96_16_d5_d6_d7_admin_finance_disputes_orders_governance_market.json" },
  { match: "exact", path: "/governance", evidence: "GO_96_16_d5_d6_d7_routes_batch.json" },
  { match: "exact", path: "/governance", evidence: "GO_96_16_d5_d6_d7_community_traveltrust_governance_batch4.json", note: "governance root / hub" },
  { match: "prefix", path: "/governance/distribution-accruals", evidence: "GO_96_16_d5_d6_d7_governance_subroutes_d5d6d7.json" },
  { match: "prefix", path: "/governance/proposals", evidence: "GO_96_16_d5_d6_d7_governance_subroutes_d5d6d7.json" },
  { match: "exact", path: "/governance/fee-routes", evidence: "GO_96_16_d5_d6_d7_governance_subroutes_d5d6d7.json" },
  { match: "exact", path: "/governance/vault-forwards", evidence: "GO_96_16_d5_d6_d7_governance_subroutes_d5d6d7.json" },
  { match: "prefix", path: "/market", evidence: "GO_96_16_d5_d6_d7_routes_batch.json" },
  { match: "prefix", path: "/market", evidence: "GO_96_16_d5_d6_d7_routes_followup2.json" },
  { match: "prefix", path: "/market", evidence: "GO_96_16_d5_d6_d7_routes_followup3.json" },
  { match: "prefix", path: "/community/tt", evidence: "GO_96_16_d5_d6_d7_routes_followup2.json" },
  { match: "prefix", path: "/community/explore", evidence: "GO_96_16_d5_d6_d7_community_traveltrust_governance_batch4.json" },
  { match: "prefix", path: "/community/me", evidence: "GO_96_16_d5_d6_d7_me_community_itinerary_discover_traveltrust.json" },
  { match: "prefix", path: "/community", evidence: "GO_96_16_d5_d6_d7_routes_batch.json" },
  { match: "prefix", path: "/auth", evidence: "GO_96_16_d5_d6_d7_auth_me_guides_staking_legal_batch.json" },
  { match: "exact", path: "/me/password", evidence: "GO_96_16_d5_d6_d7_auth_me_guides_staking_legal_batch.json" },
  { match: "exact", path: "/me/onboarding", evidence: "GO_96_16_d5_d6_d7_auth_me_guides_staking_legal_batch.json" },
  { match: "prefix", path: "/guides", evidence: "GO_96_16_d5_d6_d7_auth_me_guides_staking_legal_batch.json" },
  { match: "prefix", path: "/guides", evidence: "GO_96_16_d5_d6_d7_routes_followup3.json" },
  { match: "prefix", path: "/guides", evidence: "GO_96_16_d5_d6_d7_admin_community_observability_config_guides_staking_traveltrust.json" },
  { match: "prefix", path: "/staking", evidence: "GO_96_16_d5_d6_d7_auth_me_guides_staking_legal_batch.json" },
  { match: "prefix", path: "/staking", evidence: "GO_96_16_d5_d6_d7_admin_community_observability_config_guides_staking_traveltrust.json" },
  { match: "prefix", path: "/terms", evidence: "GO_96_16_d5_d6_d7_auth_me_guides_staking_legal_batch.json" },
  { match: "exact", path: "/privacy", evidence: "GO_96_16_d5_d6_d7_auth_me_guides_staking_legal_batch.json" },
  { match: "prefix", path: "/itinerary", evidence: "GO_96_16_d5_d6_d7_me_community_itinerary_discover_traveltrust.json" },
  { match: "exact", path: "/discover", evidence: "GO_96_16_d5_d6_d7_me_community_itinerary_discover_traveltrust.json" },
  { match: "prefix", path: "/orders", evidence: "GO_96_16_d5_d6_d7_admin_orders_escrow_pay_batch5.json" },
  { match: "prefix", path: "/escrow", evidence: "GO_96_16_d5_d6_d7_admin_orders_escrow_pay_batch5.json" },
  { match: "exact", path: "/pay", evidence: "GO_96_16_d5_d6_d7_admin_orders_escrow_pay_batch5.json" },
  { match: "prefix", path: "/traveltrust", evidence: "GO_96_16_d5_d6_d7_routes_batch.json" },
  { match: "prefix", path: "/traveltrust", evidence: "GO_96_16_d5_d6_d7_me_community_itinerary_discover_traveltrust.json" },
  { match: "prefix", path: "/traveltrust", evidence: "GO_96_16_d5_d6_d7_community_traveltrust_governance_batch4.json" },
  { match: "prefix", path: "/traveltrust", evidence: "GO_96_16_d5_d6_d7_admin_community_observability_config_guides_staking_traveltrust.json" },
  { match: "exact", path: "/did-rank", evidence: "GO_96_16_d5_d6_d7_uncovered_routes_sweep.json" },
  { match: "prefix", path: "/disputes", evidence: "GO_96_16_d5_d6_d7_uncovered_routes_sweep.json" },
  { match: "exact", path: "/guide/register", evidence: "GO_96_16_d5_d6_d7_uncovered_routes_sweep.json" },
  { match: "exact", path: "/guide", evidence: "GO_96_16_d5_d6_d7_uncovered_routes_sweep.json" },
  { match: "exact", path: "/help", evidence: "GO_96_16_d5_d6_d7_uncovered_routes_sweep.json" },
  { match: "exact", path: "/trust", evidence: "GO_96_16_d5_d6_d7_uncovered_routes_sweep.json" },
];

export function walkPages(dir, out) {
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name);
    if (n.isDirectory()) walkPages(p, out);
    else if (n.isFile() && n.name === "page.tsx") out.push(p);
  }
}

export function fileToRoute(fileAbs, frontendRoot) {
  const rel = path.relative(path.join(frontendRoot, "app"), fileAbs).replace(/\\/g, "/");
  const segs = rel.replace(/\/page\.tsx$/, "");
  if (segs === "(home)") return "/(home)";
  if (segs === "page.tsx") return "/";
  return "/" + segs;
}

function routePathForMatch(route) {
  if (route === "/(home)") return "/(home)";
  return route;
}

function matchesRule(route, rule) {
  const r = routePathForMatch(route);
  if (rule.match === "exact") return r === rule.path;
  if (rule.match === "prefix") {
    if (rule.path === "/") return r === "/";
    return r === rule.path || r.startsWith(`${rule.path}/`);
  }
  return false;
}

function ruleSpecificityLength(rule) {
  return rule.path.length;
}

/** @returns {{ status: "N_A" | "COVERED" | "NEEDS_FIX", evidence_files: string[] }} */
export function classifyRoute(route) {
  if (NA_EXACT.has(route)) {
    return { status: "N_A", evidence_files: [] };
  }
  const applicable = COVERED_RULES.filter((rule) => matchesRule(route, rule));
  if (applicable.length > 0) {
    const maxLen = Math.max(...applicable.map(ruleSpecificityLength));
    const best = applicable.filter((r) => ruleSpecificityLength(r) === maxLen);
    const files = [...new Set(best.map((x) => x.evidence))];
    return { status: "COVERED", evidence_files: files };
  }
  return { status: "NEEDS_FIX", evidence_files: [] };
}

/** 119 (or N) `page.tsx` routes under `app/` and map route → rel path for matrix rows. */
export function buildRouteIndex(frontendRoot) {
  const pages = [];
  walkPages(path.join(frontendRoot, "app"), pages);
  const byRoute = new Map();
  for (const p of pages) {
    const r = fileToRoute(p, frontendRoot);
    byRoute.set(r, p.replace(frontendRoot + path.sep, "").replace(/\\/g, "/"));
  }
  const routes = [...byRoute.keys()].sort((a, b) => a.localeCompare(b));
  return { routes, byRoute, pageCount: pages.length };
}
