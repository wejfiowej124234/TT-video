#!/usr/bin/env node
/**
 * Runtime Truth Audit — static call-graph anchors (layer 2)
 *
 *   node scripts/dev/audit-runtime-truth-call-graph.cjs
 */
const path = require('path');
const { runCallGraphAudit } = require('./lib/runtime-truth-call-graph.cjs');

const audit = runCallGraphAudit({ anchorFilter: 'all' });

console.log('Runtime Truth Call Graph Audit');
console.log('─'.repeat(60));
for (const r of audit.results) {
  console.log(`${r.status.padEnd(5)} ${r.id} — ${r.detail}`);
}
console.log('─'.repeat(60));
console.log(`Unexpected failures: ${audit.anchors_fail}`);
console.log('Report: docs/runbook/RUNTIME-TRUTH-GAP-REPORT.md');

process.exit(audit.pass ? 0 : 1);
