#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const evid = process.argv[2];
const stamp = process.argv[3];
const api = process.argv[4];
const ocsState = process.argv[5];

const ddg = JSON.parse(fs.readFileSync(path.join(evid, 'fs-dg-audit.json'), 'utf8'));
const avatar = JSON.parse(fs.readFileSync(path.join(evid, 'ocs-official-avatar-remediation.json'), 'utf8'));

const signoff = {
  schema: 'traveltrust.ocs_post_apply_ddg.signoff.v1',
  stamp,
  environment: 'staging',
  api,
  prerequisite: 'TT_OCS_SURFACE_EXPANSION:VERIFIED',
  machine_key: 'TT_OCS_POST_APPLY_DDG',
  ddg_tiers: ['FALSE_POSITIVE', 'EXPECTED_OFFICIAL', 'REAL_LEAK'],
  avatar_remediation: { patched: avatar.patched, total: avatar.total },
  ddg_verdict: ddg.verdict,
  ddg_blocking: (ddg.issue_counts?.PRODUCT_DATA_DEFECT || 0) + (ddg.issue_counts?.TEST_DATA_LEAKAGE || 0),
  ddg_advisory: ddg.issue_counts?.ADVISORY || 0,
  ocs_ddg_remediation_mode: ddg.ocs_ddg_remediation_mode === true,
  ocs_state: ocsState,
  recorded_at: new Date().toISOString(),
};

signoff.verdict =
  ddg.verdict === 'PASS' && avatar.patched === avatar.total ? 'PASS' : 'FAIL';
signoff.machine_keys = {
  TT_OCS_POST_APPLY_DDG: signoff.verdict === 'PASS' ? 'PASS' : 'READY_FOR_REMEDIATION',
  TT_OCS_OFFICIAL_CONTENT_BASELINE:
    signoff.verdict === 'PASS' ? 'READY' : 'BLOCKED',
};

fs.writeFileSync(
  path.join(evid, 'ocs-post-apply-ddg-signoff.json'),
  JSON.stringify(signoff, null, 2) + '\n'
);
console.log(`OCS_POST_APPLY_DDG_SIGNOFF: ${signoff.verdict}`);
