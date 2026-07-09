#!/usr/bin/env node
/**
 * Hotel P1 Discovery · 收尾 orchestrator
 * 1. Ownership Boundary Review
 * 2. Brief + Matrix Evidence
 * 3. Master Registry refresh
 *
 * 不进入 WP0 / Admin / API / Runtime / Frontend / Upload
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const OUT_JSON = path.join(EVIDENCE, 'CMS-HOTEL-DISCOVERY-COMPLETE-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-HOTEL-DISCOVERY-COMPLETE-LATEST.md');

function run(script) {
  execSync(`node scripts/dev/${script}`, { cwd: ROOT, stdio: 'inherit' });
}

function readJson(name) {
  const p = path.join(EVIDENCE, name);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const stamp = new Date().toISOString();

  run('run-cms-hotel-ownership-boundary-review.cjs');
  run('run-cms-hotel-design-ssot.cjs');
  run('run-cms-master-registry.cjs');

  const boundary = readJson('CMS-HOTEL-OWNERSHIP-BOUNDARY-REVIEW-LATEST.json');
  const brief = readJson('CMS-HOTEL-BRIEF-LATEST.json');
  const matrix = readJson('CMS-HOTEL-MATRIX-LATEST.json');
  const registry = readJson('CMS-MASTER-REGISTRY-LATEST.json');

  const allPass =
    boundary.TT_CMS_HOTEL_OWNERSHIP_BOUNDARY_REVIEW === 'PASS' &&
    brief.TT_CMS_HOTEL_BRIEF === 'DESIGN_SSOT' &&
    matrix.TT_CMS_HOTEL_MATRIX === 'SCOPE_LOCKED';

  const doc = {
    schema: 'traveltrust.cms_hotel_discovery_complete.v1',
    recorded_at_utc: stamp,
    phase: 'DISCOVERY_COMPLETE',
    TT_CMS_HOTEL_DISCOVERY: allPass ? 'COMPLETE' : 'INCOMPLETE',
    deliverables: {
      ownership_boundary_review: {
        path: 'CMS-HOTEL-OWNERSHIP-BOUNDARY-REVIEW-LATEST.json',
        verdict: boundary.TT_CMS_HOTEL_OWNERSHIP_BOUNDARY_REVIEW,
      },
      brief: {
        ssot: 'data/catalog/hotel-brief.v1.yaml',
        evidence: 'CMS-HOTEL-BRIEF-LATEST.json',
        verdict: brief.TT_CMS_HOTEL_BRIEF,
      },
      asset_matrix: {
        ssot: 'data/catalog/hotel-matrix.v1.yaml',
        evidence: 'CMS-HOTEL-MATRIX-LATEST.json',
        verdict: matrix.TT_CMS_HOTEL_MATRIX,
        rows: matrix.total_rows,
      },
    },
    future_extensibility: boundary.future_extensibility?.answer,
    registry_hotel_next: registry.modules?.find((m) => m.id === 'hotel')?.next,
    explicitly_not_started: [
      'wp0_migration',
      'admin',
      'api',
      'runtime',
      'frontend',
      'upload_assets',
      'catalog_publish_ops',
    ],
    next_step: '等待实现决策 · 与 City Hero 相同：先冻结设计，再决定是否投入开发',
    scripts: {
      discovery: 'scripts/dev/run-cms-hotel-discovery.cjs',
      boundary: 'scripts/dev/run-cms-hotel-ownership-boundary-review.cjs',
      design_ssot: 'scripts/dev/run-cms-hotel-design-ssot.cjs',
      registry: 'scripts/dev/run-cms-master-registry.cjs',
    },
  };

  const md = [
    '# Hotel P1 Discovery · Complete',
    '',
    '| | |',
    '|---|---|',
    `| **Date** | ${stamp.slice(0, 10)} |`,
    `| **Verdict** | **${doc.TT_CMS_HOTEL_DISCOVERY}** |`,
    '| **Registry** | Hotel → Discovery Complete · 等待实现决策 |',
    '',
    '## 交付物',
    '',
    '| # | 交付物 | SSOT / Evidence | 结论 |',
    '|---|--------|-----------------|------|',
    '| 1 | Ownership Boundary Review | `CMS-HOTEL-OWNERSHIP-BOUNDARY-REVIEW-LATEST.*` | PASS |',
    '| 2 | Hotel Brief | `data/catalog/hotel-brief.v1.yaml` | DESIGN_SSOT |',
    '| 3 | Asset Matrix | `data/catalog/hotel-matrix.v1.yaml` | SCOPE_LOCKED (3 rows) |',
    '',
    '## Future Extensibility',
    '',
    `> ${boundary.future_extensibility?.question}`,
    '',
    `**${boundary.future_extensibility?.answer}**`,
    '',
    '## 明确未开始',
    '',
    ...doc.explicitly_not_started.map((x) => `- ${x}`),
    '',
    '## 重新生成',
    '',
    '```bash',
    'node scripts/dev/run-cms-hotel-discovery.cjs',
    '```',
  ].join('\n');

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log(`\nTT_CMS_HOTEL_DISCOVERY: ${doc.TT_CMS_HOTEL_DISCOVERY}`);
  console.log(`Evidence: ${OUT_JSON}`);
  if (!allPass) process.exit(1);
}

main();
