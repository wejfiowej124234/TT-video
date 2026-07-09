#!/usr/bin/env node
/**
 * PER · Decision Review pack (five items signed · no scope expansion).
 *
 *   node scripts/dev/run-per-decision-review-pack.cjs
 */
const fs = require('fs');
const path = require('path');
const { EVID_PREP, ITEMS, arg, loadItem } = require('./lib/per-production-prep-shared.cjs');

const ORDER = ['p0-1', 'p0-2', 'p0-3', 'p0-4', 'p0-5'];

function main() {
  const stamp =
    arg(process.argv, '--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const signedAt = arg(process.argv, '--signed-at') || new Date().toISOString();

  const items = [];
  const blockers = [];

  for (const id of ORDER) {
    const loaded = loadItem(id);
    if (!loaded) {
      blockers.push(`${id}: LATEST missing`);
      continue;
    }
    const { meta, report } = loaded;
    const pass = report[meta.passKey] === 'PASS';
    const signed = report.owner_sign_off?.status === 'SIGNED';
    if (!pass) blockers.push(`${id}: not PASS`);
    if (!signed) blockers.push(`${id}: owner not SIGNED`);
    items.push({
      id,
      title: meta.title,
      pass_key: meta.passKey,
      pass,
      owner_sign_off: report.owner_sign_off?.status,
      signed_at_utc: report.owner_sign_off?.signed_at_utc || null,
      stamp_utc: report[meta.stampKey],
      evidence_latest: `evidence/GO_production_preparation/${meta.dir}/${meta.latest.split('/').pop()}`,
      summary: report.summary || null,
    });
  }

  const ready = blockers.length === 0;
  const attestation =
    'Sebastian Ward · Solo maintainer · PER Production Preparation five-item track complete · ' +
    'Decision Review ready · ② Staging evidence · not ③ Production GO · CMS Operation resumes Priority 2';

  const report = {
    schema: 'traveltrust.per_decision_review_pack.v1',
    stamp_utc: stamp,
    phase: 'Production Preparation · PER Decision Review',
    per_track_frozen_order: [
      'business_closed_loop',
      'recovery',
      'rollback',
      'monitoring',
      'production_configuration',
    ],
    items,
    blockers,
    owner_sign_off: {
      status: ready ? 'SIGNED' : 'BLOCKED',
      attestation,
      signed_at_utc: ready ? signedAt : null,
      signer: 'Sebastian Ward',
    },
    TT_PER_PRODUCTION_PREPARATION: ready ? 'COMPLETE' : 'INCOMPLETE',
    TT_PER_DECISION_REVIEW: ready ? 'READY' : 'BLOCKED',
    next_priority: ready ? 'CMS Operation Wave 1 (JP)' : null,
    honest_boundary:
      'PER COMPLETE = five frozen items signed on ② staging · ≠ Production GO · CMS parallel track resumes',
  };

  const outDir = path.join(EVID_PREP, 'per-decision-review', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'PER-DECISION-REVIEW-PACK.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    path.join(EVID_PREP, 'per-decision-review/PER-DECISION-REVIEW-PACK-LATEST.json'),
    JSON.stringify(report, null, 2) + '\n',
  );

  const md = `# PER · Decision Review Pack

**UTC:** ${signedAt}  
**Stamp:** \`${stamp}\`

## Five-item track

| # | Item | Pass | Signed |
|---|------|------|--------|
${items.map((i) => `| ${i.id} | ${i.title} | ${i.pass ? 'PASS' : 'FAIL'} | ${i.owner_sign_off} |`).join('\n')}

## Machine keys

| Key | Value |
|-----|-------|
| \`TT_PER_PRODUCTION_PREPARATION\` | **${report.TT_PER_PRODUCTION_PREPARATION}** |
| \`TT_PER_DECISION_REVIEW\` | **${report.TT_PER_DECISION_REVIEW}** |

## Next priority

**CMS Operation · Wave 1 (JP)** — PER Priority 1 complete; do not expand PER scope.

**${report.TT_PER_DECISION_REVIEW === 'READY' ? 'TT_PER_DECISION_REVIEW: READY' : 'TT_PER_DECISION_REVIEW: BLOCKED'}**
`;
  fs.writeFileSync(path.join(outDir, 'PER-DECISION-REVIEW-PACK.md'), md);
  fs.writeFileSync(path.join(EVID_PREP, 'per-decision-review/PER-DECISION-REVIEW-PACK-LATEST.md'), md);

  console.log(`TT_PER_PRODUCTION_PREPARATION: ${report.TT_PER_PRODUCTION_PREPARATION}`);
  console.log(`TT_PER_DECISION_REVIEW: ${report.TT_PER_DECISION_REVIEW}`);
  console.log(`TT_PER_EVIDENCE: evidence/GO_production_preparation/per-decision-review/${stamp}`);
  if (!ready) {
    for (const b of blockers) console.log(`TT_PER_BLOCKER: ${b}`);
    process.exit(1);
  }
}

main();
