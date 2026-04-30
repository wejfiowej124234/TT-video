// Build formal D5/D6/D7 coverage matrix for all app/**/page.tsx (96-16: 119 routes).
// Route rules: scripts/matrix-96-16-shared.mjs
import fs from "node:fs";
import path from "node:path";
import { buildRouteIndex, classifyRoute, FRONTEND_ROOT } from "./matrix-96-16-shared.mjs";

const frontendRoot = FRONTEND_ROOT;
const DEFAULT_CI = ["npm run lint", "npm run test:i18n:ci", "npm run build"];

const { routes, byRoute } = buildRouteIndex(frontendRoot);

const rows = routes.map((route) => {
  const c = classifyRoute(route);
  const file = byRoute.get(route) ?? "";
  const risksBase =
    c.status === "NEEDS_FIX"
      ? "No D5–D7 matrix rule or N_A; likely gap until audited or rule added. Playwright E2E 93 NOT_RUN — no per-route a11y proof."
      : c.status === "N_A"
        ? "Page is redirect-only or has no D5–D7 surface; matrix marks N_A."
        : "Evidence-based COVERED; still spot-check and extend Vitest as modules change. E2E 93 NOT_RUN.";
  return {
    file: `frontend/${file}`,
    route,
    d5d6d7: c.status,
    evidence_files: c.evidence_files,
    test_commands: DEFAULT_CI,
    remaining_risks: risksBase,
  };
});

const counts = rows.reduce(
  (acc, r) => {
    acc[r.d5d6d7] = (acc[r.d5d6d7] || 0) + 1;
    return acc;
  },
  { COVERED: 0, N_A: 0, NEEDS_FIX: 0 },
);

const out = {
  kind: "GO_96_16_d5d6d7_coverage_matrix",
  version: 2,
  generated_by: "scripts/build-d5d6d7-coverage-matrix.mjs",
  route_rules: "scripts/matrix-96-16-shared.mjs",
  methodology:
    "119 app routes = all app/**/page.tsx. N_A = exact set NA_EXACT (evaluated first; redirect/thin/legacy). COVERED = among COVERED_RULES that match, take those with maximum rule.path.length (longest prefix or exact), union their evidence file basenames; ties at max length are unioned. Unmatched = NEEDS_FIX. Matrix is rules-driven (not by re-reading evidence body text for gaps).",
  match_policy: "N_A first; then longest matching rule path wins; evidence_files = unique evidence from winning rule row(s) only.",
  total_routes: rows.length,
  counts,
  playwright_e2e: { status: "NOT_RUN", trace: "93" },
  claim_96_complete: false,
  default_ci_commands: DEFAULT_CI,
  recommended_vitest_when_touching: [
    "Targeted: npm test -- --run <path to *.test.ts for edited lib or route contract>",
    "Example: lib/mapIntentError.test.ts, lib/stakingEnv.test.ts, app/governance/proposals/*contract*.ts",
  ],
  rows,
};

fs.writeFileSync(path.join(frontendRoot, "evidence", "GO_96_16_d5_d6_d7_coverage_matrix_v1.json"), JSON.stringify(out, null, 2));
console.log(`Wrote matrix: COVERED=${counts.COVERED} N_A=${counts.N_A} NEEDS_FIX=${counts.NEEDS_FIX}`);
