#!/usr/bin/env node
/**
 * Production GO prep package (NO_GO — entry checklist only).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const prepDir =
  process.argv[2] || path.join(ROOT, 'evidence/GO_production_readiness/G3-06/preparation');
const stamp = process.argv[3] || new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

fs.mkdirSync(prepDir, { recursive: true });

const template = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'registry/production-go-decision-package.v1.template.json'), 'utf8')
);

const g3Domains = ['G3-01', 'G3-02', 'G3-03', 'G3-04', 'G3-05', 'G3-06'];
const domainStatus = Object.fromEntries(g3Domains.map((d) => [d, 'PLANNED']));

const prep = {
  schema: 'traveltrust.production_go_prep.v1',
  stamp,
  phase: 'phase12_release_prep',
  recorded_at: new Date().toISOString(),
  verdict: 'PREP_READY',
  machine_keys: {
    TT_PRODUCTION_GO_PREP: 'READY',
    TT_PRODUCTION_GO: 'NO_GO',
    TT_PRODUCTION_READINESS_G1_GATE: 'PASS',
    TT_PRODUCTION_READINESS_G2_GATE: 'PASS',
    TT_PRODUCTION_READINESS_G3_GATE: 'PLANNED',
  },
  production_go_decision_package: {
    status: 'TEMPLATE_ONLY',
    verdict: 'NO_GO',
    template: 'registry/production-go-decision-package.v1.template.json',
    required_before_go: template.required_gate_pass || [],
    g3_domains: domainStatus,
    owner_attestation: {
      name: null,
      decision: 'NO_GO',
      signed_utc: null,
      note: 'Owner signs at cutover — not during prep',
    },
  },
  completed_inputs: {
    official_content_baseline: 'V1 READY',
    ocs_surface_expansion: 'VERIFIED (staging)',
    ocs_post_apply_ddg: 'PASS (staging)',
    official_asset_baseline_v1: 'VERIFIED (staging)',
    g3_production_cdn_prep: 'READY',
  },
  blocking_for_go: [
    'G3-01..G3-06 each VERIFIED on production environment',
    'Production CDN edge probes (not Staging)',
    'Signed production-go-decision-package.json',
    'validate-production-go-decision-package.cjs exit 0',
  ],
  honest_boundary:
    'PREP READY ≠ Production GO. Staging OCS/asset evidence does not satisfy G3-06.',
  forbidden_claims: ['Production GO', 'G3 PASS', 'Phase ③ complete'],
};

fs.writeFileSync(path.join(prepDir, 'production-go-prep.json'), JSON.stringify(prep, null, 2) + '\n');

const checklist = g3Domains.map((d) => ({
  domain: d,
  status: 'PLANNED',
  evidence_root: `evidence/GO_production_readiness/${d}/`,
  verified_requires: 'production environment probes + formal acceptance',
}));

fs.writeFileSync(
  path.join(prepDir, 'g3-domain-entry-checklist.v1.json'),
  JSON.stringify({ schema: 'traveltrust.g3_domain_entry_checklist.v1', domains: checklist }, null, 2) + '\n'
);

const status = `TT_PRODUCTION_GO_PREP: READY
TT_PRODUCTION_GO: NO_GO
TT_PRODUCTION_READINESS_G3_GATE: PLANNED
at=${stamp}
note=Release prep only — publish deferred
honest_boundary=NO_GO until G3-01..G3-06 VERIFIED + signed Decision Package
`;
fs.writeFileSync(path.join(prepDir, 'STATUS.txt'), status);

console.log('PRODUCTION_GO_PREP: PREP_READY');
console.log('TT_PRODUCTION_GO: NO_GO');
