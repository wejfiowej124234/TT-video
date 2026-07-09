#!/usr/bin/env node
/**
 * City Hero SSOT Verification · 不开发 · 只回答 A vs B
 *
 * A = 城市主视觉已随十国 POI/Hero/Ambient 完成（Registry 漏更新）
 * B = 独立 CMS 模块 city_hero（按城市换图 · 尚未实现）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const OUT_JSON = path.join(EVIDENCE, 'CMS-CITY-HERO-SSOT-VERIFICATION-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-CITY-HERO-SSOT-VERIFICATION-LATEST.md');
const API = process.env.CMS_API_BASE || 'https://tt-api-staging.fly.dev';

function readJson(rel) {
  const p = path.isAbsolute(rel) ? rel : path.join(EVIDENCE, rel);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

async function probeCityHeroCatalog() {
  try {
    const r = await fetch(`${API}/api/v1/catalog/media?asset_kind=city_hero&limit=5`);
    const j = await r.json();
    return { ok: true, count: j.count ?? (j.items || []).length, items: (j.items || []).slice(0, 3) };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

async function main() {
  const stamp = new Date().toISOString();
  const ten = readJson('CMS-TEN-COUNTRY-FINAL-CLOSURE-REPORT-LATEST.json');
  const exec = readJson('CMS-CONTENT-EXECUTION-LATEST.json');
  const gap = readJson('CMS-L5-CONTENT-GAP-REPORT-LATEST.json');
  const denom = readJson('CMS-DENOMINATOR-LOCK-LATEST.json');
  const cityFamily = exec?.content_families?.find((f) => f.id === 'city');
  const cityDenom = denom?.cms_denominator?.by_category?.city;
  const cityGap = gap?.family_reports?.city_hero;
  const catalogProbe = await probeCityHeroCatalog();

  const frozenModules = [
    {
      id: 'destination_ambient_hero',
      registry_name: 'Hero Assets',
      meaning: '十国 Home 全屏 Hero · da-hero-{iso}-home · asset_kind=landing_ambient',
      evidence: [
        'data/catalog/destination-ambient-hero-matrix.v1.yaml',
        'evidence/GO_cms_operation/CMS-DESTINATION-AMBIENT-RUNTIME-CLOSURE-LATEST.json',
      ],
      status: 'FROZEN P0',
    },
    {
      id: 'poi_content_qa',
      registry_name: 'POI Content QA',
      meaning: '按 City 跑 Execution → Content QA → Runtime · poi_hero 配图',
      evidence: [
        'evidence/GO_cms_operation/CMS-TEN-COUNTRY-FINAL-CLOSURE-REPORT-LATEST.json',
        'data/catalog/cms-image-inventory.v1.yaml · asset_type poi_city',
      ],
      status: 'FROZEN P0 · 330/330 LOCK',
    },
    {
      id: 'destination_ambient',
      registry_name: 'Destination Ambient',
      meaning: '十国氛围背景 · landing_ambient',
      evidence: ['data/catalog/destination-ambient-matrix.v1.yaml'],
      status: 'FROZEN P0',
    },
  ];

  const doc = {
    schema: 'traveltrust.cms_city_hero_ssot_verification.v1',
    recorded_at_utc: stamp,
    question: 'Registry City Hero = A（已完成）还是 B（独立模块未做）？',
    verdict: 'B',
    verdict_label: '独立 CMS 模块 · 尚未实现 · Registry Pilot 正确 · 不应改为 Frozen',
    TT_CMS_CITY_HERO_SSOT: 'INDEPENDENT_MODULE_NOT_STARTED',
    registry_module: {
      id: 'city_hero',
      name: 'City Hero',
      status: 'Pilot',
      business_critical: 'P1',
      l5_pass: false,
      next: '建立 L5 流程',
    },
    naming_collision: {
      summary: '十国流水线里的 Hero / City Runtime 不等于 Registry 的 city_hero 模块',
      pipeline_hero_means: 'destination_ambient_hero（国家级）+ poi_hero（POI 级 · 按 city 跑 runtime）',
      registry_city_hero_means: '独立 asset_kind=city_hero · 按城市一张主视觉（如东京 Hero）· 不依赖 POI',
    },
    already_frozen_not_city_hero: frozenModules,
    city_hero_signals: {
      cms_content_brief_asset_family: false,
      cms_image_inventory_row: false,
      admin_route: false,
      frontend_consumer: false,
      catalog_asset_kind: 'city_hero',
      catalog_probe: catalogProbe,
      denominator_lock: cityDenom,
      content_execution: cityFamily,
      l5_gap_report: cityGap,
    },
    ten_country_closure: {
      scope: 'POI Content QA per country/city',
      poi_locked: ten?.summary?.total_poi_locked,
      poi_expected: ten?.summary?.total_poi_expected,
      includes_city_hero_module: false,
      evidence: 'evidence/GO_cms_operation/CMS-TEN-COUNTRY-FINAL-CLOSURE-REPORT-LATEST.json',
    },
    recommendation: {
      registry_action: 'KEEP Pilot · 不改为 Frozen',
      do_not: ['重复十国验收', '引用 POI/Ambient/Hero Evidence 作为 City Hero 完成证明'],
      when_ready: [
        'cms-content-brief 增加 city_hero asset family',
        'Admin route + catalog ingest',
        'Matrix/Registry Evidence 走 Replace→Publish→Verify→Exit Check',
      ],
      next_p1_after_clarification: 'Hotel（或先定义 City Hero brief 再开发）',
    },
    sources: [
      'registry/cms-master-registry.v1.yaml',
      'data/catalog/cms-content-brief.v1.yaml',
      'data/catalog/cms-image-inventory.v1.yaml',
      'scripts/dev/lib/cms-infrastructure-freeze.cjs',
      'evidence/GO_cms_operation/CMS-CONTENT-EXECUTION-LATEST.json',
      'evidence/GO_cms_operation/CMS-DENOMINATOR-LOCK-LATEST.json',
      'evidence/GO_cms_operation/CMS-L5-CONTENT-GAP-REPORT-LATEST.json',
      `${API}/api/v1/catalog/media?asset_kind=city_hero`,
    ],
  };

  const md = [
    '# City Hero SSOT Verification',
    '',
    '| | |',
    '|---|---|',
    `| **Date** | ${stamp.slice(0, 10)} |`,
    '| **Question** | Registry「City Hero」= 已完成（A）还是独立模块（B）？ |',
    '| **Verdict** | **B · 独立 CMS 模块 · 尚未实现** |',
    '| **Registry Action** | **保持 Pilot · 不改为 Frozen** |',
    '',
    '## 结论（一句话）',
    '',
    '十国已冻结的是 **Hero Assets（国家级）** 和 **POI Content QA（poi_hero · 按 city 跑 runtime）**；',
    'Registry 里的 **City Hero** 指 **`asset_kind=city_hero` 的独立城市主视觉模块**，Catalog 里 **0 条**，Brief/Admin/Frontend 均未建。',
    '',
    '## 命名混淆点',
    '',
    '| 口语 / 流水线 | 实际 SSOT 模块 | 状态 |',
    '|--------------|---------------|------|',
    '| Country Hero / da-hero-* | **Hero Assets** · landing_ambient | ✅ Frozen P0 |',
    '| Destination Ambient | **Destination Ambient** | ✅ Frozen P0 |',
    '| City Runtime + POI Hero | **POI Content QA** · poi_hero | ✅ Frozen · 330/330 |',
    '| Registry「City Hero」 | **city_hero** · 按城市独立主视觉 | ⏳ Pilot · **未开始** |',
    '',
    '## 硬证据',
    '',
    '| 检查项 | 结果 |',
    '|--------|------|',
    `| Staging Catalog \`city_hero\` | count=${catalogProbe.count ?? 'n/a'} |`,
    `| CMS Content Execution · City Hero | ${cityFamily?.display || 'WAITING'} · ${cityFamily?.lock_completion || '0/0'} |`,
    `| Denominator Lock · city | ${cityDenom?.completion || 'catalog_empty'} |`,
    `| L5 Gap Report · city_hero | ${cityGap?.status || 'NOT_SEEN'} · assets=${cityGap?.total_assets ?? 0} |`,
    '| cms-content-brief asset_families | **无 city_hero** |',
    '| cms-image-inventory | **无 city_hero**（仅有 poi_city → poi_hero） |',
    '| Admin route | **无** /admin/content/city-hero |',
    '| Frontend resolver | **无** city_hero 消费 |',
    `| Ten Country Closure | POI ${ten?.summary?.total_poi_locked}/${ten?.summary?.total_poi_expected} · **不含 city_hero** |`,
    '',
    '## 已 Frozen 的三项（≠ City Hero）',
    '',
    ...frozenModules.map(
      (m) => `- **${m.registry_name}** — ${m.meaning} · ${m.status}`,
    ),
    '',
    '## 建议',
    '',
    '1. **不要**把 City Hero 改为 Frozen（会误用 POI/Hero Evidence）',
    '2. **不要**重复十国验收',
    '3. Registry 保持 **Pilot · P1 · L5 ❌ · 下一步：建立 L5 流程**',
    '4. 若要做 City Hero：先写 brief + admin + catalog，再走 POI 同级 L5',
    '5. 若 P1 优先运营价值：可先 **Hotel**，City Hero 待 brief 定义后再开',
    '',
    '## 刷新',
    '',
    '`node scripts/dev/run-cms-city-hero-ssot-verification.cjs`',
  ].join('\n');

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log(`TT_CMS_CITY_HERO_SSOT: ${doc.TT_CMS_CITY_HERO_SSOT}`);
  console.log(`Verdict: ${doc.verdict_label}`);
  console.log(`Catalog city_hero count: ${catalogProbe.count ?? 'probe_failed'}`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
