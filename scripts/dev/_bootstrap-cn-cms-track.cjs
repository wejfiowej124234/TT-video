#!/usr/bin/env node
/** CN CMS track bootstrap from AE templates (9-country golden chain: JP…AE CLOSED) */
const fs = require('fs');
const path = require('path');

const DEV = path.join(__dirname);
const ROOT = path.join(DEV, '../..');
const HEROES = [
  'ocs-paris-art-official-guide-cover.jpg',
  'ocs-paris-art-community-media.jpg',
  'ocs-paris-art-community-cover.jpg',
  'ocs-paris-art-provider-cover.jpg',
  'ocs-paris-art-guide-avatar.jpg',
];

const CN_CITY_ORDER = ['北京', '上海', '广州', '成都', '杭州', '西安', '厦门', '青岛', '大理'];

const CN_CITIES = [
  { zh: '北京', en: 'Beijing', slug: 'beijing', token: 'BEIJING' },
  { zh: '上海', en: 'Shanghai', slug: 'shanghai', token: 'SHANGHAI' },
  { zh: '广州', en: 'Guangzhou', slug: 'guangzhou', token: 'GUANGZHOU' },
  { zh: '成都', en: 'Chengdu', slug: 'chengdu', token: 'CHENGDU' },
  { zh: '杭州', en: 'Hangzhou', slug: 'hangzhou', token: 'HANGZHOU' },
  { zh: '西安', en: "Xi'an", slug: 'xian', token: 'XIAN' },
  { zh: '厦门', en: 'Xiamen', slug: 'xiamen', token: 'XIAMEN' },
  { zh: '青岛', en: 'Qingdao', slug: 'qingdao', token: 'QINGDAO' },
  { zh: '大理', en: 'Dali', slug: 'dali', token: 'DALI' },
];

