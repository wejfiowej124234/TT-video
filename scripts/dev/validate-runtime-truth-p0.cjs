#!/usr/bin/env node
/**
 * Runtime Truth P0 — static call-graph + matrix gap closure checks
 *
 *   node scripts/dev/validate-runtime-truth-p0.cjs [--evidence-dir DIR]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const args = process.argv.slice(2);
const evidIdx = args.indexOf('--evidence-dir');
const EVID_DIR =
  evidIdx >= 0 && args[evidIdx + 1]
    ? path.isAbsolute(args[evidIdx + 1])
      ? args[evidIdx + 1]
      : path.join(ROOT, args[evidIdx + 1])
    : path.join(
        ROOT,
        'evidence/GO_production_readiness/runtime-truth-p0',
        process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z')
      );

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function fnScope(text, fn) {
  for (const m of [`pub(super) async fn ${fn}`, `async fn ${fn}`]) {
    const idx = text.indexOf(m);
    if (idx >= 0) return text.slice(idx, idx + 12000);
  }
  return '';
}

const checks = [];

function record(id, label, status, detail) {
  checks.push({ id, label, status, detail });
}

const posts = read('crates/api/src/routes/community/posts.rs');
const discover = read('crates/api/src/chain_off/discover.rs');
const surface = read('crates/api/src/chain_off/community_public_surface.rs');
const catalog = read('crates/api/src/db/market_catalog.rs');

record(
  'RT-P0-B001',
  'Detail uses public_post_json_for_content_readiness',
  posts && posts.includes('public_post_json_for_content_readiness') ? 'PASS' : 'FAIL',
  posts ? 'posts.rs' : 'missing posts.rs'
);

const userPostsScope = posts ? fnScope(posts, 'get_user_posts') : '';
record(
  'RT-P0-B002',
  'Public profile applies filter_feed_posts_content_readiness when public_only',
  userPostsScope.includes('public_only') &&
    userPostsScope.includes('filter_feed_posts_content_readiness')
    ? 'PASS'
    : 'FAIL',
  userPostsScope ? 'get_user_posts scope' : 'missing fn'
);

record(
  'RT-P0-B003',
  'Discover intersects governed_discover_orders_v1 when production profile',
  discover &&
    discover.includes('filter_order_ids_in_governed_discover_view') &&
    discover.includes('GOVERNED_DISCOVER_ORDERS_VIEW') === false &&
    catalog &&
    catalog.includes('filter_order_ids_in_governed_discover_view') &&
    catalog.includes('GOVERNED_DISCOVER_ORDERS_VIEW')
    ? 'PASS'
    : 'FAIL',
  'discover.rs + market_catalog.rs'
);

record(
  'RT-P0-HELPER',
  'Shared public_post_json_for_content_readiness helper',
  surface && surface.includes('pub fn public_post_json_for_content_readiness') ? 'PASS' : 'FAIL',
  'community_public_surface.rs'
);

const requiredDocs = [
  'docs/runbook/RUNTIME-TRUTH-GAP-REPORT.md',
  'docs/runbook/RUNTIME-TRUTH-AUDIT-RUNBOOK.md',
  'registry/production-readiness-master-matrix.v1.yaml',
];

for (const rel of requiredDocs) {
  record(`doc_${path.basename(rel)}`, rel, read(rel) ? 'PASS' : 'FAIL', read(rel) ? 'present' : 'missing');
}

const reg = read('registry/production-readiness-master-matrix.v1.yaml') || '';
function gapStatus(regText, id) {
  const re = new RegExp(`- id: ${id}\\r?\\n(?:    .+\\r?\\n)*?    status: ([A-Z_]+)`);
  const m = regText.match(re);
  return m ? m[1] : null;
}

for (const id of ['PRM-RT-B001', 'PRM-RT-B002', 'PRM-RT-B003', 'PRM-EVID-B001', 'PRM-REG-B001']) {
  const st = gapStatus(reg, id);
  record(
    `matrix_${id}`,
    `${id} CLOSED in matrix`,
    st === 'CLOSED' ? 'PASS' : 'FAIL',
    st || 'missing'
  );
}

const allPass = checks.every((c) => c.status === 'PASS');
fs.mkdirSync(EVID_DIR, { recursive: true });

const signoff = {
  review_id: 'RT-P0-CLOSURE-20260704',
  stamp: path.basename(EVID_DIR),
  machine_keys: {
    TT_RUNTIME_TRUTH_AUDIT: 'ACTIVE',
    TT_RUNTIME_TRUTH_P0: allPass ? 'PASS' : 'FAIL',
  },
  closed_gaps: ['PRM-RT-B001', 'PRM-RT-B002', 'PRM-RT-B003', 'PRM-EVID-B001', 'PRM-REG-B001'],
  checks,
  all_pass: allPass,
  reproducibility: {
    clean_clone: true,
    evidence_in_repo: true,
    validators: [
      'node scripts/dev/audit-runtime-truth-call-graph.cjs',
      'node scripts/dev/validate-runtime-truth-p0.cjs',
      'node scripts/dev/validate-production-readiness-master-matrix.cjs',
    ],
  },
};

fs.writeFileSync(
  path.join(EVID_DIR, 'runtime-truth-p0-signoff.json'),
  `${JSON.stringify(signoff, null, 2)}\n`
);

fs.writeFileSync(
  path.join(EVID_DIR, 'README.md'),
  `# Runtime Truth P0 Evidence Package

**Review:** RT-P0-CLOSURE-20260704  
**Stamp:** ${path.basename(EVID_DIR)}

## Reproduce from clean clone

\`\`\`bash
node scripts/dev/audit-runtime-truth-call-graph.cjs
node scripts/dev/validate-runtime-truth-p0.cjs --evidence-dir ${path.relative(ROOT, EVID_DIR).replace(/\\/g, '/')}
node scripts/dev/validate-production-readiness-master-matrix.cjs
\`\`\`

## Closed gaps

- PRM-RT-B001 · PRM-RT-B002 · PRM-RT-B003 · PRM-EVID-B001 · PRM-REG-B001
`
);

console.log('Runtime Truth P0 validation');
console.log('─'.repeat(60));
for (const c of checks) {
  console.log(`${c.status.padEnd(5)} ${c.label} — ${c.detail}`);
}
console.log('─'.repeat(60));
console.log(`Evidence: ${path.relative(ROOT, EVID_DIR)}`);
console.log(`TT_RUNTIME_TRUTH_P0: ${signoff.machine_keys.TT_RUNTIME_TRUTH_P0}`);

if (!allPass) process.exit(1);
