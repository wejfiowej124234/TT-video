#!/usr/bin/env node
/**
 * POI City Content QA Closure · JP · 京都（Osaka Golden Template 同源）
 */
const fs = require('fs');
const path = require('path');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');
const { buildJapanContentQa } = require('./lib/cms-japan-content-qa.cjs');

const ROOT = path.join(__dirname, '../..');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-KYOTO-CONTENT-QA-CLOSURE-LATEST.json');
const EXEC_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-KYOTO-CLOSURE-LATEST.json');

const KYOTO = getCityPilot('京都');
const NOW = new Date().toISOString();

function assessLockedAssets() {
  const rows = [];
  const issues = [];
  for (const matrixId of KYOTO.matrix_ids) {
    const asset = getAsset(matrixId);
    const poi = KYOTO.pois[KYOTO.matrix_ids.indexOf(matrixId)];
    const qa = asset.content_qa || {};
    const dims = ['cms_ownership', 'runtime_consumer', 'geo_matching', 'content_accuracy', 'l5_quality'];
    const dimOk = dims.every((d) => qa[d]?.verdict === 'PASS');
    rows.push({
      matrix_id: matrixId,
      poi,
      state: asset.state,
      replace_count: asset.replace_count,
      hero_file: asset.hero_file,
      locked_at_utc: asset.locked_at_utc,
      unlock_reason: asset.unlock_reason || null,
      dimensions_pass: dimOk,
    });
    if (asset.state !== 'LOCKED') issues.push(`${matrixId} ${poi}: not LOCKED`);
    if (asset.replace_count !== 1) issues.push(`${matrixId}: replace_count=${asset.replace_count}`);
    if (asset.unlock_reason) issues.push(`${matrixId}: unlock_reason set`);
    if (!dimOk) issues.push(`${matrixId}: dimension snapshot not all PASS`);
  }
  return { rows, issues, locked: rows.filter((r) => r.state === 'LOCKED').length };
}

function main() {
  const lock = assessLockedAssets();
  const report = buildJapanContentQa();
  const cityQa = report.cities.find((c) => c.city_zh === '京都');
  if (!cityQa) throw new Error('京都 city QA missing');

  const checks = {
    assets_locked_7_7: lock.locked === KYOTO.matrix_ids.length,
    no_open_backlog: cityQa.backlog_issue_count === 0,
    no_unlock: lock.rows.every((r) => !r.unlock_reason),
    per_asset_dimensions: lock.rows.every((r) => r.dimensions_pass),
    cross_region_open: cityQa.geo_matching.issue_count === 0,
    execution_was_closed: fs.existsSync(EXEC_CLOSURE),
    golden_template_source: 'evidence/GO_cms_operation/CMS-POI-CITY-OSAKA-CONTENT-QA-EXIT-CHECK-LATEST.json',
  };

  const issues = [...lock.issues];
  if (!checks.no_open_backlog) issues.push(`open backlog ${cityQa.backlog_issue_count}`);
  if (!checks.cross_region_open) issues.push('geo open issues remain');

  if (issues.length) {
    console.error('TT_CMS_POI_CITY_KYOTO_CONTENT_QA: NOT_CLOSED');
    for (const i of issues) console.error(' ', i);
    process.exit(1);
  }

  const closure = {
    schema: 'traveltrust.cms_poi_city_content_qa_closure.v1',
    recorded_at_utc: NOW,
    layer: 'CONTENT_QA',
    not_execution: true,
    city: { country_iso: 'JP', city_zh: '京都', city_en: 'Kyoto', poi_count: KYOTO.matrix_ids.length },
    execution_closure_ssot: 'evidence/GO_cms_operation/CMS-POI-CITY-KYOTO-CLOSURE-LATEST.json',
    content_qa_standard: 'evidence/GO_cms_operation/CMS-CONTENT-QA-STANDARD-FROZEN.v1.json',
    asset_lock_registry: 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json',
    replicated_from: 'Osaka Golden Template',
    cross_region_remediated: ['汤豆腐'],
    checks,
    locked_assets: lock.rows,
    city_qa_snapshot: {
      execution: cityQa.execution.verdict,
      cms_ownership: cityQa.cms_ownership.verdict,
      runtime_consumer: cityQa.runtime_consumer.verdict,
      geo_matching: cityQa.geo_matching.verdict,
      content_accuracy: cityQa.content_accuracy.verdict,
      l5_quality: cityQa.l5_quality.verdict,
      locked_count: cityQa.locked_count,
    },
    TT_CMS_POI_CITY_KYOTO_CONTENT_QA: 'CLOSED',
  };

  fs.mkdirSync(path.dirname(OUT_LATEST), { recursive: true });
  fs.writeFileSync(OUT_LATEST, JSON.stringify(closure, null, 2) + '\n');
  console.log('TT_CMS_POI_CITY_KYOTO_CONTENT_QA: CLOSED');
  console.log(`Assets LOCKED: ${lock.locked}/${KYOTO.matrix_ids.length}`);
  console.log(`Evidence: ${OUT_LATEST}`);
}

main();
