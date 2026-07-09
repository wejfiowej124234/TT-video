#!/usr/bin/env node
/**
 * CMS Infrastructure Freeze · 正式冻结 CMS 基础设施 · 仅执行内容至 100% L5
 *
 *   node scripts/dev/run-cms-infrastructure-freeze.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const {
  buildContentExecution,
  writeInfrastructureFreeze,
  writeContentExecutionLatest,
  formatFamilyExecutionConsole,
  formatTodaysTasksFamilyOnly,
} = require('./lib/cms-infrastructure-freeze.cjs');
const { buildCmsOpsHierarchy, writeHierarchyLatest } = require('./lib/cms-ops-hierarchy.cjs');

async function main() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const freeze = writeInfrastructureFreeze(stamp);
  const contentExec = buildContentExecution();
  const outDir = path.join(ROOT, 'evidence/GO_cms_operation/infrastructure-freeze', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'CMS-INFRASTRUCTURE-FREEZE.json'), JSON.stringify(freeze, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'CMS-CONTENT-EXECUTION.json'), JSON.stringify(contentExec, null, 2) + '\n');
  writeContentExecutionLatest(contentExec, stamp);

  const hierarchy = buildCmsOpsHierarchy();
  hierarchy.infrastructure_freeze = freeze;
  hierarchy.content_execution = {
    active_family: contentExec.active_family,
    content_families: contentExec.content_families.map((f) => ({
      id: f.id,
      label: f.label,
      content_pct: f.content_pct,
      execution_status: f.execution_status,
    })),
    pipeline_needs: contentExec.pipeline_needs,
  };
  writeHierarchyLatest(hierarchy, stamp);

  console.log(formatTodaysTasksFamilyOnly(contentExec));
  console.log('');
  console.log('─'.repeat(24));
  console.log('');
  console.log(formatFamilyExecutionConsole(contentExec));
  console.log('');
  console.log(`TT_CMS_INFRASTRUCTURE: ${freeze.TT_CMS_INFRASTRUCTURE}`);
  console.log(`TT_CMS_CONTENT_EXECUTION: ${contentExec.TT_CMS_CONTENT_EXECUTION}`);
  console.log(`TT_CMS_ACTIVE_FAMILY: ${contentExec.TT_CMS_ACTIVE_FAMILY}`);
  console.log(`TT_CMS_INFRASTRUCTURE_EVIDENCE: evidence/GO_cms_operation/CMS-INFRASTRUCTURE-FREEZE-LATEST.json`);
  console.log(`TT_CMS_CONTENT_EXECUTION_EVIDENCE: evidence/GO_cms_operation/CMS-CONTENT-EXECUTION-LATEST.json`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
