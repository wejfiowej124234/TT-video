#!/usr/bin/env node
/**
 * City Hero Design SSOT · Brief + Asset Matrix evidence
 * 只写设计真源 · 不碰 Admin/API/Runtime/Frontend
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const BRIEF = path.join(ROOT, 'data/catalog/city-hero-brief.v1.yaml');
const MATRIX = path.join(ROOT, 'data/catalog/city-hero-matrix.v1.yaml');
const POI_MATRIX = path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const OUT_JSON = path.join(EVIDENCE, 'CMS-CITY-HERO-BRIEF-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-CITY-HERO-BRIEF-LATEST.md');

const CITY_EN = {
  东京: 'Tokyo',
  大阪: 'Osaka',
  京都: 'Kyoto',
  札幌: 'Sapporo',
  福冈: 'Fukuoka',
  首尔: 'Seoul',
  釜山: 'Busan',
  济州: 'Jeju',
  仁川: 'Incheon',
  曼谷: 'Bangkok',
  清迈: 'Chiang Mai',
  普吉: 'Phuket',
  新加坡: 'Singapore',
  巴黎: 'Paris',
  里昂: 'Lyon',
  尼斯: 'Nice',
  纽约: 'New York',
  洛杉矶: 'Los Angeles',
  旧金山: 'San Francisco',
  拉斯维加斯: 'Las Vegas',
  悉尼: 'Sydney',
  墨尔本: 'Melbourne',
  黄金海岸: 'Gold Coast',
  巴塞罗那: 'Barcelona',
  马德里: 'Madrid',
  塞维利亚: 'Seville',
  迪拜: 'Dubai',
  阿布扎比: 'Abu Dhabi',
  沙迦: 'Sharjah',
  北京: 'Beijing',
  上海: 'Shanghai',
  杭州: 'Hangzhou',
  西安: "Xi'an",
  成都: 'Chengdu',
  广州: 'Guangzhou',
  厦门: 'Xiamen',
  大理: 'Dali',
  青岛: 'Qingdao',
};

const FALLBACK_BY_ISO = {
  JP: 'hero_japan',
  KR: 'hero_korea',
  TH: 'hero_thailand',
  SG: 'hero_singapore',
  FR: 'hero_france',
  US: 'hero_usa',
  AU: 'hero_australia',
  ES: 'hero_spain',
  AE: 'hero_uae',
  CN: 'hero_china',
};

function citySlug(en) {
  return en
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\s+/g, '_');
}

function extractCitiesFromPoiMatrix() {
  const t = fs.readFileSync(POI_MATRIX, 'utf8');
  const rows = [...t.matchAll(/country_iso: (\w+)\n    country_zh: ([^\n]+)\n    city_zh: ([^\n]+)/g)];
  const seen = new Set();
  const cities = [];
  for (const m of rows) {
    const k = `${m[1]}|${m[3]}`;
    if (seen.has(k)) continue;
    seen.add(k);
    cities.push({ iso: m[1], country_zh: m[2], city_zh: m[3] });
  }
  cities.sort((a, b) => a.iso.localeCompare(b.iso) || a.city_zh.localeCompare(b.city_zh));
  return cities;
}

function buildMatrixRows(cities) {
  return cities.map((c, i) => {
    const cityEn = CITY_EN[c.city_zh] || c.city_zh;
    const slug = citySlug(cityEn);
    const assetKey = `city_hero_${slug}`;
    const fallback = FALLBACK_BY_ISO[c.iso];
    const isPilot = c.city_zh === '东京';
    return {
      matrix_id: `CH-${c.iso}-${slug.toUpperCase().replace(/_/g, '-').slice(0, 12)}-001`.replace(/--+/g, '-'),
      execution_order: i + 1,
      country_iso: c.iso,
      country_zh: c.country_zh,
      city_zh: c.city_zh,
      city_en: cityEn,
      asset_key: assetKey,
      asset_kind: 'city_hero',
      aspect_ratio: '16:9',
      fallback_key: fallback,
      fallback_ssot: `landing_ambient · country_iso=${c.iso}`,
      consumer: 'Home · Travel',
      pilot_wave: isPilot ? 'WAVE_1' : c.city_zh === '首尔' ? 'WAVE_2' : null,
      asset_lifecycle: 'draft',
      matrix_row_status: 'pending',
      scene: `${c.city_zh} · ${c.country_zh} · City Hero · 16:9`,
      copy_label: `${cityEn} · City Hero`,
      current_source: null,
    };
  });
}

function yamlQuote(s) {
  if (s == null) return 'null';
  if (typeof s === 'boolean') return s ? 'true' : 'false';
  if (Array.isArray(s)) return `[${s.join(', ')}]`;
  if (/[:#\n]/.test(String(s))) return `"${String(s).replace(/"/g, '\\"')}"`;
  return String(s);
}

function writeMatrixYaml(rows) {
  const header = `# City Hero · Asset Matrix（Design SSOT · 38 城）
# Brief: data/catalog/city-hero-brief.v1.yaml
# P1 Standard: docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md
# Scope: 与 POI Catalog 城市集合一致 · 资产矩阵非图片本身

schema: traveltrust.cms_city_hero_matrix.v1
version: 1
effective_utc: "2026-07-07"
machine_key: TT_CMS_CITY_HERO_MATRIX
status: SCOPE_LOCKED
brief_ssot: data/catalog/city-hero-brief.v1.yaml
asset_kind: city_hero
scope_locked: true
total_rows: ${rows.length}

summary:
  countries: 10
  cities: ${rows.length}
  matrix_pass: 0
  asset_lifecycle_draft: ${rows.length}

pilot_discipline:
  wave_1: CH-JP-TOKYO-001
  wave_2: CH-KR-SEOUL-001
  forbidden: [batch_all_38_before_wave_2]

rows:
`;

  const body = rows
    .map((r) => {
      const lines = [
        `  - matrix_id: ${r.matrix_id}`,
        `    execution_order: ${r.execution_order}`,
        `    country_iso: ${r.country_iso}`,
        `    country_zh: ${yamlQuote(r.country_zh)}`,
        `    city_zh: ${yamlQuote(r.city_zh)}`,
        `    city_en: ${yamlQuote(r.city_en)}`,
        `    asset_key: ${r.asset_key}`,
        `    asset_kind: city_hero`,
        `    aspect_ratio: "${r.aspect_ratio}"`,
        `    fallback_key: ${r.fallback_key}`,
        `    fallback_ssot: ${yamlQuote(r.fallback_ssot)}`,
        `    consumer: ${yamlQuote(r.consumer)}`,
        `    surfaces: [home, travel]`,
        `    scene: ${yamlQuote(r.scene)}`,
        `    copy_label: ${yamlQuote(r.copy_label)}`,
        `    asset_lifecycle: draft`,
        `    matrix_row_status: pending`,
        `    current_source: null`,
      ];
      if (r.pilot_wave) lines.push(`    pilot_wave: ${r.pilot_wave}`);
      return lines.join('\n');
    })
    .join('\n');

  fs.writeFileSync(MATRIX, header + body + '\n');
}

function formatBriefMd(rows, doc) {
  const sample = rows.slice(0, 5);
  const pilot = rows.find((r) => r.city_zh === '东京');

  return [
    '# City Hero · Content Brief（Design SSOT）',
    '',
    '| | |',
    '|---|---|',
    '| **Version** | v1 |',
    '| **Status** | DESIGN_SSOT |',
    '| **Matrix** | `data/catalog/city-hero-matrix.v1.yaml` |',
    '| **Cities** | 38 / 10 countries |',
    '| **asset_kind** | `city_hero` (reserved) |',
    '',
    '---',
    '',
    '## 1 · 模块目标（Why）',
    '',
    '> **City Hero 为每个开放城市提供独立运营主视觉，不依赖 POI Hero，可由 CMS 独立发布与版本管理。**',
    '',
    '**不是：** POI Hero · 国家级 Destination Hero（`landing_ambient` / da-hero-*）',
    '',
    '---',
    '',
    '## 2 · Asset Matrix（最重要）',
    '',
    '定义 **资产矩阵**，不是图片本身。全量 38 行见 `city-hero-matrix.v1.yaml`。',
    '',
    '| 城市 | asset_key | 比例 | fallback | consumer |',
    '|------|-----------|------|----------|----------|',
    ...sample.map(
      (r) =>
        `| ${r.city_en}（${r.city_zh}） | \`${r.asset_key}\` | 16:9 | \`${r.fallback_key}\` | ${r.consumer} |`,
    ),
    `| … | +${rows.length - sample.length} cities | 16:9 | hero_{country} | Home · Travel |`,
    '',
    '**命名规则：**',
    '',
    '- `asset_key` = `city_hero_{city_slug}` · 例 `city_hero_tokyo`',
    '- `fallback_key` = `hero_{country_slug}` · 例 `hero_japan` → 国家级 Hero Assets',
    '- Runtime：无 city hero → 自动 fallback（设计约定 · 实现阶段接线）',
    '',
    '**Pilot：** Wave 1 = `CH-JP-TOKYO-001` · Wave 2 = Seoul',
    '',
    '---',
    '',
    '## 3 · 生命周期',
    '',
    '与 [P1 Standard v1.1.0 FROZEN](TT-CMS-P1-CONTENT-FAMILY-STANDARD.md) 完全一致：',
    '',
    '```',
    'Draft → Review → Publish → Catalog → Runtime → Consumer → Verify → Evidence → Frozen',
    '```',
    '',
    '---',
    '',
    '## 4 · Consumer Mapping',
    '',
    '| 页面 | 使用 City Hero |',
    '|------|----------------|',
    '| Home | ✅ |',
    '| Travel | ✅ |',
    '| Guide | ❌ |',
    '| Market | ❌ |',
    '| Community | ❌ |',
    '| Provider / Governance / Me | ❌ |',
    '',
    '矩阵 **consumer** 列：`Home` · `Travel` · `Home · Travel`（当前 38 城均为 `Home · Travel`）',
    '',
    '---',
    '',
    '## 5 · L5 Exit',
    '',
    '引用 SSOT · **不重复定义**：',
    '',
    '[TT-CMS-P1-CONTENT-FAMILY-STANDARD.md §8 · Frozen Exit Gate（六门）](TT-CMS-P1-CONTENT-FAMILY-STANDARD.md)',
    '',
    '---',
    '',
    '## 实现前禁止',
    '',
    'Admin · API · Catalog Schema · Runtime Resolver · Frontend · Upload — **Brief/Matrix 冻结后再开始**',
    '',
    '---',
    '',
    '```bash',
    'node scripts/dev/run-cms-city-hero-design-ssot.cjs',
    '```',
  ].join('\n');
}

function main() {
  const stamp = new Date().toISOString();
  const cities = extractCitiesFromPoiMatrix();
  const rows = buildMatrixRows(cities);
  writeMatrixYaml(rows);

  const doc = {
    schema: 'traveltrust.cms_city_hero_brief_evidence.v1',
    recorded_at_utc: stamp,
    TT_CMS_CITY_HERO_BRIEF: 'DESIGN_SSOT',
    TT_CMS_CITY_HERO_MATRIX: 'SCOPE_LOCKED',
    goal_one_liner:
      'City Hero 为每个开放城市提供独立运营主视觉，不依赖 POI Hero，可由 CMS 独立发布与版本管理。',
    brief_ssot: 'data/catalog/city-hero-brief.v1.yaml',
    matrix_ssot: 'data/catalog/city-hero-matrix.v1.yaml',
    asset_kind: 'city_hero',
    stats: {
      countries: 10,
      cities: rows.length,
      matrix_pass: 0,
      pilot_wave_1: 'CH-JP-TOKYO-001',
      pilot_wave_2: 'CH-KR-SEOUL-001',
    },
    consumer_pages: {
      Home: true,
      Travel: true,
      Guide: false,
      Market: false,
      Community: false,
    },
    l5_exit_ref: 'docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md §8',
    sample_rows: rows.slice(0, 5),
    rows,
    forbidden_until_implementation: [
      'admin_ui',
      'api',
      'catalog_schema',
      'runtime_resolver',
      'frontend',
      'upload',
    ],
  };

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatBriefMd(rows, doc) + '\n');

  console.log('TT_CMS_CITY_HERO_BRIEF: DESIGN_SSOT');
  console.log(`TT_CMS_CITY_HERO_MATRIX: SCOPE_LOCKED (${rows.length} rows)`);
  console.log(`Pilot: ${doc.stats.pilot_wave_1}`);
  console.log(`Matrix: ${MATRIX}`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main();