const PAIRS = [
  ['United Arab Emirates', 'China'],
  ['UAE', 'China'],
  ['Uae', 'China'],
  ['uae', 'china'],
  ['UAE · JP/KR/TH/SG/FR/US/AU/ES Country CLOSED 八模板', 'CN · JP/KR/TH/SG/FR/US/AU/ES/AE Country CLOSED 九模板'],
  ['cms-uae-content-qa.cjs', 'cms-china-content-qa.cjs'],
  ['CMS-UAE-CONTENT-QA', 'CMS-CHINA-CONTENT-QA'],
  ['CMS-AE-COUNTRY', 'CMS-CN-COUNTRY'],
  ['cms-ae-poi-pilot-waves.cjs', 'cms-cn-poi-pilot-waves.cjs'],
  ['cms-ae-country-runtime.cjs', 'cms-cn-country-runtime.cjs'],
  ['buildAePilotWaves', 'buildCnPilotWaves'],
  ['buildUaeContentQa', 'buildChinaContentQa'],
  ['assertAeTemplateCountriesClosed', 'assertCnTemplateCountriesClosed'],
  ['assessUaeCountry', 'assessChinaCountry'],
  ['assessUaeCountryRuntimeConsumer', 'assessChinaCountryRuntimeConsumer'],
  ['AE_CITY_DISPLAY_ORDER', 'CN_CITY_DISPLAY_ORDER'],
  ['AE_COUNTRY_CRITERIA', 'CN_COUNTRY_CRITERIA'],
  ['AE_CITIES', 'CN_CITIES'],
  ['AE_CITY_QA_EVIDENCE_TOKEN', 'CN_CITY_QA_EVIDENCE_TOKEN'],
  ['validateAeCityExitChecks', 'validateCnCityExitChecks'],
  ['validateAeCityContentQaClosures', 'validateCnCityContentQaClosures'],
  ['validateAeCityExecutionClosures', 'validateCnCityExecutionClosures'],
  ['validateCatalogApiAllAePois', 'validateCatalogApiAllCnPois'],
  ['validateUaeAmbient', 'validateChinaAmbient'],
  ['validateAeLockRegistryUnchanged', 'validateCnLockRegistryUnchanged'],
  ['validateAeScopeLock', 'validateCnScopeLock'],
  ['cms_ae_country_runtime_audit.v1', 'cms_cn_country_runtime_audit.v1'],
  ['cms_ae_country_closure.v1', 'cms_cn_country_closure.v1'],
  ['cms_ae_poi_catalog_scope_lock.v1', 'cms_cn_poi_catalog_scope_lock.v1'],
  ['cms_ae_poi_pilot_wave.v1', 'cms_cn_poi_pilot_wave.v1'],
  ['cms_ae_poi_wave_kickoff.v1', 'cms_cn_poi_wave_kickoff.v1'],
  ['cms_uae_content_qa.v1', 'cms_china_content_qa.v1'],
  ['TT_CMS_AE_COUNTRY', 'TT_CMS_CN_COUNTRY'],
  ['TT_CMS_AE_CONTENT_QA', 'TT_CMS_CN_CONTENT_QA'],
  ['TT_CMS_AE_COUNTRY_RUNTIME', 'TT_CMS_CN_COUNTRY_RUNTIME'],
  ['TT_CMS_AE_POI', 'TT_CMS_CN_POI'],
  ['AE_COUNTRY_RUNTIME_PASS', 'CN_COUNTRY_RUNTIME_PASS'],
  ['ae-country', 'cn-country'],
  ['ae_poi_runtime_exit_aggregate', 'cn_poi_runtime_exit_aggregate'],
  ['catalog_api_ae_poi', 'catalog_api_cn_poi'],
  ['uae_ambient_runtime', 'china_ambient_runtime'],
  ['ae_lock_guard', 'cn_lock_guard'],
  ['ae_lock_registry_unchanged', 'cn_lock_registry_unchanged'],
  ['ae_scope_lock', 'cn_scope_lock'],
  ['ae_scope', 'cn_scope'],
  ['ae_denominator', 'cn_denominator'],
  ['ae_active', 'cn_active'],
  ['ae_abu_dhabi_execution', 'cn_beijing_execution'],
  ['ae_country_runtime', 'cn_country_runtime'],
  ['abu_dhabi_pilot', 'beijing_pilot'],
  ['auhRows', 'bjRows'],
  ['abu_dhabi_closed', 'beijing_closed'],
  ['ABU_DHABI_CLOSED', 'BEIJING_CLOSED'],
  ['UAE Country', 'China Country'],
  ['阿联酋', '中国'],
  ['UAE L5', 'China L5'],
  ['uae_status', 'china_status'],
  ['isUaeScopedImage', 'isChinaScopedImage'],
  ['home_ae', 'home_cn'],
  ['market_ae_poi', 'market_cn_poi'],
  ['catalogUaeAmbientUrl', 'catalogChinaAmbientUrl'],
  ['aeOnly', 'cnOnly'],
  ['AE · 三城', 'CN · 九城'],
  ['三城 AE LOCK', '九城 CN LOCK'],
  ['country_iso=AE', 'country_iso=CN'],
  ["country_iso: 'AE'", "country_iso: 'CN'"],
  ['PH-AE-', 'PH-CN-'],
  ['run-cms-ae-', 'run-cms-cn-'],
  ['run-cms-uae-', 'run-cms-china-'],
  ['abort AE kickoff', 'abort CN kickoff'],
  ["'阿布扎比', '迪拜', '沙迦'", "'北京', '上海', '广州', '成都', '杭州', '西安', '厦门', '青岛', '大理'"],
  ['阿布扎比 → 迪拜 → 沙迦', '北京 → 上海 → 广州 → 成都 → 杭州 → 西安 → 厦门 → 青岛 → 大理'],
  ['阿布扎比 CLOSED', '北京 CLOSED'],
  ['阿布扎比', '北京'],
  ['Abu Dhabi', 'Beijing'],
  ['ABU_DHABI', 'BEIJING'],
  ['abu-dhabi', 'beijing'],
  ['迪拜', '上海'],
  ['Dubai', 'Shanghai'],
  ['DUBAI', 'SHANGHAI'],
  ['dubai', 'shanghai'],
  ['沙迦', '广州'],
  ['Sharjah', 'Guangzhou'],
  ['SHARJAH', 'GUANGZHOU'],
  ['sharjah', 'guangzhou'],
  ['WAVE_9_AE_PILOT', 'WAVE_10_CN_PILOT'],
  ['POI-WAVE-9-AE-PILOT', 'POI-WAVE-10-CN-PILOT'],
  ['AE_CITY_ORDER', 'CN_CITY_ORDER'],
  ['aeRows', 'cnRows'],
  ['aeByCity', 'cnByCity'],
  ['probeAbuDhabiCatalog', 'probeBeijingCatalog'],
  ['run-cms-abu-dhabi-content-qa-wave.cjs', 'run-cms-beijing-content-qa-wave.cjs'],
  ['AE Country Runtime', 'CN Country Runtime'],
  ['AE POI Catalog Scope Lock', 'CN POI Catalog Scope Lock'],
  ['AE_COUNTRY_CLOSED', 'CN_COUNTRY_CLOSED'],
  ['UAE Country CLOSED', 'China Country CLOSED'],
  ['UAE Country Runtime Audit', 'China Country Runtime Audit'],
  ['UAE Country Runtime', 'China Country Runtime'],
  ['AU 24 · ES 24 LOCK', 'AU 24 · ES 24 · AE 24 LOCK'],
  ['run-cms-ae-poi-catalog-scope-lock', 'run-cms-cn-poi-catalog-scope-lock'],
  ['CMS-AE-POI', 'CMS-CN-POI'],
  ['TT_CMS_AE_POI', 'TT_CMS_CN_POI'],
  ['TT_CMS_AE_POI_CATALOG_SCOPE_LOCK', 'TT_CMS_CN_POI_CATALOG_SCOPE_LOCK'],
  ['TT_CMS_AE_POI_DENOMINATOR_TOTAL', 'TT_CMS_CN_POI_DENOMINATOR_TOTAL'],
  ['TT_CMS_AE_POI_PILOT_ACCEPTANCE', 'TT_CMS_CN_POI_PILOT_ACCEPTANCE'],
  ['TT_CMS_AE_POI_NEXT_STAGE', 'TT_CMS_CN_POI_NEXT_STAGE'],
  ['TT_CMS_AE_POI_WAVE', 'TT_CMS_CN_POI_WAVE'],
  ['AE Scope Lock', 'CN Scope Lock'],
  ['AE LOCK: 24/24', 'CN LOCK: 0/91'],
  ['三城 AE', '九城 CN'],
  ['Catalog API AE POI', 'Catalog API CN POI'],
  ['AE POI Runtime', 'CN POI Runtime'],
  ['_monitor-ae-city-wave', '_monitor-cn-city-wave'],
  ['_monitor-ae-pipeline-finish', '_monitor-cn-pipeline-finish'],
];

