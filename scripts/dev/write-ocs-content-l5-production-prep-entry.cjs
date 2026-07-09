#!/usr/bin/env node
/**
 * Write OCS Content L5 Production Preparation entry evidence.
 *
 *   node scripts/dev/write-ocs-content-l5-production-prep-entry.cjs \
 *     --stamp 20260704T155206Z --asset-baseline-rc 0 --asset-evidence-dir evidence/.../20260704T155206Z
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function main() {
  const stamp = arg('--stamp');
  const assetBaselineRc = Number(arg('--asset-baseline-rc') ?? '2');
  const assetEvidenceDir = arg('--asset-evidence-dir') || '';
  const api = arg('--api') || 'https://tt-api-staging.fly.dev';
  const stagingBytesMatch = arg('--staging-bytes-match') === '1';

  if (!stamp) {
    console.error('usage: --stamp UTC --asset-baseline-rc N [--asset-evidence-dir path] [--staging-bytes-match 0|1]');
    process.exit(2);
  }

  const evidPp = path.join(ROOT, 'evidence/GO_production_preparation');
  const entryDir = path.join(evidPp, `OCS-CONTENT-L5-PRODUCTION-PREP-ENTRY-${stamp}`);
  fs.mkdirSync(entryDir, { recursive: true });

  const assetVerified = assetBaselineRc === 0;
  const realMediaOnStaging = assetVerified && stagingBytesMatch;

  const entry = {
    schema: 'traveltrust.ocs_content_l5_production_prep_entry.v1',
    stamp_utc: stamp,
    phase: 'Production Preparation entry',
    prerequisite: {
      TT_OCS_CONTENT_L5: 'CLOSED',
      closure_evidence:
        'evidence/GO_official_cold_start_dataset/ocs-content-l5/20260704T155000Z/OCS-CONTENT-L5-CLOSED.json',
    },
    staging_target: api,
    asset_baseline: {
      stamp,
      evidence_dir: assetEvidenceDir || `evidence/GO_official_cold_start_dataset/ocs-official-asset-baseline/${stamp}/`,
      rebootstrap_real_content_l5_media: realMediaOnStaging,
      verify_pass: assetVerified,
      staging_bytes_match_local: stagingBytesMatch,
      exit_code: assetBaselineRc,
      supersedes_placeholder_baseline:
        'evidence/GO_official_cold_start_dataset/ocs-official-asset-baseline/20260704T085638Z',
      note: realMediaOnStaging
        ? 'Staging serves Content L5 real JPEG bytes'
        : 'HTTP verify PASS but staging may still serve pre-L5 placeholder bytes until fly deploy rebundle',
    },
    production_preparation: {
      status: realMediaOnStaging ? 'IN_PROGRESS' : 'STAGING_MEDIA_DEPLOY_PENDING',
      track: 'ocs_staging_asset_rebootstrap_post_content_l5',
    },
    machine_keys: {
      TT_OCS_CONTENT_L5: 'CLOSED',
      TT_OCS_OFFICIAL_ASSET_BASELINE_V1: realMediaOnStaging ? 'VERIFIED' : 'REBASELINE_PENDING',
      TT_PRODUCTION_GO: 'NO_GO',
    },
    honest_boundary:
      'Production Preparation entry（② staging 真图 rebootstrap）≠ ③ Production GO · G6 blind UAT 仍属后续 ② 验收',
  };

  const entryPath = path.join(entryDir, 'OCS-CONTENT-L5-PRODUCTION-PREP-ENTRY.json');
  fs.writeFileSync(entryPath, JSON.stringify(entry, null, 2) + '\n');
  fs.writeFileSync(
    path.join(evidPp, 'OCS-CONTENT-L5-PRODUCTION-PREP-ENTRY-LATEST.json'),
    JSON.stringify(entry, null, 2) + '\n',
  );

  console.log(
    `TT_OCS_CONTENT_L5_PRODUCTION_PREP_ENTRY: ${realMediaOnStaging ? 'STAGING_ASSET_VERIFIED' : 'STAGING_MEDIA_DEPLOY_PENDING'}`,
  );
  console.log(`TT_OCS_CONTENT_L5_PRODUCTION_PREP_EVIDENCE: ${entryPath.replace(/\\/g, '/')}`);
}

main();
