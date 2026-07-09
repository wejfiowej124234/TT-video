#!/usr/bin/env node
/**
 * CMS Ops Hierarchy Sync · unified 4-level ops tree (FINAL abstraction)
 *
 *   node scripts/dev/run-cms-ops-hierarchy-sync.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const {
  buildContentExecution,
  formatFamilyExecutionConsole,
  formatTodaysTasksFamilyOnly,
  writeContentExecutionLatest,
  writeInfrastructureFreeze,
} = require('./lib/cms-infrastructure-freeze.cjs');
const {
  buildCmsOpsHierarchy,
  writeHierarchyLatest,
  buildPoiCityOpsFromHierarchy,
} = require('./lib/cms-ops-hierarchy.cjs');
const { writeCityOpsLatest } = require('./lib/cms-poi-city-ops.cjs');

async function main() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  writeInfrastructureFreeze(stamp);
  const contentExec = buildContentExecution();
  writeContentExecutionLatest(contentExec, stamp);

  const hierarchy = buildCmsOpsHierarchy();
  hierarchy.infrastructure_freeze = { TT_CMS_INFRASTRUCTURE: 'FROZEN' };
  hierarchy.content_execution = contentExec;
  const outDir = path.join(ROOT, 'evidence/GO_cms_operation/ops-hierarchy', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'CMS-OPS-HIERARCHY.json'), JSON.stringify(hierarchy, null, 2) + '\n');
  writeHierarchyLatest(hierarchy, stamp);

  const poiCityOps = buildPoiCityOpsFromHierarchy(hierarchy);
  if (poiCityOps) writeCityOpsLatest({ ...poiCityOps, stamp_utc: stamp }, stamp);

  console.log(formatTodaysTasksFamilyOnly(contentExec));
  console.log('');
  console.log('─'.repeat(24));
  console.log('');
  console.log(formatFamilyExecutionConsole(contentExec));
  console.log('');
  if (hierarchy.active_focus) {
    console.log(`Active City: ${hierarchy.active_focus.country} · ${hierarchy.active_focus.city}`);
    console.log('');
  }
  console.log(`TT_CMS_INFRASTRUCTURE: FROZEN`);
  console.log(`TT_CMS_OPS_HIERARCHY: ${hierarchy.TT_CMS_OPS_HIERARCHY}`);
  console.log(`TT_CMS_ACTIVE_FAMILY: ${contentExec.TT_CMS_ACTIVE_FAMILY}`);
  console.log(`TT_CMS_ACCEPTANCE_UNIT: ${hierarchy.TT_CMS_ACCEPTANCE_UNIT}`);
  console.log(`TT_CMS_OPS_HIERARCHY_EVIDENCE: evidence/GO_cms_operation/CMS-OPS-HIERARCHY-LATEST.json`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