function replaceAll(s) {
  let out = s;
  for (const [a, b] of PAIRS) out = out.split(a).join(b);
  return out;
}

function copyTransform(src, dst) {
  fs.writeFileSync(path.join(DEV, dst), replaceAll(fs.readFileSync(path.join(DEV, src), 'utf8')));
}

function loadCnMatrixRows() {
  const text = fs.readFileSync(path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml'), 'utf8');
  const blocks = text.split(/\n  - matrix_id: /).slice(1);
  const byCity = {};
  for (const b of blocks) {
    if (!b.includes('country_iso: CN')) continue;
    const row = {
      id: b.match(/^PH-CN-[^\n]+/)[0],
      city_zh: (b.match(/city_zh: ([^\n]+)/) || [])[1],
      poi: (b.match(/legacy_value: ([^\n]+)/) || [])[1],
    };
    (byCity[row.city_zh] = byCity[row.city_zh] || []).push(row);
  }
  return byCity;
}

function buildCityPilotBlock(cityMeta, rows) {
  const hero_files = {};
  rows.forEach((r, i) => {
    hero_files[r.id] = HEROES[i % HEROES.length];
  });
  const token = cityMeta.token;
  const slug = cityMeta.slug;
  const lines = [
    `  ${cityMeta.zh}: {`,
    `    country_iso: 'CN',`,
    `    country_zh: '中国',`,
    `    city_zh: '${cityMeta.zh}',`,
    `    city_en: '${cityMeta.en}',`,
    `    slug: '${slug}',`,
    `    interim_image: '${HEROES[CN_CITIES.indexOf(cityMeta) % HEROES.length]}',`,
    `    matrix_ids: [`,
    ...rows.map((r) => `      '${r.id}',`),
    `    ],`,
    `    pois: [${rows.map((r) => `'${r.poi}'`).join(', ')}],`,
    `    hero_files: {`,
    ...rows.map((r) => `      '${r.id}': '${hero_files[r.id]}',`),
    `    },`,
    `    closed_loop_latest: 'evidence/GO_cms_operation/poi-city-${slug}/CMS-POI-${token}-CLOSED-LOOP-LATEST.json',`,
    `    closure_latest: 'evidence/GO_cms_operation/CMS-POI-CITY-${token}-CLOSURE-LATEST.json',`,
    `    closure_key: 'TT_CMS_POI_CITY_${token}',`,
    `    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE'],`,
    `    golden_template: 'evidence/GO_cms_operation/CMS-AE-COUNTRY-CLOSURE-LATEST.json',`,
    `  },`,
  ];
  return lines.join('\n');
}

function patchCityPilotFile(byCity) {
  const pilotPath = path.join(DEV, 'lib/cms-poi-city-pilot.cjs');
  let pilot = fs.readFileSync(pilotPath, 'utf8');
  if (pilot.includes("country_iso: 'CN'")) {
    console.log('cms-poi-city-pilot.cjs already has CN cities — skip insert');
    return;
  }
  const cnBlocks = CN_CITIES.map((c) => buildCityPilotBlock(c, byCity[c.zh])).join('\n');
  pilot = pilot.replace(/\n};\n\nfunction readRegistry/, `\n${cnBlocks}\n};\n\nfunction readRegistry`);
  const cnNext = `  if (pilot?.country_iso === 'CN') {
    const order = ${JSON.stringify(CN_CITY_ORDER)};
    const idx = order.indexOf(cityZh);
    if (idx < 0 || idx >= order.length - 1) return null;
    return getCityPilot(order[idx + 1]);
  }
`;
  pilot = pilot.replace(
    `  if (pilot?.country_iso === 'AE') {
    const order = ['阿布扎比', '迪拜', '沙迦'];
    const idx = order.indexOf(cityZh);
    if (idx < 0 || idx >= order.length - 1) return null;
    return getCityPilot(order[idx + 1]);
  }`,
    `  if (pilot?.country_iso === 'AE') {
    const order = ['阿布扎比', '迪拜', '沙迦'];
    const idx = order.indexOf(cityZh);
    if (idx < 0 || idx >= order.length - 1) return null;
    return getCityPilot(order[idx + 1]);
  }
${cnNext}`,
  );
  fs.writeFileSync(pilotPath, pilot);
}

