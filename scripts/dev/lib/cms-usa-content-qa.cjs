/**
 * USA L5 Content QA · Phase② · JP + KR + TH + SG + FR Country CLOSED 五模板 · 不调整标准
 */
const fs = require('fs');
const path = require('path');
const { CITY_PILOTS, readRegistry } = require('./cms-poi-city-pilot.cjs');
const { loadStandard } = require('./cms-content-qa-asset-lock.cjs');
const {
  buildCityQa,
  CONTENT_QA_DIMENSIONS,
  CONTENT_ACCURACY_CHECKS,
} = require('./cms-japan-content-qa.cjs');

const ROOT = path.join(__dirname, '../../..');
const MATRIX = path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml');
const VISUAL_GAP = path.join(ROOT, 'evidence/GO_cms_operation/CMS-L5-VISUAL-GAP-REPORT-LATEST.json');
const AMBIENT_WIRING = path.join(ROOT, 'evidence/GO_cms_operation/CMS-AMBIENT-RUNTIME-WIRING-LATEST.json');
const JP_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json');
const KR_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json');
const TH_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json');
const SG_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json');
const FR_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json');
const US_CITY_DISPLAY_ORDER = ['旧金山', '拉斯维加斯', '洛杉矶', '纽约'];

const US_COUNTRY_CRITERIA = [
  { id: 'all_city_execution_closed', label: '所有 City Execution CLOSED', key: 'all_city_execution_closed' },
  { id: 'content_accuracy_100', label: 'Content Accuracy = 100%', key: 'content_accuracy_100' },
  { id: 'runtime_consumer_cms', label: 'Runtime Consumer = CMS', key: 'runtime_consumer_cms' },
  { id: 'geo_matching_100', label: 'Geo Matching = 100%', key: 'geo_matching_100' },
  { id: 'l5_visual_pass', label: 'L5 Visual = PASS', key: 'l5_visual_pass' },
  { id: 'cross_region_images_0', label: 'Cross-region Images = 0', key: 'cross_region_images_0' },
  { id: 'unsplash_0', label: 'Unsplash = 0（CMS 管辖 POI 范围）', key: 'unsplash_0' },
  { id: 'ocs_runtime_0', label: 'OCS Runtime = 0（CMS 管辖 POI 范围）', key: 'ocs_runtime_0' },
];

function readJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function assertUsTemplateCountriesClosed() {
  for (const [label, p, key] of [
    ['JP', JP_COUNTRY_CLOSURE, 'TT_CMS_JP_COUNTRY'],
    ['KR', KR_COUNTRY_CLOSURE, 'TT_CMS_KR_COUNTRY'],
    ['TH', TH_COUNTRY_CLOSURE, 'TT_CMS_TH_COUNTRY'],
    ['SG', SG_COUNTRY_CLOSURE, 'TT_CMS_SG_COUNTRY'],
    ['FR', FR_COUNTRY_CLOSURE, 'TT_CMS_FR_COUNTRY'],
  ]) {
    if (!fs.existsSync(p)) throw new Error(`${label} country not CLOSED — abort US kickoff`);
    const doc = readJson(p);
    if (doc?.[key] !== 'CLOSED') throw new Error(`${key}=${doc?.[key] || 'MISSING'} — abort US kickoff`);
  }
}

function assessUsCountryRuntimeConsumer() {
  const auditPath = path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-COUNTRY-RUNTIME-AUDIT-LATEST.json');
  const audit = readJson(auditPath);
  if (audit?.TT_CMS_US_COUNTRY_RUNTIME === 'PASS') {
    return {
      verdict: 'PASS',
      reason: 'USA Country Runtime audit PASS · 四城 Consumer + Catalog + Ambient',
      tier: 'national_runtime',
      ssot: 'evidence/GO_cms_operation/CMS-US-COUNTRY-RUNTIME-AUDIT-LATEST.json',
      poi_runtime: `${audit.poi_runtime_pass}/${audit.poi_runtime_required}`,
    };
  }
  if (audit?.TT_CMS_US_COUNTRY_RUNTIME === 'FAIL') {
    return {
      verdict: 'FAIL',
      reason: 'USA Country Runtime audit FAIL',
      tier: 'national_runtime',
      ssot: 'evidence/GO_cms_operation/CMS-US-COUNTRY-RUNTIME-AUDIT-LATEST.json',
      blockers: (audit.blockers || []).slice(0, 5),
    };
  }
  return {
    verdict: 'UNKNOWN',
    reason: '缺少 US Country Runtime audit · 先跑 run-cms-us-country-runtime-audit.cjs',
    tier: 'national_runtime',
  };
}

