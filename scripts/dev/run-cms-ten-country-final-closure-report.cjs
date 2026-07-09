#!/usr/bin/env node
/**
 * 十国 CMS Content QA 最终收口报告 · JP/KR/TH/SG/FR/US/AU/ES/AE/CN
 * 不得进入 ③ Production GO
 */
const fs = require('fs');
const path = require('path');
const { getCityPilot, CITY_PILOTS } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');

const ROOT = path.join(__dirname, '../..');
const OUT_JSON = path.join(ROOT, 'evidence/GO_cms_operation/CMS-TEN-COUNTRY-FINAL-CLOSURE-REPORT-LATEST.json');
const OUT_MD = path.join(ROOT, 'evidence/GO_cms_operation/CMS-TEN-COUNTRY-FINAL-CLOSURE-REPORT-LATEST.md');

const COUNTRIES = [
  { iso: 'JP', zh: '日本', key: 'TT_CMS_JP_COUNTRY', closure: 'CMS-JP-COUNTRY-CLOSURE-LATEST.json', prefix: 'PH-JP-', expected: 41 },
  { iso: 'KR', zh: '韩国', key: 'TT_CMS_KR_COUNTRY', closure: 'CMS-KR-COUNTRY-CLOSURE-LATEST.json', prefix: 'PH-KR-', expected: 31 },
  { iso: 'TH', zh: '泰国', key: 'TT_CMS_TH_COUNTRY', closure: 'CMS-TH-COUNTRY-CLOSURE-LATEST.json', prefix: 'PH-TH-', expected: 28 },
  { iso: 'SG', zh: '新加坡', key: 'TT_CMS_SG_COUNTRY', closure: 'CMS-SG-COUNTRY-CLOSURE-LATEST.json', prefix: 'PH-SG-', expected: 10 },
  { iso: 'FR', zh: '法国', key: 'TT_CMS_FR_COUNTRY', closure: 'CMS-FR-COUNTRY-CLOSURE-LATEST.json', prefix: 'PH-FR-', expected: 24 },
  { iso: 'US', zh: '美国', key: 'TT_CMS_US_COUNTRY', closure: 'CMS-US-COUNTRY-CLOSURE-LATEST.json', prefix: 'PH-US-', expected: 33 },
  { iso: 'AU', zh: '澳大利亚', key: 'TT_CMS_AU_COUNTRY', closure: 'CMS-AU-COUNTRY-CLOSURE-LATEST.json', prefix: 'PH-AU-', expected: 24 },
  { iso: 'ES', zh: '西班牙', key: 'TT_CMS_ES_COUNTRY', closure: 'CMS-ES-COUNTRY-CLOSURE-LATEST.json', prefix: 'PH-ES-', expected: 24 },
  { iso: 'AE', zh: '阿联酋', key: 'TT_CMS_AE_COUNTRY', closure: 'CMS-AE-COUNTRY-CLOSURE-LATEST.json', prefix: 'PH-AE-', expected: 24 },
  { iso: 'CN', zh: '中国', key: 'TT_CMS_CN_COUNTRY', closure: 'CMS-CN-COUNTRY-CLOSURE-LATEST.json', prefix: 'PH-CN-', expected: 91 },
];