// libs
copyTransform('lib/cms-uae-content-qa.cjs', 'lib/cms-china-content-qa.cjs');
copyTransform('lib/cms-ae-poi-pilot-waves.cjs', 'lib/cms-cn-poi-pilot-waves.cjs');
copyTransform('lib/cms-ae-country-runtime.cjs', 'lib/cms-cn-country-runtime.cjs');

let cnQa = fs.readFileSync(path.join(DEV, 'lib/cms-china-content-qa.cjs'), 'utf8');
if (!cnQa.includes('AE_COUNTRY_CLOSURE')) {
  cnQa = cnQa.replace(
    "const ES_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json');",
    "const ES_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json');\nconst AE_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-AE-COUNTRY-CLOSURE-LATEST.json');",
  );
  cnQa = cnQa.replace(
    "    ['ES', ES_COUNTRY_CLOSURE, 'TT_CMS_ES_COUNTRY'],\n  ])",
    "    ['ES', ES_COUNTRY_CLOSURE, 'TT_CMS_ES_COUNTRY'],\n    ['AE', AE_COUNTRY_CLOSURE, 'TT_CMS_AE_COUNTRY'],\n  ])",
  );
  cnQa = cnQa.replace(
    "      { country_iso: 'ES', closure_ssot: 'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json' },\n    ],",
    "      { country_iso: 'ES', closure_ssot: 'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json' },\n      { country_iso: 'AE', closure_ssot: 'evidence/GO_cms_operation/CMS-AE-COUNTRY-CLOSURE-LATEST.json' },\n    ],",
  );
  cnQa = cnQa.replace(
    "active_city: registry?.active_city || { country_iso: 'AE', city_zh: '阿布扎比' }",
    "active_city: registry?.active_city || { country_iso: 'CN', city_zh: '北京' }",
  );
  cnQa = cnQa.replace(
    "template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES']",
    "template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE']",
  );
}
fs.writeFileSync(path.join(DEV, 'lib/cms-china-content-qa.cjs'), cnQa);

// country runtime — AE lock guard
let cnRt = fs.readFileSync(path.join(DEV, 'lib/cms-cn-country-runtime.cjs'), 'utf8');
const cnTokenBlock = CN_CITIES.map((c) => `  ${c.zh}: '${c.token}',`).join('\n');
cnRt = cnRt.replace(
  /const CN_CITY_QA_EVIDENCE_TOKEN = \{[\s\S]*?\};/,
  `const CN_CITY_QA_EVIDENCE_TOKEN = {\n${cnTokenBlock}\n};`,
);
cnRt = cnRt.replace(/const CN_CITIES = \[.*?\];/s, `const CN_CITIES = ${JSON.stringify(CN_CITY_ORDER)};`);
if (!cnRt.includes('function validateAeLockRegistryUnchanged()')) {
  cnRt = cnRt.replace(
    'function validateEsLockRegistryUnchanged() {',
    `const AE_CITIES_GUARD = ['阿布扎比', '迪拜', '沙迦'];
function validateAeLockRegistryUnchanged() {
  const issues = [];
  const rows = [];
  for (const cityZh of AE_CITIES_GUARD) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      rows.push({ matrix_id: matrixId, city_zh: cityZh, state: a.state, replace_count: a.replace_count });
      if (a.state !== 'LOCKED') issues.push(\`\${matrixId}: AE lock changed\`);
      if (a.replace_count !== 1) issues.push(\`\${matrixId}: AE replace_count=\${a.replace_count}\`);
    }
  }
  return { id: 'ae_lock_registry_unchanged', label: '阿联酋三城 LOCK 资产未改动 (24/24)', pass: issues.length === 0, locked_count: rows.filter((r) => r.state === 'LOCKED').length, total: rows.length, rows, issues };
}
function validateEsLockRegistryUnchanged() {`,
  );
}
if (!cnRt.includes('validateAeLockRegistryUnchanged,')) {
  cnRt = cnRt.replace('validateEsLockRegistryUnchanged,', 'validateEsLockRegistryUnchanged,\n  validateAeLockRegistryUnchanged,');
}
cnRt = cnRt.replace(
  "cn_scope_lock: path.join(ROOT, 'evidence/GO_cms_operation/CMS-CN-POI-CATALOG-SCOPE-LOCK-LATEST.json')",
  "cn_scope_lock: path.join(ROOT, 'evidence/GO_cms_operation/CMS-CN-POI-CATALOG-SCOPE-LOCK-LATEST.json')",
);
fs.writeFileSync(path.join(DEV, 'lib/cms-cn-country-runtime.cjs'), cnRt);

