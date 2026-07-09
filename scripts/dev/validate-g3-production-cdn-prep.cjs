#!/usr/bin/env node
/**
 * Validate G3 Production CDN prep artifacts (PREP READY — not VERIFIED).
 *
 *   node scripts/dev/validate-g3-production-cdn-prep.cjs [PREP_DIR]
 */
const fs = require('fs');
const path = require('path');
const { ROOT, REGISTRY_PATH, loadAssetsManifest } = require('./lib/g3-production-cdn-policy.cjs');

const prepDir =
  process.argv[2] || path.join(ROOT, 'evidence/GO_production_readiness/G3-01/preparation');

const required = [
  'cloudflare-cache-rules.v1.json',
  'r2-lifecycle-policy.v1.json',
  'ocs-r2-upload-manifest.v1.json',
  'production-cdn-url-map.v1.json',
  'g3-cdn-prep-checklist.v1.json',
];

const stagingEvid = path.join(
  ROOT,
  'evidence/GO_official_cold_start_dataset/ocs-official-asset-baseline/20260704T085638Z'
);

const failures = [];
const passes = [];

for (const name of required) {
  const p = path.join(prepDir, name);
  if (!fs.existsSync(p)) failures.push(`missing ${name}`);
  else passes.push(name);
}

if (!fs.existsSync(REGISTRY_PATH)) failures.push('missing registry json');
else passes.push('registry');

const assetsDoc = loadAssetsManifest();
if ((assetsDoc.assets || []).length !== 60) {
  failures.push(`assets manifest count=${(assetsDoc.assets || []).length} expected 60`);
} else {
  passes.push('assets_manifest_60');
}

const stagingSignoff = path.join(stagingEvid, 'ocs-official-asset-baseline-signoff.json');
if (!fs.existsSync(stagingSignoff)) {
  failures.push('missing staging asset baseline signoff');
} else {
  const s = JSON.parse(fs.readFileSync(stagingSignoff, 'utf8'));
  if (s.verdict !== 'VERIFIED') failures.push(`staging signoff verdict=${s.verdict}`);
  else passes.push('staging_asset_baseline_verified');
}

const r2Bootstrap = path.join(prepDir, 'r2-bootstrap-result.v1.json');
if (fs.existsSync(r2Bootstrap)) {
  const b = JSON.parse(fs.readFileSync(r2Bootstrap, 'utf8'));
  if (b.ok && b.ok_count === 60) passes.push('r2_bootstrap_dry_run_60');
  else failures.push(`r2 bootstrap ${b.ok_count}/${b.object_count}`);
} else {
  failures.push('missing r2-bootstrap-result.v1.json');
}

const report = {
  schema: 'traveltrust.g3_production_cdn_prep_validation.v1',
  prep_dir: prepDir,
  recorded_at: new Date().toISOString(),
  verdict: failures.length === 0 ? 'READY' : 'FAIL',
  machine_keys: {
    TT_G3_PRODUCTION_CDN_PREP: failures.length === 0 ? 'READY' : 'FAIL',
    TT_G3_PRODUCTION_CDN_VERIFIED: 'PLANNED',
  },
  passes,
  failures,
  honest_boundary:
    'PREP READY ≠ G3-01 CDN VERIFIED — requires production DNS cutover + CDN probes',
  forbidden_claims: ['G3 Production CDN VERIFIED', 'Production GO'],
};

const outPath = path.join(prepDir, 'g3-production-cdn-prep-validation.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

console.log(`G3_PRODUCTION_CDN_PREP: ${report.verdict}`);
console.log(`TT_G3_PRODUCTION_CDN_PREP: ${report.machine_keys.TT_G3_PRODUCTION_CDN_PREP}`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
}
process.exit(failures.length ? 1 : 0);
