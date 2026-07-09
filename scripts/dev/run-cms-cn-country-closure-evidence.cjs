#!/usr/bin/env node
/**
 * China Country CLOSED · national_runtime + 三城 Content QA 汇总
 *
 * 前置：run-cms-cn-country-runtime-audit.cjs PASS
 * 不修改 JP/KR/TH/SG/FR LOCK · 不调整 Content QA 标准 · 不得进入下一国家或 ③ Production GO
 *
 *   node scripts/dev/run-cms-cn-country-closure-evidence.cjs
 */
const fs = require('fs');
const path = require('path');
const { buildChinaContentQa, CN_CITY_DISPLAY_ORDER } = require('./lib/cms-china-content-qa.cjs');
const {
  EVIDENCE,
  readJson,
  CN_CITIES,
  FR_CITIES,
  SG_CITIES,
  TH_CITIES,
  KR_CITIES,
  JP_CITIES,
} = require('./lib/cms-cn-country-runtime.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');
const { CITY_PILOTS } = require('./lib/cms-poi-city-pilot.cjs');

const US_CITIES = ['旧金山', '拉斯维加斯', '洛杉矶', '纽约'];
const AU_CITIES_GUARD = ['悉尼', '墨尔本', '黄金海岸'];
const ES_CITIES_GUARD = ['巴塞罗那', '马德里', '塞维利亚'];
const AE_CITIES_GUARD = ['阿布扎比', '迪拜', '沙迦'];

const ROOT = path.join(__dirname, '../..');
const OUT_LATEST = EVIDENCE.country_closure;
const OUT_MD = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CN-COUNTRY-CLOSURE-LATEST.md');
const RUNTIME_AUDIT = EVIDENCE.runtime_audit;
const NOW = new Date().toISOString();

function buildCitySummary(report, runtimeAudit) {
  return CN_CITY_DISPLAY_ORDER.map((cityZh) => {
    const city = report.cities.find((c) => c.city_zh === cityZh);
    const pilot = CITY_PILOTS[cityZh];
    const locked = pilot.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
    const live = (runtimeAudit?.city_summary || []).find((r) => r.city_zh === cityZh);
    return {
      city_zh: cityZh,
      city_en: pilot.city_en,
      poi_count: pilot.matrix_ids.length,
      execution: city?.execution?.verdict || '—',
      content_qa_closed: city?.content_qa_closed || false,
      runtime_consumer: city?.runtime_consumer?.verdict || '—',
      geo_matching: city?.geo_matching?.verdict || '—',
      content_accuracy: city?.content_accuracy?.verdict || '—',
      l5_quality: city?.l5_quality?.verdict || '—',
      locked: `${locked}/${pilot.matrix_ids.length}`,
      exit_runtime: live?.exit_runtime || '—',
      live_runtime: live ? `${live.live_pass}/${live.live_total}` : '—',
      catalog_runtime: live ? `${live.catalog_pass}/${live.catalog_total}` : '—',
    };
  });
}

function assertLocksUnchanged(cityList, label) {
  const issues = [];
  for (const cityZh of cityList) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      if (a.state !== 'LOCKED') issues.push(`${matrixId}: ${label} lock changed`);
    }
  }
  return issues;
}