// country scripts
copyTransform('run-cms-ae-country-runtime-audit.cjs', 'run-cms-cn-country-runtime-audit.cjs');
copyTransform('run-cms-ae-country-closure-evidence.cjs', 'run-cms-cn-country-closure-evidence.cjs');
copyTransform('run-cms-uae-content-qa.cjs', 'run-cms-china-content-qa.cjs');
copyTransform('run-cms-ae-poi-catalog-scope-lock.cjs', 'run-cms-cn-poi-catalog-scope-lock.cjs');

// scope lock — AE closure + AE lock guard
let scope = fs.readFileSync(path.join(DEV, 'run-cms-cn-poi-catalog-scope-lock.cjs'), 'utf8');
scope = scope.replace(
  "  ES: path.join(ROOT, 'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json'),\n};",
  "  ES: path.join(ROOT, 'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json'),\n  AE: path.join(ROOT, 'evidence/GO_cms_operation/CMS-AE-COUNTRY-CLOSURE-LATEST.json'),\n};",
);
scope = scope.replace(
  "  assertCountryClosed(CLOSURES.ES, 'TT_CMS_ES_COUNTRY');\n  assertPriorLocksUntouched();",
  "  assertCountryClosed(CLOSURES.ES, 'TT_CMS_ES_COUNTRY');\n  assertCountryClosed(CLOSURES.AE, 'TT_CMS_AE_COUNTRY');\n  assertPriorLocksUntouched();",
);
scope = scope.replace(
  "    ES: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-ES-') && a.state === 'LOCKED').length,\n  };",
  "    ES: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-ES-') && a.state === 'LOCKED').length,\n    AE: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-AE-') && a.state === 'LOCKED').length,\n  };",
);
scope = scope.replace(
  "  if (counts.ES !== 24) throw new Error(`ES LOCK drift: ${counts.ES}/24 — abort`);",
  "  if (counts.ES !== 24) throw new Error(`ES LOCK drift: ${counts.ES}/24 — abort`);\n  if (counts.AE !== 24) throw new Error(`AE LOCK drift: ${counts.AE}/24 — abort`);",
);
scope = scope.replace(
  "      es_locked_required: 24,\n      verified: true,",
  "      es_locked_required: 24,\n      ae_locked_required: 24,\n      verified: true,",
);
scope = scope.replace(
  "      { country_iso: 'ES', TT_CMS_ES_COUNTRY: 'CLOSED' },\n    ],",
  "      { country_iso: 'ES', TT_CMS_ES_COUNTRY: 'CLOSED' },\n      { country_iso: 'AE', TT_CMS_AE_COUNTRY: 'CLOSED' },\n    ],",
);
scope = scope.replace(
  "  console.log(`JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 · AU 24 · ES 24 LOCK unchanged`);",
  "  console.log(`JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 · AU 24 · ES 24 · AE 24 LOCK unchanged`);",
);
scope = scope.replace('buildAePilotWaves', 'buildCnPilotWaves');
scope = scope.replace('buildUAEContentQa', 'buildChinaContentQa');
scope = scope.replace('CMS-UAE-CONTENT-QA', 'CMS-CHINA-CONTENT-QA');
scope = scope.replace('不得修改 JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 · AU 24 · ES 24 LOCK', '不得修改 JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 · AU 24 · ES 24 · AE 24 LOCK');
scope = scope.replace(
  "template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES']",
  "template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE']",
);
scope = scope.replace(
  "        template: 'JP + KR + TH + SG + FR + US + AU + ES Golden Template'",
  "        template: 'JP + KR + TH + SG + FR + US + AU + ES + AE Golden Template'",
);
scope = scope.replace('ae_active: true', 'cn_active: true');
fs.writeFileSync(path.join(DEV, 'run-cms-cn-poi-catalog-scope-lock.cjs'), scope);