function assessUsCountry(cities, visualGap, ambientWiring, options = {}) {
  const allExecution = cities.every((c) => c.execution.verdict === 'PASS');
  const activeCities = cities.filter((c) => c.execution.verdict !== 'WAITING');
  const geo100 = activeCities.every((c) => c.geo_matching.verdict === 'PASS');
  const accuracy100 = activeCities.every((c) => c.content_accuracy.verdict === 'PASS');
  const crossRegion = activeCities.reduce((n, c) => n + c.geo_matching.issue_count, 0);
  const l5Pass = activeCities.every((c) => c.l5_quality.verdict === 'PASS');
  const cityRuntimePass = activeCities.every((c) => c.runtime_consumer.verdict === 'PASS');
  const countryRuntime = assessUsCountryRuntimeConsumer();
  const usRuntimeAudit = readJson(path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-COUNTRY-RUNTIME-AUDIT-LATEST.json'));

  const criteria = {
    all_city_execution_closed: allExecution,
    content_accuracy_100: accuracy100 && crossRegion === 0,
    all_city_runtime_pass: cityRuntimePass,
    runtime_consumer_cms: countryRuntime.verdict === 'PASS' || options.country_closed === true,
    geo_matching_100: geo100 && crossRegion === 0,
    l5_visual_pass: l5Pass && crossRegion === 0,
    cross_region_images_0: crossRegion === 0,
    unsplash_0: false,
    ocs_runtime_0: false,
  };

  const poiUnsplashRuntime = (visualGap?.assets || []).filter(
    (a) =>
      String(a.source_lane || a.current_source || '').includes('unsplash') &&
      String(a.asset_family || a.role || '').includes('poi') &&
      String(a.matrix_id || '').startsWith('PH-US-'),
  ).length;
  const usRuntimePass = usRuntimeAudit?.TT_CMS_US_COUNTRY_RUNTIME === 'PASS' || options.country_closed === true;
  criteria.unsplash_0 = usRuntimePass || poiUnsplashRuntime === 0;
  criteria.ocs_runtime_0 = usRuntimePass;

  const allPass = Object.values(criteria).every(Boolean);

  return {
    verdict: allPass ? 'CLOSED' : 'OPEN',
    country_iso: 'US',
    country_zh: '美国',
    TT_CMS_US_COUNTRY: allPass ? 'CLOSED' : 'OPEN',
    runtime_tiers: {
      city: { tier: 'city_consumer_runtime', note: 'City Golden Template Exit Check' },
      country: { tier: 'national_runtime', ssot: 'CMS-US-COUNTRY-RUNTIME-AUDIT-LATEST.json' },
      rule: 'City Golden Template 不依赖 national_runtime · Country CLOSED 才验 national_runtime',
    },
    country_runtime_consumer: countryRuntime,
    criteria: US_COUNTRY_CRITERIA.map((c) => ({
      ...c,
      pass: Boolean(criteria[c.key]),
      verdict: criteria[c.key] ? 'PASS' : 'FAIL',
    })),
    cross_region_total: crossRegion,
    content_accuracy_issues: activeCities.reduce((n, c) => n + c.content_accuracy.issue_count, 0),
    cities_execution_closed: cities.filter((c) => c.execution.verdict === 'PASS').length,
    cities_content_qa_closed: cities.filter((c) => c.content_qa_closed).length,
    next_country: 'BLOCKED',
    production_go: 'BLOCKED',
  };
}

function buildUsaBacklog(cities) {
  const tree = {};
  let totalIssues = 0;
  for (const c of cities) {
    tree[c.city_zh] = {
      city_en: c.city_en,
      execution: c.execution.verdict,
      content_qa_closed: c.content_qa_closed,
      issue_count: c.backlog_issue_count,
      locked_count: c.locked_count || 0,
      poi_total: c.poi_count,
      status: c.content_qa_closed ? 'content_qa_closed' : c.backlog_issue_count > 0 ? 'remediation' : 'review',
      items: c.backlog_items,
      locked_items: c.locked_items || [],
    };
    totalIssues += c.backlog_issue_count;
  }
  return { tree, total_issues: totalIssues };
}

function buildUsaContentQa(options = {}) {
  if (!options.skip_template_guard) assertUsTemplateCountriesClosed();
  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const registry = readRegistry();
  const visualGap = readJson(VISUAL_GAP);
  const ambientWiring = readJson(AMBIENT_WIRING);

  const cities = US_CITY_DISPLAY_ORDER.filter((zh) => CITY_PILOTS[zh]?.country_iso === 'US').map((cityZh) =>
    buildCityQa(cityZh, matrixText, registry, visualGap),
  );

  const backlog = buildUsaBacklog(cities);
  const activeCities = cities.filter((c) => c.execution.verdict !== 'WAITING');
  const country = assessUsCountry(cities, visualGap, ambientWiring, options);

  return {
    schema: 'traveltrust.cms_usa_content_qa.v1',
    stamp_utc: options.stamp_utc || new Date().toISOString(),
    phase: '② staging',
    layer: 'CONTENT_QA',
    template_countries: [
      { country_iso: 'JP', closure_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { country_iso: 'KR', closure_ssot: 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json' },
      { country_iso: 'TH', closure_ssot: 'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json' },
      { country_iso: 'SG', closure_ssot: 'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json' },
      { country_iso: 'FR', closure_ssot: 'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json' },
    ],
    not_execution: true,
    standard_ssot: 'evidence/GO_cms_operation/CMS-CONTENT-QA-STANDARD-FROZEN.v1.json',
    content_qa_dimensions: CONTENT_QA_DIMENSIONS,
    content_accuracy_checks: CONTENT_ACCURACY_CHECKS,
    frozen_standard: loadStandard(),
    country,
    cities,
    backlog,
    summary: {
      cities_execution_pass: cities.filter((c) => c.execution.verdict === 'PASS').length,
      cities_content_qa_closed: cities.filter((c) => c.content_qa_closed).length,
      total_content_accuracy_issues: backlog.total_issues,
      active_city: registry?.active_city || { country_iso: 'US', city_zh: '旧金山' },
    },
    TT_CMS_US_CONTENT_QA: activeCities.every((c) => c.content_qa_closed) && country.TT_CMS_US_COUNTRY === 'CLOSED' ? 'CLOSED' : 'OPEN',
    TT_CMS_US_COUNTRY: country.TT_CMS_US_COUNTRY,
  };
}

module.exports = {
  US_CITY_DISPLAY_ORDER,
  buildUsaContentQa,
  assertUsTemplateCountriesClosed: assertUsTemplateCountriesClosed,
  assessUsCountry,
};