function readJson(rel) {
  const p = path.join(ROOT, 'evidence/GO_cms_operation', rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function countLocked(prefix) {
  const reg = readJson('CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json');
  const assets = Object.values(reg?.assets || {});
  return assets.filter((a) => String(a.matrix_id || '').startsWith(prefix) && a.state === 'LOCKED').length;
}

function cnCitiesTriplePass() {
  const order = ['北京', '上海', '广州', '成都', '杭州', '西安', '厦门', '青岛', '大理'];
  return order.map((cityZh) => {
    const p = getCityPilot(cityZh);
    const token = p.closure_key.replace('TT_CMS_POI_CITY_', '');
    const exec = readJson(`CMS-POI-CITY-${token}-CLOSURE-LATEST.json`);
    const qa = readJson(`CMS-POI-CITY-${token}-CONTENT-QA-CLOSURE-LATEST.json`);
    const exit = readJson(`CMS-POI-CITY-${token}-CONTENT-QA-EXIT-CHECK-LATEST.json`);
    const locked = p.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
    const triple =
      exec?.[p.closure_key] === 'CLOSED' &&
      qa?.[`${p.closure_key}_CONTENT_QA`] === 'CLOSED' &&
      exit?.[`${p.closure_key}_CONTENT_QA_EXIT`] === 'PASS' &&
      exit?.all_pass === true;
    return { city_zh: cityZh, locked: `${locked}/${p.matrix_ids.length}`, triple_pass: triple };
  });
}

function main() {
  const stamp = new Date().toISOString();
  const rows = COUNTRIES.map((c) => {
    const doc = readJson(c.closure);
    const status = doc?.[c.key] || 'OPEN';
    const locked = countLocked(c.prefix);
    return {
      country_iso: c.iso,
      country_zh: c.zh,
      machine_key: c.key,
      status,
      poi_locked: `${locked}/${c.expected}`,
      lock_guard_pass: locked === c.expected,
      closure_evidence: `evidence/GO_cms_operation/${c.closure}`,
    };
  });

  const allClosed = rows.every((r) => r.status === 'CLOSED');
  const cnCities = cnCitiesTriplePass();
  const report = {
    schema: 'traveltrust.cms_ten_country_final_closure_report.v1',
    recorded_at_utc: stamp,
    phase: '② staging',
    countries: rows,
    cn_city_triple_pass: cnCities,
    summary: {
      countries_closed: rows.filter((r) => r.status === 'CLOSED').length,
      countries_total: 10,
      all_ten_closed: allClosed,
      total_poi_locked: rows.reduce((n, r) => n + Number(r.poi_locked.split('/')[0]), 0),
      total_poi_expected: rows.reduce((n, r) => n + Number(r.poi_locked.split('/')[1]), 0),
    },
    production_go: 'BLOCKED',
    cms_pipeline: allClosed ? 'STOPPED' : 'ACTIVE',
    forbidden: ['modify_locked_assets', 'adjust_content_qa_standard', 'production_go'],
    TT_CMS_TEN_COUNTRY_FINAL_CLOSURE: allClosed ? 'CLOSED' : 'OPEN',
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');

  const md = [
    '# CMS 十国最终收口报告',
    '',
    `**Recorded:** ${stamp}`,
    `**TT_CMS_TEN_COUNTRY_FINAL_CLOSURE:** \`${report.TT_CMS_TEN_COUNTRY_FINAL_CLOSURE}\``,
    `**Production GO:** \`BLOCKED\``,
    '',
    '| Country | Key | Status | POI LOCK |',
    '|---------|-----|--------|----------|',
    ...rows.map((r) => `| ${r.country_zh} (${r.country_iso}) | ${r.machine_key} | ${r.status} | ${r.poi_locked} |`),
    '',
    '## CN 九城 Triple-Pass',
    '',
    ...cnCities.map((c) => `- ${c.city_zh}: ${c.triple_pass ? 'TRIPLE PASS' : 'IN PROGRESS'} (${c.locked})`),
    '',
    `**Evidence:** \`evidence/GO_cms_operation/CMS-TEN-COUNTRY-FINAL-CLOSURE-REPORT-LATEST.json\``,
  ].join('\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log(`TT_CMS_TEN_COUNTRY_FINAL_CLOSURE: ${report.TT_CMS_TEN_COUNTRY_FINAL_CLOSURE}`);
  console.log(`Countries CLOSED: ${report.summary.countries_closed}/10`);
  console.log(`Evidence: ${OUT_JSON}`);
  if (!allClosed) process.exit(0);
}

main();