// cn pilot waves
let cnWaves = fs.readFileSync(path.join(DEV, 'lib/cms-cn-poi-pilot-waves.cjs'), 'utf8');
cnWaves = cnWaves.replace(
  "    'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json',\n  ],",
  "    'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json',\n    'evidence/GO_cms_operation/CMS-AE-COUNTRY-CLOSURE-LATEST.json',\n  ],",
);
cnWaves = cnWaves.replace(
  "    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES'],",
  "    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE'],",
);
cnWaves = cnWaves.replace(
  "      { stage: 'es_country', status: 'CLOSED', ssot: 'CMS-ES-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'ae_scope', status: 'LOCKED' },",
  "      { stage: 'es_country', status: 'CLOSED', ssot: 'CMS-ES-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'ae_country', status: 'CLOSED', ssot: 'CMS-AE-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'cn_scope', status: 'LOCKED' },",
);
cnWaves = cnWaves.replace(/rowsForCountry\(rows, 'AE'\)/g, "rowsForCountry(rows, 'CN')");
cnWaves = cnWaves.replace(/rowsForCountryCity\(rows, 'AE'/g, "rowsForCountryCity(rows, 'CN'");
cnWaves = cnWaves.replace(/ae_denominator/g, 'cn_denominator');
cnWaves = cnWaves.replace(/ae_country_total/g, 'cn_country_total');
cnWaves = cnWaves.replace(/ae_cities/g, 'cn_cities');
cnWaves = cnWaves.replace(/abu_dhabi_pilot/g, 'beijing_pilot');
fs.writeFileSync(path.join(DEV, 'lib/cms-cn-poi-pilot-waves.cjs'), cnWaves);

// city scripts from beijing (abu-dhabi) template for all 9 cities
for (const c of CN_CITIES) {
  const fromPairs = [
    ['beijing', c.slug],
    ['Beijing', c.en],
    ['BEIJING', c.token],
    ['北京', c.zh],
    [`cms_beijing_`, `cms_${c.slug.replace(/-/g, '_')}_`],
    [`TT_CMS_BEIJING_`, `TT_CMS_${c.token}_`],
  ];
  const transform = (src, dst) => {
    let t = fs.readFileSync(path.join(DEV, src), 'utf8');
    for (const [a, b] of fromPairs) t = t.split(a).join(b);
    t = replaceAll(t);
    fs.writeFileSync(path.join(DEV, dst), t);
  };
  if (!fs.existsSync(path.join(DEV, 'run-cms-beijing-content-qa-wave.cjs'))) {
    copyTransform('run-cms-abu-dhabi-content-qa-wave.cjs', 'run-cms-beijing-content-qa-wave.cjs');
    copyTransform('run-cms-poi-city-abu-dhabi-closure-evidence.cjs', 'run-cms-poi-city-beijing-closure-evidence.cjs');
    copyTransform('run-cms-poi-city-abu-dhabi-content-qa-closure-evidence.cjs', 'run-cms-poi-city-beijing-content-qa-closure-evidence.cjs');
    copyTransform('run-cms-poi-city-abu-dhabi-content-qa-exit-check.cjs', 'run-cms-poi-city-beijing-content-qa-exit-check.cjs');
  }
  if (c.slug === 'beijing') continue;
  transform('run-cms-beijing-content-qa-wave.cjs', `run-cms-${c.slug}-content-qa-wave.cjs`);
  transform('run-cms-poi-city-beijing-closure-evidence.cjs', `run-cms-poi-city-${c.slug}-closure-evidence.cjs`);
  transform('run-cms-poi-city-beijing-content-qa-closure-evidence.cjs', `run-cms-poi-city-${c.slug}-content-qa-closure-evidence.cjs`);
  transform('run-cms-poi-city-beijing-content-qa-exit-check.cjs', `run-cms-poi-city-${c.slug}-content-qa-exit-check.cjs`);
}

for (const c of CN_CITIES) {
  const slug = c.slug;
  for (const kind of ['closure-evidence', 'content-qa-closure-evidence', 'content-qa-exit-check']) {
    const p = path.join(DEV, `run-cms-poi-city-${slug}-${kind}.cjs`);
    if (!fs.existsSync(p)) continue;
    let t = fs.readFileSync(p, 'utf8');
    t = t.replace(/country_iso=AE/g, 'country_iso=CN');
    t = t.replace("active_country: { country_iso: 'AE'", "active_country: { country_iso: 'CN'");
    t = t.replace('POI City Closure Evidence · AE ·', 'POI City Closure Evidence · CN ·');
    t = t.replace('label: `AE ·', 'label: `CN ·');
    t = t.replace('CMS-AE-POI', 'CMS-CN-POI');
    t = t.replace("country_iso: 'AE'", "country_iso: 'CN'");
    t = t.replace('cms-uae-content-qa.cjs', 'cms-china-content-qa.cjs');
    t = t.replace('buildUaeContentQa', 'buildChinaContentQa');
    t = t.replace('TT_CMS_AE_COUNTRY', 'TT_CMS_CN_COUNTRY');
    t = t.replace('阿联酋', '中国');
    fs.writeFileSync(p, t);
  }
  const wave = path.join(DEV, `run-cms-${slug}-content-qa-wave.cjs`);
  if (fs.existsSync(wave)) {
    let w = fs.readFileSync(wave, 'utf8');
    w = w.replace(/assertStagingBaselineMutationAuthorized\('cms_[^']+'\)/, `assertStagingBaselineMutationAuthorized('cms_${slug.replace(/-/g, '_')}_content_qa_wave')`);
    fs.writeFileSync(wave, w);
  }
}

// cn country closure fixes
let cnCl = fs.readFileSync(path.join(DEV, 'run-cms-cn-country-closure-evidence.cjs'), 'utf8');
cnCl = cnCl.replace(
  "const ES_CITIES_GUARD = ['巴塞罗那', '马德里', '塞维利亚'];",
  "const ES_CITIES_GUARD = ['巴塞罗那', '马德里', '塞维利亚'];\nconst AE_CITIES_GUARD = ['阿布扎比', '迪拜', '沙迦'];",
);
cnCl = cnCl.replace(
  "if (report.summary.cities_execution_pass !== 3)",
  "if (report.summary.cities_execution_pass !== 9)",
);
cnCl = cnCl.replace(
  "if (report.summary.cities_content_qa_closed !== 3)",
  "if (report.summary.cities_content_qa_closed !== 9)",
);
cnCl = cnCl.replace(
  "issues.push(...assertLocksUnchanged(AE_CITIES, 'AE'));",
  "issues.push(...assertLocksUnchanged(CN_CITIES, 'CN'));\n  issues.push(...assertLocksUnchanged(AE_CITIES_GUARD, 'AE'));",
);
cnCl = cnCl.replace('ae_lock_guard: { required: 24', 'cn_lock_guard: { required: 91');
cnCl = cnCl.replace('AE LOCK: 24/24', 'CN LOCK: 91/91');
cnCl = cnCl.replace("'JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES'", "'JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE'");
cnCl = cnCl.replace('buildUAEContentQa', 'buildChinaContentQa');
cnCl = cnCl.replace('cms-uae-content-qa.cjs', 'cms-china-content-qa.cjs');
fs.writeFileSync(path.join(DEV, 'run-cms-cn-country-closure-evidence.cjs'), cnCl);

// monitors
copyTransform('_monitor-ae-city-wave.cjs', '_monitor-cn-city-wave.cjs');
let cnMon = fs.readFileSync(path.join(DEV, '_monitor-cn-city-wave.cjs'), 'utf8');
cnMon = cnMon.replace(
  "const PRIOR_AE = ['阿布扎比', '迪拜', '沙迦'].slice(0, ['阿布扎比', '迪拜', '沙迦'].indexOf(CITY_ZH));",
  `const CN_CITY_ORDER = ${JSON.stringify(CN_CITY_ORDER)};
const PRIOR_CN = CN_CITY_ORDER.slice(0, CN_CITY_ORDER.indexOf(CITY_ZH));`,
);
cnMon = cnMon.replace(/PRIOR_AE/g, 'PRIOR_CN');
cnMon = cnMon.replace(
  `  for (const [iso, n] of Object.entries({ JP: 41, KR: 31, TH: 28, SG: 10, FR: 24, US: 33, AU: 24, ES: 24 })) {`,
  `  for (const [iso, n] of Object.entries({ JP: 41, KR: 31, TH: 28, SG: 10, FR: 24, US: 33, AU: 24, ES: 24, AE: 24 })) {`,
);
cnMon = cnMon.replace("_monitor-ae-city-wave", "_monitor-cn-city-wave");
fs.writeFileSync(path.join(DEV, '_monitor-cn-city-wave.cjs'), cnMon);

// pipeline finish for all 9 cities + country
const pipeline = `#!/usr/bin/env node
/** CN pipeline · 九城 Triple Pass → TT_CMS_CN_COUNTRY: CLOSED · NO Production GO */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');

const ROOT = path.join(__dirname, '../..');
const LOG = path.join(ROOT, 'evidence/GO_cms_operation/_cn-pipeline-finish.log');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\\/$/, '');
const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\\/$/, '');
const POLL_MS = 60000;
const CN_CITY_ORDER = ${JSON.stringify(CN_CITY_ORDER)};

function log(msg) {
  const line = \`[\${new Date().toISOString()}] \${msg}\`;
  console.log(line);
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.appendFileSync(LOG, line + '\\n');
}

function cityTriple(cityZh) {
  const p = getCityPilot(cityZh);
  const token = p.closure_key.replace('TT_CMS_POI_CITY_', '');
  const execP = path.join(ROOT, \`evidence/GO_cms_operation/CMS-POI-CITY-\${token}-CLOSURE-LATEST.json\`);
  const qaP = path.join(ROOT, \`evidence/GO_cms_operation/CMS-POI-CITY-\${token}-CONTENT-QA-CLOSURE-LATEST.json\`);
  const exitP = path.join(ROOT, \`evidence/GO_cms_operation/CMS-POI-CITY-\${token}-CONTENT-QA-EXIT-CHECK-LATEST.json\`);
  if (!fs.existsSync(execP) || !fs.existsSync(qaP) || !fs.existsSync(exitP)) return false;
  const exec = JSON.parse(fs.readFileSync(execP, 'utf8'));
  const qa = JSON.parse(fs.readFileSync(qaP, 'utf8'));
  const exit = JSON.parse(fs.readFileSync(exitP, 'utf8'));
  return exec[p.closure_key] === 'CLOSED' && qa[\`\${p.closure_key}_CONTENT_QA\`] === 'CLOSED' && exit[\`\${p.closure_key}_CONTENT_QA_EXIT\`] === 'PASS' && exit.all_pass === true;
}

function runCityMonitor(cityZh) {
  log(\`CITY START \${cityZh}\`);
  const child = spawnSync(process.execPath, ['scripts/dev/_monitor-cn-city-wave.cjs'], {
    cwd: ROOT,
    env: { ...process.env, CITY_ZH: cityZh, API, WEB, TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: '1' },
    stdio: 'inherit',
    timeout: 6 * 60 * 60 * 1000,
  });
  if (child.status !== 0) throw new Error(\`\${cityZh} monitor failed exit \${child.status}\`);
  if (!cityTriple(cityZh)) throw new Error(\`\${cityZh} TRIPLE PASS not confirmed\`);
  log(\`\${cityZh} TRIPLE PASS\`);
}

function runNode(rel) {
  execSync(\`node \${rel}\`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, API, API_BASE: API, WEB, TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: '1' },
  });
}

async function main() {
  log('CN PIPELINE START · 九城 → Country CLOSED · NO Production GO');
  for (const cityZh of CN_CITY_ORDER) {
    if (cityTriple(cityZh)) {
      log(\`SKIP \${cityZh} already TRIPLE PASS\`);
      continue;
    }
    runCityMonitor(cityZh);
  }
  const countryP = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CN-COUNTRY-CLOSURE-LATEST.json');
  if (!fs.existsSync(countryP) || JSON.parse(fs.readFileSync(countryP, 'utf8')).TT_CMS_CN_COUNTRY !== 'CLOSED') {
    log('CN Country Runtime Audit START');
    runNode('scripts/dev/run-cms-cn-country-runtime-audit.cjs');
    log('CN Country CLOSED evidence START');
    runNode('scripts/dev/run-cms-cn-country-closure-evidence.cjs');
  }
  const country = JSON.parse(fs.readFileSync(countryP, 'utf8'));
  log(\`FINAL TT_CMS_CN_COUNTRY=\${country.TT_CMS_CN_COUNTRY}\`);
  log('CN PIPELINE COMPLETE · PAUSED · NO Production GO');
}

main().catch((e) => { log(\`FATAL \${e.message}\`); process.exit(1); });
`;
fs.writeFileSync(path.join(DEV, '_monitor-cn-pipeline-finish.cjs'), pipeline);

const byCity = loadCnMatrixRows();
patchCityPilotFile(byCity);

console.log('CN bootstrap complete');
console.log(`Cities: ${CN_CITY_ORDER.join(' → ')}`);
console.log(`POI total: ${Object.values(byCity).reduce((n, r) => n + r.length, 0)}`);
console.log('Next: node scripts/dev/run-cms-cn-poi-catalog-scope-lock.cjs');
