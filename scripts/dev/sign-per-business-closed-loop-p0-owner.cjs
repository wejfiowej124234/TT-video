#!/usr/bin/env node
/**
 * PER P0-1 · Owner sign-off (evidence-only · no runtime mutation).
 *
 *   node scripts/dev/sign-per-business-closed-loop-p0-owner.cjs
 *   node scripts/dev/sign-per-business-closed-loop-p0-owner.cjs --stamp 20260705T013500Z
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_preparation/per-business-closed-loop');
const LATEST = path.join(EVID_ROOT, 'PER-BUSINESS-CLOSED-LOOP-P0-LATEST.json');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function main() {
  if (!fs.existsSync(LATEST)) {
    console.error('PER P0-1 LATEST missing');
    process.exit(2);
  }
  const report = JSON.parse(fs.readFileSync(LATEST, 'utf8'));
  const stamp = arg('--stamp') || report.stamp_utc;
  const signedAt = arg('--signed-at') || new Date().toISOString();

  const expected = {
    TT_PER_BUSINESS_CLOSED_LOOP: 'PASS',
    fail: 0,
    pass: 15,
    pass_expected_difference: 2,
  };

  const mismatches = [];
  if (report.TT_PER_BUSINESS_CLOSED_LOOP !== expected.TT_PER_BUSINESS_CLOSED_LOOP) {
    mismatches.push(`TT_PER_BUSINESS_CLOSED_LOOP=${report.TT_PER_BUSINESS_CLOSED_LOOP}`);
  }
  if ((report.summary?.fail ?? -1) !== expected.fail) mismatches.push(`fail=${report.summary?.fail}`);
  if ((report.summary?.pass ?? -1) !== expected.pass) mismatches.push(`pass=${report.summary?.pass}`);
  if ((report.summary?.pass_expected_difference ?? -1) !== expected.pass_expected_difference) {
    mismatches.push(`expected_diff=${report.summary?.pass_expected_difference}`);
  }
  if (mismatches.length) {
    console.error('PER P0-1 sign-off blocked:', mismatches.join(', '));
    process.exit(1);
  }

  const attestation =
    'Sebastian Ward · Solo maintainer · PER P0-1 Business Closed Loop · ② Staging probe PASS · ' +
    'FAIL=0 · P0_PASS=15 · EXPECTED_DIFF=2 · not ③ Production GO';

  report.owner_sign_off = {
    status: 'SIGNED',
    attestation,
    signed_at_utc: signedAt,
    signer: 'Sebastian Ward',
    phase: 'Production Preparation · PER Item 1',
    prerequisite_for: 'PER P0-2 Recovery Verified',
  };

  for (const row of report.p0_verification || []) {
    row.owner_sign_off = {
      ...(row.owner_sign_off || {}),
      status: 'SIGNED',
      signed_at_utc: signedAt,
      attestation,
    };
  }

  report.TT_PER_P0_1_OWNER_SIGNOFF = 'SIGNED';

  const stampDir = path.join(EVID_ROOT, stamp);
  fs.mkdirSync(stampDir, { recursive: true });
  const stampFile = path.join(stampDir, 'PER-BUSINESS-CLOSED-LOOP-P0.json');
  fs.writeFileSync(stampFile, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(LATEST, JSON.stringify(report, null, 2) + '\n');

  const md = `# PER P0-1 · Business Closed Loop · Owner Sign-off

**UTC signed:** ${signedAt}  
**Phase:** ② Staging · Production Preparation · PER Item 1  
**Evidence stamp:** \`${stamp}\`

## 机读结论

| 键 | 值 |
|----|-----|
| \`TT_PER_BUSINESS_CLOSED_LOOP\` | **PASS** |
| P0 PASS | **15** |
| EXPECTED_DIFF | **2** |
| FAIL | **0** |
| \`TT_PER_P0_1_OWNER_SIGNOFF\` | **SIGNED** |

## Owner attestation

${attestation}

## 诚实边界

① 本地 **≠** ② Staging 探针 **≠** ③ Production GO · PER 五项未完成

## 工件

- \`evidence/GO_production_preparation/per-business-closed-loop/${stamp}/PER-BUSINESS-CLOSED-LOOP-P0.json\`
- \`evidence/GO_production_preparation/per-business-closed-loop/PER-BUSINESS-CLOSED-LOOP-P0-LATEST.json\`

**TT_PER_P0_1_OWNER_SIGNOFF: SIGNED**
`;
  fs.writeFileSync(path.join(stampDir, 'PER-BUSINESS-CLOSED-LOOP-P0-OWNER-SIGNOFF.md'), md);
  fs.writeFileSync(path.join(EVID_ROOT, 'PER-BUSINESS-CLOSED-LOOP-P0-OWNER-SIGNOFF-LATEST.md'), md);

  console.log('TT_PER_P0_1_OWNER_SIGNOFF: SIGNED');
  console.log(`signed_at_utc=${signedAt}`);
  console.log(`evidence=${stampDir.replace(/\\/g, '/')}`);
}

main();
