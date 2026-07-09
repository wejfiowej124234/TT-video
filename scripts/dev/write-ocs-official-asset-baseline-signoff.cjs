#!/usr/bin/env node
/**
 * Official Asset Baseline V1 · independent Staging signoff (② only).
 *
 *   node scripts/dev/write-ocs-official-asset-baseline-signoff.cjs <EVID_DIR> <STAMP> <API>
 */
const fs = require('fs');
const path = require('path');

const evid = process.argv[2];
const stamp = process.argv[3];
const api = (process.argv[4] || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');

function readJson(name) {
  const p = path.join(evid, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const assetVerify = readJson('asset-verification.json');
const surfaceSignoff = readJson('ocs-surface-expansion-signoff.json');
const bindings = readJson('media-bindings.json');
const bootstrap = readJson('asset-bootstrap.json');

const assetPass = assetVerify?.delivery_ok === true && assetVerify?.legacy_ok !== false;
const surfacePass = surfaceSignoff?.verdict === 'PASS' && surfaceSignoff?.publish_gate_pass === true;
const bindingsOk = (bindings?.sql_pending ?? 0) === 0 && (bindings?.results || []).every((r) => r.ok !== false);

const verdict = assetPass && surfacePass && bindingsOk ? 'VERIFIED' : 'FAIL';

const signoff = {
  schema: 'traveltrust.ocs_official_asset_baseline.signoff.v1',
  stamp,
  environment: 'staging',
  api,
  baseline: 'Official Asset Baseline V1',
  recorded_at: new Date().toISOString(),
  verdict,
  machine_keys: {
    TT_OCS_OFFICIAL_ASSET_BASELINE_V1: verdict === 'VERIFIED' ? 'VERIFIED' : 'FAIL',
    TT_OCS_ASSET_VERIFICATION: assetVerify?.machine_keys?.TT_OCS_ASSET_VERIFICATION || (assetPass ? 'PASS' : 'FAIL'),
    TT_OCS_SURFACE_EXPANSION: surfaceSignoff?.machine_keys?.TT_OCS_SURFACE_EXPANSION || 'UNKNOWN',
  },
  asset_verification: {
    delivery_ok: assetVerify?.delivery_ok,
    delivery_pass: assetVerify?.delivery_pass,
    asset_count: assetVerify?.asset_count,
  },
  publish_gate: surfaceSignoff?.publish_gate || null,
  publish_gate_pass: surfaceSignoff?.publish_gate_pass,
  media_bindings: {
    http_patched: bindings?.http_patched,
    sql_applied: bindings?.sql_applied,
    sql_pending: bindings?.sql_pending,
  },
  bootstrap: {
    local_count: bootstrap?.local_count,
    remote_ok: bootstrap?.remote_ok,
    fly_app: bootstrap?.fly_app,
  },
  manifests: {
    content: 'data/official-cold-start/dataset.v1.json',
    assets: 'data/official-cold-start/assets.v1.json',
  },
  honest_boundary:
    'Staging TT_OCS_OFFICIAL_ASSET_BASELINE_V1 VERIFIED ≠ G3 Production CDN ≠ Production GO',
  forbidden_claims: ['G3 Production CDN VERIFIED', 'Production GO', 'Phase ③ CDN edge'],
};

fs.writeFileSync(path.join(evid, 'ocs-official-asset-baseline-signoff.json'), JSON.stringify(signoff, null, 2) + '\n');

const status = `TT_OCS_OFFICIAL_ASSET_BASELINE_V1: ${signoff.machine_keys.TT_OCS_OFFICIAL_ASSET_BASELINE_V1}
environment: staging
at=${stamp}
api=${api}
evidence=${path.basename(evid)}
signoff=ocs-official-asset-baseline-signoff.json
asset_count=60
note=Independent staging evidence — not G3 Production CDN — not Production GO
honest_boundary=Staging VERIFIED only
`;
fs.writeFileSync(path.join(evid, 'STATUS.txt'), status);

console.log(`OCS_OFFICIAL_ASSET_BASELINE_SIGNOFF: ${verdict}`);
console.log(`TT_OCS_OFFICIAL_ASSET_BASELINE_V1: ${signoff.machine_keys.TT_OCS_OFFICIAL_ASSET_BASELINE_V1}`);
process.exit(verdict === 'VERIFIED' ? 0 : 1);