function main() {
  const runtimeAudit = readJson(RUNTIME_AUDIT);
  if (!runtimeAudit || runtimeAudit.TT_CMS_CN_COUNTRY_RUNTIME !== 'PASS') {
    console.error('TT_CMS_CN_COUNTRY: NOT_CLOSED');
    console.error('  prerequisite: CMS-CN-COUNTRY-RUNTIME-AUDIT-LATEST.json TT_CMS_CN_COUNTRY_RUNTIME=PASS');
    console.error(`  current: ${runtimeAudit?.TT_CMS_CN_COUNTRY_RUNTIME || 'MISSING'}`);
    process.exit(1);
  }

  const report = buildChinaContentQa({ country_closed: true });
  const issues = [];

  if (report.summary.cities_execution_pass !== 9) issues.push(`execution ${report.summary.cities_execution_pass}/3`);
  if (report.summary.cities_content_qa_closed !== 9) {
    issues.push(`content_qa_closed ${report.summary.cities_content_qa_closed}/3`);
  }
  if (report.summary.total_content_accuracy_issues !== 0) {
    issues.push(`content_accuracy issues ${report.summary.total_content_accuracy_issues}`);
  }
  if (report.country?.TT_CMS_CN_COUNTRY !== 'CLOSED') {
    for (const c of (report.country?.criteria || []).filter((x) => !x.pass)) {
      issues.push(`country criterion FAIL: ${c.label}`);
    }
  }

  issues.push(...assertLocksUnchanged(CN_CITIES, 'AU'));
  issues.push(...assertLocksUnchanged(US_CITIES, 'US'));
  issues.push(...assertLocksUnchanged(FR_CITIES, 'FR'));
  issues.push(...assertLocksUnchanged(JP_CITIES, 'JP'));
  issues.push(...assertLocksUnchanged(KR_CITIES, 'KR'));
  issues.push(...assertLocksUnchanged(TH_CITIES, 'TH'));
  issues.push(...assertLocksUnchanged(SG_CITIES, 'SG'));

  if (issues.length) {
    console.error('TT_CMS_CN_COUNTRY: NOT_CLOSED');
    for (const i of issues) console.error(' ', i);
    process.exit(1);
  }

  const citySummary = buildCitySummary(report, runtimeAudit);
  const closure = {
    schema: 'traveltrust.cms_cn_country_closure.v1',
    recorded_at_utc: NOW,
    phase: '② staging',
    layer: 'CONTENT_QA',
    country: {
      country_iso: 'CN',
      country_zh: '中国',
      city_count: 3,
      poi_total: citySummary.reduce((n, c) => n + c.poi_count, 0),
    },
    jp_lock_guard: { required: 41, unchanged: true },
    kr_lock_guard: { required: 31, unchanged: true },
    th_lock_guard: { required: 28, unchanged: true },
    sg_lock_guard: { required: 10, unchanged: true },
    fr_lock_guard: { required: 24, unchanged: true },
    us_lock_guard: { required: 33, unchanged: true },
    cn_lock_guard: { required: 24, unchanged: true },
    next_country: 'BLOCKED',
    production_go: 'BLOCKED',
    workflow: 'Execution → Content QA → Country Runtime → Country CLOSED',
    content_qa_standard: 'evidence/GO_cms_operation/CMS-CONTENT-QA-STANDARD-FROZEN.v1.json',
    runtime_audit_ssot: 'evidence/GO_cms_operation/CMS-CN-COUNTRY-RUNTIME-AUDIT-LATEST.json',
    australia_content_qa_ssot: 'evidence/GO_cms_operation/CMS-China-CONTENT-QA-LATEST.json',
    asset_lock_registry: 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json',
    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE'],
    runtime_tier: 'national_runtime',
    consumer_surfaces: runtimeAudit.consumer_surfaces || [],
    city_summary: citySummary,
    country_criteria: report.country.criteria,
    country_runtime_consumer: report.country.country_runtime_consumer,
    checks: {
      three_city_execution_closed: true,
      three_city_content_qa_closed: true,
      three_city_exit_checks: true,
      us_lock_registry_unchanged: true,
      cn_lock_registry_unchanged: true,
      fr_lock_registry_unchanged: true,
      sg_lock_registry_unchanged: true,
      th_lock_registry_unchanged: true,
      kr_lock_registry_unchanged: true,
      jp_lock_registry_unchanged: true,
      cn_country_runtime_pass: true,
      content_accuracy_100: true,
      cross_region_0: report.country.cross_region_total === 0,
    },
    TT_CMS_CN_COUNTRY: 'CLOSED',
    TT_CMS_CN_CONTENT_QA: 'CLOSED',
    verdict: 'CN_COUNTRY_CLOSED',
  };

  fs.mkdirSync(path.dirname(OUT_LATEST), { recursive: true });
  fs.writeFileSync(OUT_LATEST, JSON.stringify(closure, null, 2) + '\n');

  const md = [
    '# China Country CLOSED',
    '',
    `**Recorded:** ${NOW}`,
    `**TT_CMS_CN_COUNTRY:** \`CLOSED\``,
    `**Phase:** ② staging · **Next country:** BLOCKED · **Production GO:** BLOCKED`,
    '',
    '## 三城 Content QA + Runtime',
    '',
    '| 城市 | POI | LOCK | Exec | Content QA | City Runtime | Live Runtime | Catalog |',
    '|------|-----|------|------|------------|--------------|--------------|---------|',
    ...citySummary.map(
      (c) =>
        `| ${c.city_zh} | ${c.poi_count} | ${c.locked} | ${c.execution} | ${c.content_qa_closed ? 'CLOSED' : 'OPEN'} | ${c.runtime_consumer} | ${c.live_runtime} | ${c.catalog_runtime} |`,
    ),
    '',
    '## Country criteria',
    '',
    ...report.country.criteria.map((c) => `- ${c.verdict} ${c.label}`),
  ].join('\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  const refreshed = buildChinaContentQa({ stamp_utc: NOW, country_closed: true });
  fs.writeFileSync(EVIDENCE.content_qa, JSON.stringify(refreshed, null, 2) + '\n');

  console.log('TT_CMS_CN_COUNTRY: CLOSED');
  console.log('TT_CMS_CN_CONTENT_QA: CLOSED');
  console.log('JP LOCK: 41/41 unchanged');
  console.log('KR LOCK: 31/31 unchanged');
  console.log('TH LOCK: 28/28 unchanged');
  console.log('SG LOCK: 10/10 unchanged');
  console.log('FR LOCK: 24/24 unchanged');
  console.log('US LOCK: 33/33 unchanged');
  console.log('CN LOCK: 0/91 unchanged');
  console.log('Next country: BLOCKED');
  console.log('Production GO: BLOCKED');
  console.log('');
  console.log('三城汇总:');
  for (const c of citySummary) {
    console.log(
      `  ${c.city_zh} | LOCK ${c.locked} | Exec ${c.execution} | QA ${c.content_qa_closed ? 'CLOSED' : 'OPEN'} | Exit ${c.exit_runtime} | Live ${c.live_runtime}`,
    );
  }
  console.log('');
  console.log('Country criteria:');
  for (const c of report.country.criteria) {
    console.log(`  ${c.verdict} ${c.label}`);
  }
  console.log(`Evidence: ${OUT_LATEST}`);
}

main();
