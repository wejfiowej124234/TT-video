#!/usr/bin/env node
/**
 * G3 Production CDN prep signoff (PREP READY — not VERIFIED).
 */
const fs = require('fs');
const path = require('path');

const prepDir =
  process.argv[2] || path.join(__dirname, '../../evidence/GO_production_readiness/G3-01/preparation');
const stamp = process.argv[3] || new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

function readJson(name) {
  const p = path.join(prepDir, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const validation = readJson('g3-production-cdn-prep-validation.json');
const r2Bootstrap = readJson('r2-bootstrap-result.v1.json');
const urlMap = readJson('production-cdn-url-map.v1.json');

const ready = validation?.verdict === 'READY';
const signoff = {
  schema: 'traveltrust.g3_production_cdn_prep.signoff.v1',
  stamp,
  environment: 'preparation',
  phase: 'phase12_release_prep',
  baseline: 'Official Asset Baseline V1',
  recorded_at: new Date().toISOString(),
  verdict: ready ? 'PREP_READY' : 'FAIL',
  machine_keys: {
    TT_G3_PRODUCTION_CDN_PREP: ready ? 'READY' : 'FAIL',
    TT_G3_PRODUCTION_CDN_VERIFIED: 'PLANNED',
    TT_OCS_OFFICIAL_ASSET_BASELINE_V1: 'VERIFIED',
    TT_PRODUCTION_GO: 'NO_GO',
  },
  cdn_policy: {
    public_base: 'https://cdn.traveltrust.app',
    official_prefix: 'official-cold-start/v1',
    cache: 'public, max-age=31536000, immutable',
    lifecycle: 'r2-lifecycle-policy.v1.json',
    version_management: 'V1 prefix — bump on expansion',
  },
  r2_bootstrap: {
    mode: r2Bootstrap?.mode,
    ok_count: r2Bootstrap?.ok_count,
    object_count: r2Bootstrap?.object_count,
  },
  production_url_map_count: urlMap?.assets?.length || 0,
  staging_asset_evidence:
    'evidence/GO_official_cold_start_dataset/ocs-official-asset-baseline/20260704T085638Z',
  owner_cutover_steps: [
    'Cloudflare R2 + cdn.traveltrust.app DNS',
    'PRODUCTION_CDN_DRY_RUN=0 configure-production-media-r2-cdn.sh',
    'bootstrap-ocs-official-assets-to-r2.cjs --apply',
    'Production CDN HEAD + cf-cache-status probes',
    'run-reality-verification.sh --gate G3 --domain G3-01',
  ],
  honest_boundary:
    'TT_G3_PRODUCTION_CDN_PREP READY = artifacts + validators complete. NOT Production CDN VERIFIED. NOT Production GO.',
  forbidden_claims: ['G3 Production CDN VERIFIED', 'Production GO', 'Phase ③ complete from Staging'],
};

fs.writeFileSync(path.join(prepDir, 'g3-production-cdn-prep-signoff.json'), JSON.stringify(signoff, null, 2) + '\n');

const status = `TT_G3_PRODUCTION_CDN_PREP: ${signoff.machine_keys.TT_G3_PRODUCTION_CDN_PREP}
TT_G3_PRODUCTION_CDN_VERIFIED: PLANNED
TT_PRODUCTION_GO: NO_GO
environment: preparation
at=${stamp}
prep_dir=${path.basename(prepDir)}
official_assets=60
note=Release prep complete — Owner cutover deferred — not Production GO
honest_boundary=PREP READY only
`;
fs.writeFileSync(path.join(prepDir, 'STATUS.txt'), status);

console.log(`G3_PRODUCTION_CDN_PREP_SIGNOFF: ${signoff.verdict}`);
process.exit(ready ? 0 : 1);
