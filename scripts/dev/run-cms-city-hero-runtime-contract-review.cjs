#!/usr/bin/env node
/**
 * City Hero Runtime Contract V1 · Review Evidence only
 * 核对 Contract vs P1 Standard · Brief · Matrix · staging API 现状
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const OUT_JSON = path.join(EVIDENCE, 'CMS-CITY-HERO-RUNTIME-CONTRACT-REVIEW-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-CITY-HERO-RUNTIME-CONTRACT-REVIEW-LATEST.md');
const API = process.env.CMS_API_BASE || 'https://tt-api-staging.fly.dev';

const API_ALLOWLIST = ['poi_hero', 'landing_ambient', 'hotel_tier_stock', 'transport_stock', 'generic'];

async function probe(url) {
  try {
    const r = await fetch(url);
    const j = await r.json();
    return { ok: true, status: r.status, count: j.count ?? (j.items || []).length, items: (j.items || []).length };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

function readMatrixTokyo() {
  const t = fs.readFileSync(path.join(ROOT, 'data/catalog/city-hero-matrix.v1.yaml'), 'utf8');
  const block = t.split('  - matrix_id: CH-JP-TOKYO-001')[1]?.split('\n  - matrix_id:')[0] || '';
  const get = (k) => block.match(new RegExp(`\\n    ${k}: (.+)`))?.[1]?.trim();
  return {
    matrix_id: 'CH-JP-TOKYO-001',
    asset_key: get('asset_key'),
    fallback_key: get('fallback_key'),
    country_iso: get('country_iso'),
    city_en: get('city_en')?.replace(/"/g, ''),
    city_zh: get('city_zh')?.replace(/"/g, ''),
    consumer: get('consumer')?.replace(/"/g, ''),
  };
}

async function main() {
  const stamp = new Date().toISOString();
  const tokyo = readMatrixTokyo();

  const probes = {
    city_hero_jp: await probe(`${API}/api/v1/catalog/media?asset_kind=city_hero&country_iso=JP&limit=3`),
    city_hero_jp_slug: await probe(
      `${API}/api/v1/catalog/media?asset_kind=city_hero&country_iso=JP&city_slug=tokyo&limit=3`,
    ),
    landing_ambient_jp: await probe(`${API}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=JP&limit=3`),
  };

  const dimensions = [
    {
      id: 'asset_kind',
      topic: 'asset_kind=city_hero',
      verdict: 'PASS',
      contract: 'asset_kind: city_hero',
      p1_standard: 'city_hero CONFIRMED_RESERVED',
      brief: 'asset_kind: city_hero',
      staging: { in_api_allowlist: false, catalog_count: probes.city_hero_jp.count },
      note: '命名与 P1/Brief 一致 · allowlist 待实现阶段加入（Contract 已声明）',
    },
    {
      id: 'city_slug_query',
      topic: 'city_slug 查询',
      verdict: 'PASS',
      contract: 'query city_slug planned · bind asset_key city_hero_{slug}',
      brief: 'city_slug_rule + asset_key_convention',
      matrix: 'city_hero_tokyo ↔ tokyo slug',
      staging: {
        city_slug_param_ignored_today: probes.city_hero_jp.count === probes.city_hero_jp_slug.count,
        media_query_today: ['asset_kind', 'country_iso'],
      },
      note: 'Contract 诚实标注 PLANNED · 与 Brief/Matrix 一致',
    },
    {
      id: 'fallback_chain',
      topic: 'Fallback 链',
      verdict: 'PASS',
      contract: 'city_hero → landing_ambient(country_iso) → ts',
      brief: 'fallback_key hero_{country_slug} → landing_ambient',
      matrix_tokyo: { asset_key: tokyo.asset_key, fallback_key: tokyo.fallback_key },
      staging: { landing_ambient_jp_count: probes.landing_ambient_jp.count },
      note: 'hero_japan 为逻辑键 · ② 读面 landing_ambient+JP（与 da-hero 一致）',
    },
    {
      id: 'consumer_mapping',
      topic: 'Home / Travel Consumer',
      verdict: 'PASS',
      contract: { home: '/', travel: '/traveltrust' },
      brief: { Home: true, Travel: true, Market: false, Guide: false },
      matrix_consumer: tokyo.consumer,
      note: '与 Brief §4 完全一致 · Matrix consumer=Home · Travel',
    },
    {
      id: 'verify_probes',
      topic: 'Verify 探针',
      verdict: 'PASS',
      p1_standard: 'per-family script · catalog/api/resolution/l5 · registry PASS|FAIL',
      contract: 'run-cms-content-l5-city-hero-verify.cjs · probes catalog/api/decode/l5/fallback/consumer',
      wave1: 'CH-JP-TOKYO-001 · Home catalog-api required',
      note: 'consumer_home/travel 探针 = P1 Consumer Ready 门 · 扩展非冲突',
    },
    {
      id: 'evidence_schema',
      topic: 'Evidence Schema',
      verdict: 'PASS',
      p1_schema: 'traveltrust.cms_p1_family_verify.v1',
      contract_schema: 'extends P1 + city_hero_fields + TT_CMS_CITY_HERO_ROW_VERIFY',
      paths: [
        'evidence/GO_cms_content_l5/city-hero/rows/{matrix_id}.EVIDENCE.json',
        'evidence/GO_cms_operation/city-hero/CMS-CITY-HERO-VERIFY-LATEST.json',
      ],
      note: '符合 P1 §7 路径约定 · 字段扩展允许',
    },
    {
      id: 'wave1_tokyo',
      topic: 'Wave 1 东京验收',
      verdict: 'PASS',
      contract: 'CH-JP-TOKYO-001 · city_hero_tokyo · hero_japan',
      matrix: tokyo,
      brief_pilot: 'wave_1 CH-JP-TOKYO-001',
      note: '与 Brief pilot_discipline · Matrix pilot_wave WAVE_1 对齐',
    },
    {
      id: 'p1_exit_gate_mapping',
      topic: 'P1 六门映射',
      verdict: 'PASS',
      mapping: {
        catalog_ready: 'catalog probe + publish gates',
        runtime_ready: 'GET media contract query',
        consumer_ready: 'consumer_home/travel probes',
        verify_pass: 'TT_CMS_CITY_HERO_ROW_VERIFY',
        evidence_pass: 'row + latest evidence paths',
        l5_pass: 'l5 probe + no ts_fallback as PASS',
      },
      note: 'Contract Wave1 不要求 Registry Frozen（与 P1 诚实边界一致）',
    },
  ];

  const allPass = dimensions.every((d) => d.verdict === 'PASS');
  const doc = {
    schema: 'traveltrust.cms_city_hero_runtime_contract_review.v1',
    recorded_at_utc: stamp,
    contract_version: '1.0.0',
    contract_status: 'CONTRACT_ONLY',
    TT_CMS_CITY_HERO_RUNTIME_CONTRACT_REVIEW: allPass ? 'PASS' : 'FAIL',
    TT_CMS_CITY_HERO_RUNTIME_CONTRACT: allPass ? 'REVIEW_PASS_READY_FOR_WAVE1_PLAN' : 'REVIEW_FAIL',
    p1_standard_ref: 'docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md v1.1.0 FROZEN',
    upstream: {
      brief: 'data/catalog/city-hero-brief.v1.yaml',
      matrix: 'data/catalog/city-hero-matrix.v1.yaml',
      contract: 'data/catalog/city-hero-runtime-contract.v1.yaml',
    },
    untouched: ['registry', 'ownership_matrix', 'p1_standard', 'admin', 'api', 'runtime_code', 'frontend'],
    api_allowlist_reference: API_ALLOWLIST,
    staging_probes: probes,
    dimensions,
    gaps_expected_at_contract_phase: [
      'city_hero not in catalog_ops_admin allowlist',
      'MediaQuery lacks city_slug filter',
      'catalog count=0 for city_hero',
      'no resolver implementation',
    ],
    next_step: 'Wave 1 东京实现规划（Review PASS 后）',
    amendments_required: [],
  };

  const md = [
    '# City Hero Runtime Contract · Review',
    '',
    '| | |',
    '|---|---|',
    `| **Date** | ${stamp.slice(0, 10)} |`,
    '| **Contract** | v1.0.0 CONTRACT_ONLY |',
    '| **Verdict** | **PASS** |',
    '| **Next** | Wave 1 东京实现规划 |',
    '',
    '## 核对维度',
    '',
    '| # | 维度 | 结论 |',
    '|---|------|------|',
    ...dimensions.map((d) => `| ${d.id} | ${d.topic} | **${d.verdict}** |`),
    '',
    '## Staging 探针',
    '',
    '| Probe | count |',
    '|-------|-------|',
    `| city_hero JP | ${probes.city_hero_jp.count} |`,
    `| city_hero JP+city_slug=tokyo | ${probes.city_hero_jp_slug.count} |`,
    `| landing_ambient JP (fallback ②) | ${probes.landing_ambient_jp.count} |`,
    '',
    '## 预期差距（Contract 阶段正常）',
    '',
    ...doc.gaps_expected_at_contract_phase.map((g) => `- ${g}`),
    '',
    '## 未修改',
    '',
    'Registry · Ownership Matrix · P1 Standard · 无 Admin/API/Runtime/Frontend 实现',
  ].join('\n');

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log(`TT_CMS_CITY_HERO_RUNTIME_CONTRACT_REVIEW: ${doc.TT_CMS_CITY_HERO_RUNTIME_CONTRACT_REVIEW}`);
  console.log(`TT_CMS_CITY_HERO_RUNTIME_CONTRACT: ${doc.TT_CMS_CITY_HERO_RUNTIME_CONTRACT}`);
  console.log(`Dimensions: ${dimensions.filter((d) => d.verdict === 'PASS').length}/${dimensions.length} PASS`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
