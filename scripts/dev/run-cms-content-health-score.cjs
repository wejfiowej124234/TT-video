#!/usr/bin/env node
/**
 * CMS Content Health Score · passthrough from CMS Asset Matrix pack (SSOT).
 *
 * Run Asset Matrix pack first:
 *   node scripts/dev/run-cms-asset-matrix-pack.cjs
 *   node scripts/dev/run-cms-content-health-score.cjs
 *
 * Or both:
 *   node scripts/dev/run-cms-ops-refresh.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const ASSET_MATRIX_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-ASSET-MATRIX-LATEST.json');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_content_l5/CMS-CONTENT-HEALTH-SCORE-LATEST.json');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function main() {
  const stamp =
    arg('--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  if (!fs.existsSync(ASSET_MATRIX_LATEST)) {
    console.error('ASSET_MATRIX_MISSING: run scripts/dev/run-cms-asset-matrix-pack.cjs first');
    process.exit(2);
  }

  let am;
  try {
    am = JSON.parse(fs.readFileSync(ASSET_MATRIX_LATEST, 'utf8'));
  } catch (e) {
    console.error(`ASSET_MATRIX_PARSE_ERROR: ${e.message}`);
    process.exit(2);
  }

  const sourceAlignment = am.source_alignment || am.summary?.source_alignment;
  const contentHealthScore = am.content_health_score || am.operations_kpi?.content_health_score;
  if (!sourceAlignment || !contentHealthScore) {
    console.error('ASSET_MATRIX_INCOMPLETE: missing source_alignment or content_health_score');
    process.exit(2);
  }

  const report = {
    schema: 'traveltrust.cms_content_health_score.v3',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    ssot: 'evidence/GO_cms_operation/CMS-ASSET-MATRIX-LATEST.json',
    ssot_stamp_utc: am.stamp_utc,
    passthrough: true,
    operations_kpi: {
      source_alignment: sourceAlignment,
      content_health_score: contentHealthScore,
    },
    source_alignment: sourceAlignment,
    content_health_score: contentHealthScore,
    destination_ambient: am.destination_ambient || null,
    daily_ops_board: am.daily_ops_board || null,
    daily_report: am.daily_report || am.daily_ops_board?.daily_report || null,
    ssot_hierarchy: am.ssot_hierarchy || null,
    operational_pipeline: am.operational_pipeline || null,
    cms_operation: am.cms_operation || null,
    operator_table: am.operator_table || null,
    TT_CMS_SOURCE_ALIGNMENT: sourceAlignment.display,
    TT_CMS_SOURCE_ALIGNMENT_PCT: sourceAlignment.pct,
    TT_CMS_CONTENT_HEALTH_SCORE: contentHealthScore.label,
    TT_CMS_CONTENT_HEALTH_STATUS: contentHealthScore.status,
    TT_CMS_DESTINATION_AMBIENT_LIVE: am.destination_ambient?.display || null,
    TT_CMS_DAILY_NEW_LIVE: am.daily_ops_board?.daily_questions?.new_live_assets_today ?? null,
    TT_CMS_VERIFY_FAILURES: am.daily_ops_board?.daily_questions?.verify_failure_count ?? null,
    TT_CMS_ROLLBACK_NEEDED: am.daily_ops_board?.daily_questions?.rollback_needed_count ?? null,
    TT_CMS_PIPELINE_PHASE: am.operational_pipeline?.active_phase?.id || am.TT_CMS_PIPELINE_PHASE || null,
    honest_boundary:
      'Health Score = passthrough from Asset Matrix SSOT · no independent KPI math · ≠ Production GO',
  };

  const outDir = path.join(ROOT, 'evidence/GO_cms_content_l5/health', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'CMS-CONTENT-HEALTH-SCORE.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_LATEST, JSON.stringify(report, null, 2) + '\n');

  console.log(`TT_CMS_SOURCE_ALIGNMENT: ${sourceAlignment.display} (${sourceAlignment.pct}%)`);
  console.log(`TT_CMS_CONTENT_HEALTH_SCORE: ${contentHealthScore.label}`);
  console.log(`TT_CMS_CONTENT_HEALTH_STATUS: ${contentHealthScore.status}`);
  if (am.destination_ambient?.display) {
    console.log(`TT_CMS_DESTINATION_AMBIENT_LIVE: ${am.destination_ambient.display}`);
  }
  if (am.daily_ops_board?.daily_questions) {
    const q = am.daily_ops_board.daily_questions;
    console.log(`TT_CMS_DAILY_NEW_LIVE: ${q.new_live_assets_today}`);
    console.log(`TT_CMS_VERIFY_FAILURES: ${q.verify_failure_count}`);
    console.log(`TT_CMS_ROLLBACK_NEEDED: ${q.rollback_needed_count}`);
  }
  if (am.operational_pipeline?.active_phase?.id) {
    console.log(`TT_CMS_PIPELINE_PHASE: ${am.operational_pipeline.active_phase.id}`);
  }
  console.log(`TT_CMS_HEALTH_SSOT: evidence/GO_cms_operation/CMS-ASSET-MATRIX-LATEST.json`);
  console.log(`TT_CMS_EVIDENCE: evidence/GO_cms_content_l5/health/${stamp}`);
  process.exit(0);
}

main();
