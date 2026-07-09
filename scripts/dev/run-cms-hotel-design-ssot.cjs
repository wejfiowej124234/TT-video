#!/usr/bin/env node
/**
 * Hotel Design SSOT · Brief + Asset Matrix evidence
 * 只读验证 YAML · 生成 Evidence · 不碰 Admin/API/Runtime/Frontend
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const BRIEF = path.join(ROOT, 'data/catalog/hotel-brief.v1.yaml');
const MATRIX = path.join(ROOT, 'data/catalog/hotel-matrix.v1.yaml');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const OUT_BRIEF_JSON = path.join(EVIDENCE, 'CMS-HOTEL-BRIEF-LATEST.json');
const OUT_BRIEF_MD = path.join(EVIDENCE, 'CMS-HOTEL-BRIEF-LATEST.md');
const OUT_MATRIX_JSON = path.join(EVIDENCE, 'CMS-HOTEL-MATRIX-LATEST.json');
const OUT_MATRIX_MD = path.join(EVIDENCE, 'CMS-HOTEL-MATRIX-LATEST.md');

const EXPECTED_TIERS = ['tier_economy', 'tier_comfort', 'tier_luxury'];

function parseMatrixRows(text) {
  const blocks = text.split(/\n  - matrix_id: /).slice(1);
  return blocks.map((block) => {
    const matrix_id = block.match(/^HT-TIER-[^\n]+/)?.[0];
    const get = (k) => block.match(new RegExp(`\\n    ${k}: (.+)`))?.[1]?.trim()?.replace(/^"|"$/g, '');
    return {
      matrix_id,
      tier_code: get('tier_code'),
      display_en: get('display_en'),
      sort_order: Number(get('sort_order')),
      multiplier: Number(get('multiplier')),
      submit_label_zh: get('submit_label_zh'),
      stock_pool_key: get('stock_pool_key'),
      consumer: get('consumer'),
      asset_lifecycle: get('asset_lifecycle'),
      matrix_row_status: get('matrix_row_status'),
      pilot_wave: get('pilot_wave'),
    };
  });
}

function validate(rows) {
  const errors = [];
  if (rows.length !== 3) errors.push(`expected 3 rows, got ${rows.length}`);
  const codes = rows.map((r) => r.tier_code);
  for (const t of EXPECTED_TIERS) {
    if (!codes.includes(t)) errors.push(`missing tier_code ${t}`);
  }
  if (new Set(codes).size !== codes.length) errors.push('duplicate tier_code');
  const comfort = rows.find((r) => r.tier_code === 'tier_comfort');
  if (comfort?.pilot_wave !== 'WAVE_1') errors.push('tier_comfort must be WAVE_1 pilot');
  for (const r of rows) {
    if (r.asset_lifecycle !== 'draft') errors.push(`${r.matrix_id} must be draft at discovery`);
    if (r.matrix_row_status !== 'pending') errors.push(`${r.matrix_id} must be pending at discovery`);
    if (r.stock_pool_key !== r.tier_code) errors.push(`${r.matrix_id} stock_pool_key must equal tier_code`);
  }
  return errors;
}

function formatBriefMd(rows) {
  return [
    '# Hotel · Content Brief（Design SSOT）',
    '',
    '| | |',
    '|---|---|',
    '| **Version** | v1 |',
    '| **Status** | DESIGN_SSOT |',
    '| **Phase** | DISCOVERY_COMPLETE |',
    '| **Matrix** | `data/catalog/hotel-matrix.v1.yaml` |',
    '| **Tiers** | 3 · 全球 |',
    '| **asset_kind** | `hotel_tier_stock` (FROZEN) |',
    '',
    '---',
    '',
    '## 1 · 模块目标（Why）',
    '',
    '> **Hotel 为 Market / 行程预算提供全球一致的 3 档 tier 库存图与展示元数据，由 CMS 独立发布；不承载 listing、不定价、不写订单。**',
    '',
    '**不是：** City Hero · POI Hero · Listings · per-city 酒店库存',
    '',
    '---',
    '',
    '## 2 · Asset Matrix（3 Tier · SCOPE_LOCKED）',
    '',
    '| Tier | tier_code | multiplier | submit_label_zh | pilot |',
    '|------|-----------|------------|-----------------|-------|',
    ...rows.map(
      (r) =>
        `| ${r.display_en} | \`${r.tier_code}\` | ${r.multiplier} | ${r.submit_label_zh} | ${r.pilot_wave || '—'} |`,
    ),
    '',
    '**Pilot：** Wave 1 = Comfort · Wave 2 = Economy · Wave 3 = Luxury',
    '',
    '---',
    '',
    '## 3 · 数据来源 · 双读',
    '',
    '| 读面 | Endpoint |',
    '|------|----------|',
    '| **Primary** | `GET /api/v1/catalog/hotel-tiers` → `stock_image_url` |',
    '| **Secondary** | `GET /api/v1/catalog/media?asset_kind=hotel_tier_stock` |',
    '',
    '**定价边界：** `hotel_base_per_night_cents`（Pricing API）× `multiplier`（CMS tier）',
    '',
    '---',
    '',
    '## 4 · Consumer',
    '',
    '| 页面 | 使用 Hotel Tier |',
    '|------|-----------------|',
    '| Market | ✅ CustomItineraryModal |',
    '| Escrow / Orders | ✅ 只读展示 |',
    '| Home / Travel / Guide | ❌ |',
    '',
    '---',
    '',
    '## 5 · 生命周期',
    '',
    '```',
    'Draft → Review → Publish → Catalog → Runtime → Consumer → Verify → Evidence → Frozen',
    '```',
    '',
    '---',
    '',
    '## Discovery 完成 · 实现前禁止',
    '',
    'WP0 · Admin · API · Runtime · Frontend · Upload — **等待实现决策**',
    '',
    '```bash',
    'node scripts/dev/run-cms-hotel-design-ssot.cjs',
    '```',
  ].join('\n');
}

function formatMatrixMd(rows, errors) {
  return [
    '# Hotel · Asset Matrix（SCOPE_LOCKED）',
    '',
    '| | |',
    '|---|---|',
    '| **Status** | SCOPE_LOCKED |',
    '| **Rows** | 3 |',
    '| **Geography** | Global |',
    `| **Validation** | ${errors.length === 0 ? 'PASS' : 'FAIL'} |`,
    '',
    '## Rows',
    '',
    '| matrix_id | tier_code | lifecycle | status | pilot |',
    '|-----------|-----------|-----------|--------|-------|',
    ...rows.map(
      (r) =>
        `| ${r.matrix_id} | ${r.tier_code} | ${r.asset_lifecycle} | ${r.matrix_row_status} | ${r.pilot_wave || '—'} |`,
    ),
    '',
    errors.length ? `**Errors:** ${errors.join('; ')}` : '**All validation checks passed.**',
    '',
    '```bash',
    'node scripts/dev/run-cms-hotel-design-ssot.cjs',
    '```',
  ].join('\n');
}

function main() {
  const stamp = new Date().toISOString();
  if (!fs.existsSync(BRIEF) || !fs.existsSync(MATRIX)) {
    console.error('Missing hotel-brief.v1.yaml or hotel-matrix.v1.yaml');
    process.exit(1);
  }

  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const rows = parseMatrixRows(matrixText);
  const errors = validate(rows);
  const ok = errors.length === 0;

  const briefDoc = {
    schema: 'traveltrust.cms_hotel_brief_evidence.v1',
    recorded_at_utc: stamp,
    phase: 'DISCOVERY_COMPLETE',
    TT_CMS_HOTEL_BRIEF: ok ? 'DESIGN_SSOT' : 'VALIDATION_FAIL',
    TT_CMS_HOTEL_MATRIX: ok ? 'SCOPE_LOCKED' : 'VALIDATION_FAIL',
    goal_one_liner:
      'Hotel 为 Market / 行程预算提供全球一致的 3 档 tier 库存图与展示元数据，由 CMS 独立发布；不承载 listing、不定价、不写订单。',
    brief_ssot: 'data/catalog/hotel-brief.v1.yaml',
    matrix_ssot: 'data/catalog/hotel-matrix.v1.yaml',
    asset_kind: 'hotel_tier_stock',
    stats: {
      tiers: rows.length,
      geography: 'global',
      matrix_pass: 0,
      asset_lifecycle_draft: rows.filter((r) => r.asset_lifecycle === 'draft').length,
      pilot_wave_1: 'HT-TIER-COMFORT-001',
      pilot_wave_2: 'HT-TIER-ECONOMY-001',
      pilot_wave_3: 'HT-TIER-LUXURY-001',
    },
    dual_read: {
      primary: 'GET /api/v1/catalog/hotel-tiers',
      secondary: 'GET /api/v1/catalog/media?asset_kind=hotel_tier_stock',
    },
    consumer_pages: {
      Market: true,
      Escrow: true,
      Home: false,
      Travel: false,
      Guide: false,
    },
    validation_errors: errors,
    rows,
    forbidden_until_implementation: [
      'wp0_migration',
      'admin_ui',
      'api',
      'runtime',
      'frontend',
      'upload',
      'catalog_publish_ops',
    ],
  };

  const matrixDoc = {
    schema: 'traveltrust.cms_hotel_matrix_evidence.v1',
    recorded_at_utc: stamp,
    phase: 'DISCOVERY_COMPLETE',
    TT_CMS_HOTEL_MATRIX: ok ? 'SCOPE_LOCKED' : 'VALIDATION_FAIL',
    brief_ssot: 'data/catalog/hotel-brief.v1.yaml',
    matrix_ssot: 'data/catalog/hotel-matrix.v1.yaml',
    scope_locked: true,
    total_rows: rows.length,
    validation_errors: errors,
    rows,
    pilot_discipline: briefDoc.stats,
  };

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(OUT_BRIEF_JSON, JSON.stringify(briefDoc, null, 2) + '\n');
  fs.writeFileSync(OUT_BRIEF_MD, formatBriefMd(rows) + '\n');
  fs.writeFileSync(OUT_MATRIX_JSON, JSON.stringify(matrixDoc, null, 2) + '\n');
  fs.writeFileSync(OUT_MATRIX_MD, formatMatrixMd(rows, errors) + '\n');

  console.log(`TT_CMS_HOTEL_BRIEF: ${briefDoc.TT_CMS_HOTEL_BRIEF}`);
  console.log(`TT_CMS_HOTEL_MATRIX: ${briefDoc.TT_CMS_HOTEL_MATRIX} (${rows.length} rows)`);
  if (errors.length) {
    console.error('Validation errors:', errors.join('; '));
    process.exit(1);
  }
  console.log(`Evidence: ${OUT_BRIEF_JSON}`);
}

main();
