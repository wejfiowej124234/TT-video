#!/usr/bin/env node
/** AE CMS track bootstrap from ES templates (8-country golden chain) */
const fs = require('fs');
const path = require('path');

const DEV = path.join(__dirname);

const PAIRS = [
  ['Spain', 'UAE'],
  ['spain', 'uae'],
  ['Spain', 'United Arab Emirates'],
  ['ES · JP/KR/TH/SG/FR/US/AU Country CLOSED 七模板', 'AE · JP/KR/TH/SG/FR/US/AU/ES Country CLOSED 八模板'],
  ['cms-spain-content-qa.cjs', 'cms-uae-content-qa.cjs'],
  ['CMS-SPAIN-CONTENT-QA', 'CMS-UAE-CONTENT-QA'],
  ['CMS-ES-COUNTRY', 'CMS-AE-COUNTRY'],
  ['cms-es-poi-pilot-waves.cjs', 'cms-ae-poi-pilot-waves.cjs'],
  ['cms-es-country-runtime.cjs', 'cms-ae-country-runtime.cjs'],
  ['buildEsPilotWaves', 'buildAePilotWaves'],
  ['buildSpainContentQa', 'buildUaeContentQa'],
  ['buildSpainBacklog', 'buildUaeBacklog'],
  ['assertEsTemplateCountriesClosed', 'assertAeTemplateCountriesClosed'],
  ['assessSpainCountry', 'assessUaeCountry'],
  ['assessSpainCountryRuntimeConsumer', 'assessUaeCountryRuntimeConsumer'],
  ['ES_CITY_DISPLAY_ORDER', 'AE_CITY_DISPLAY_ORDER'],
  ['ES_COUNTRY_CRITERIA', 'AE_COUNTRY_CRITERIA'],
  ['ES_CITIES', 'AE_CITIES'],
  ['ES_CITY_QA_EVIDENCE_TOKEN', 'AE_CITY_QA_EVIDENCE_TOKEN'],
  ['validateEsCityExitChecks', 'validateAeCityExitChecks'],
  ['validateEsCityContentQaClosures', 'validateAeCityContentQaClosures'],
  ['validateEsCityExecutionClosures', 'validateAeCityExecutionClosures'],
  ['validateCatalogApiAllEsPois', 'validateCatalogApiAllAePois'],
  ['validateSpainAmbient', 'validateUaeAmbient'],
  ['validateEsLockRegistryUnchanged', 'validateAeLockRegistryUnchanged'],
  ['validateEsScopeLock', 'validateAeScopeLock'],
  ['cms_es_country_runtime_audit.v1', 'cms_ae_country_runtime_audit.v1'],
  ['cms_es_country_closure.v1', 'cms_ae_country_closure.v1'],
  ['cms_es_poi_catalog_scope_lock.v1', 'cms_ae_poi_catalog_scope_lock.v1'],
  ['cms_es_poi_pilot_wave.v1', 'cms_ae_poi_pilot_wave.v1'],
  ['cms_es_poi_wave_kickoff.v1', 'cms_ae_poi_wave_kickoff.v1'],
  ['cms_spain_content_qa.v1', 'cms_uae_content_qa.v1'],
  ['TT_CMS_ES_COUNTRY', 'TT_CMS_AE_COUNTRY'],
  ['TT_CMS_ES_CONTENT_QA', 'TT_CMS_AE_CONTENT_QA'],
  ['TT_CMS_ES_COUNTRY_RUNTIME', 'TT_CMS_AE_COUNTRY_RUNTIME'],
  ['TT_CMS_ES_POI', 'TT_CMS_AE_POI'],
  ['ES_COUNTRY_RUNTIME_PASS', 'AE_COUNTRY_RUNTIME_PASS'],
  ['es-country', 'ae-country'],
  ['es_poi_runtime_exit_aggregate', 'ae_poi_runtime_exit_aggregate'],
  ['catalog_api_es_poi', 'catalog_api_ae_poi'],
  ['spain_ambient_runtime', 'uae_ambient_runtime'],
  ['es_lock_guard', 'ae_lock_guard'],
  ['es_lock_registry_unchanged', 'ae_lock_registry_unchanged'],
  ['es_scope_lock', 'ae_scope_lock'],
  ['es_scope', 'ae_scope'],
  ['es_denominator', 'ae_denominator'],
  ['es_active', 'ae_active'],
  ['es_barcelona_execution', 'ae_abu_dhabi_execution'],
  ['es_country_runtime', 'ae_country_runtime'],
  ['barcelona_pilot', 'abu_dhabi_pilot'],
  ['bcnRows', 'auhRows'],
  ['barcelona_closed', 'abu_dhabi_closed'],
  ['BARCELONA_CLOSED', 'ABU_DHABI_CLOSED'],
  ['Spain Country', 'UAE Country'],
  ['西班牙', '阿联酋'],
  ['Spain L5', 'UAE L5'],
  ['spain_status', 'uae_status'],
  ['isSpainScopedImage', 'isUaeScopedImage'],
  ['home_es', 'home_ae'],
  ['market_es_poi', 'market_ae_poi'],
  ['catalogSpainAmbientUrl', 'catalogUaeAmbientUrl'],
  ['esOnly', 'aeOnly'],
  ['ES · 三城', 'AE · 三城'],
  ['三城 ES LOCK', '三城 AE LOCK'],
  ['country_iso=ES', 'country_iso=AE'],
  ["country_iso: 'ES'", "country_iso: 'AE'"],
  ['PH-ES-', 'PH-AE-'],
  ['run-cms-es-', 'run-cms-ae-'],
  ['run-cms-spain-', 'run-cms-uae-'],
  ['abort ES kickoff', 'abort AE kickoff'],
  ["'巴塞罗那', '马德里', '塞维利亚'", "'阿布扎比', '迪拜', '沙迦'"],
  ['巴塞罗那 → 马德里 → 塞维利亚', '阿布扎比 → 迪拜 → 沙迦'],
  ['巴塞罗那 CLOSED', '阿布扎比 CLOSED'],
  ['巴塞罗那', '阿布扎比'],
  ['Barcelona', 'Abu Dhabi'],
  ['BARCELONA', 'ABU_DHABI'],
  ['barcelona', 'abu-dhabi'],
  ['马德里', '迪拜'],
  ['Madrid', 'Dubai'],
  ['MADRID', 'DUBAI'],
  ['madrid', 'dubai'],
  ['塞维利亚', '沙迦'],
  ['Seville', 'Sharjah'],
  ['SEVILLE', 'SHARJAH'],
  ['seville', 'sharjah'],
  ['WAVE_8_ES_PILOT', 'WAVE_9_AE_PILOT'],
  ['POI-WAVE-8-ES-PILOT', 'POI-WAVE-9-AE-PILOT'],
  ['ES_CITY_ORDER', 'AE_CITY_ORDER'],
  ['esRows', 'aeRows'],
  ['esByCity', 'aeByCity'],
  ['probeBarcelonaCatalog', 'probeAbuDhabiCatalog'],
  ['run-cms-barcelona-content-qa-wave.cjs', 'run-cms-abu-dhabi-content-qa-wave.cjs'],
  ['ES Country Runtime', 'AE Country Runtime'],
  ['ES POI Catalog Scope Lock', 'AE POI Catalog Scope Lock'],
  ['ES_COUNTRY_CLOSED', 'AE_COUNTRY_CLOSED'],
  ['Spain Country CLOSED', 'UAE Country CLOSED'],
  ['Spain Country Runtime Audit', 'UAE Country Runtime Audit'],
  ['Spain Country Runtime', 'UAE Country Runtime'],
  ['spain|es\\b|barcelona|madrid|seville|西班牙|巴塞罗那|马德里|塞维利亚|圣家堂|tapas', 'uae|ae\\b|abu.?dhabi|dubai|sharjah|阿联酋|阿布扎比|迪拜|沙迦|哈利法塔|沙威玛'],
  ['AU 24 LOCK', 'AU 24 · ES 24 LOCK'],
  ['run-cms-es-poi-catalog-scope-lock', 'run-cms-ae-poi-catalog-scope-lock'],
  ['CMS-ES-POI', 'CMS-AE-POI'],
  ['es_scope_lock:', 'ae_scope_lock:'],
  ['TT_CMS_ES_POI', 'TT_CMS_AE_POI'],
  ['TT_CMS_ES_POI_CATALOG_SCOPE_LOCK', 'TT_CMS_AE_POI_CATALOG_SCOPE_LOCK'],
  ['TT_CMS_ES_POI_DENOMINATOR_TOTAL', 'TT_CMS_AE_POI_DENOMINATOR_TOTAL'],
  ['TT_CMS_ES_POI_PILOT_ACCEPTANCE', 'TT_CMS_AE_POI_PILOT_ACCEPTANCE'],
  ['TT_CMS_ES_POI_NEXT_STAGE', 'TT_CMS_AE_POI_NEXT_STAGE'],
  ['TT_CMS_ES_POI_WAVE', 'TT_CMS_AE_POI_WAVE'],
  ['ES Scope Lock', 'AE Scope Lock'],
  ['ES LOCK: 24/24', 'AE LOCK: 24/24'],
  ['三城 ES', '三城 AE'],
  ['Catalog API ES POI', 'Catalog API AE POI'],
  ['ES POI Runtime', 'AE POI Runtime'],
];

function replaceAll(s) {
  let out = s;
  for (const [a, b] of PAIRS) out = out.split(a).join(b);
  return out;
}

function copyTransform(src, dst) {
  fs.writeFileSync(path.join(DEV, dst), replaceAll(fs.readFileSync(path.join(DEV, src), 'utf8')));
}

// libs
copyTransform('lib/cms-spain-content-qa.cjs', 'lib/cms-uae-content-qa.cjs');
copyTransform('lib/cms-es-poi-pilot-waves.cjs', 'lib/cms-ae-poi-pilot-waves.cjs');
copyTransform('lib/cms-es-country-runtime.cjs', 'lib/cms-ae-country-runtime.cjs');

// uae content qa — add ES template closure
let uaeQa = fs.readFileSync(path.join(DEV, 'lib/cms-uae-content-qa.cjs'), 'utf8');
if (!uaeQa.includes('ES_COUNTRY_CLOSURE')) {
  uaeQa = uaeQa.replace(
    "const AU_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json');",
    "const AU_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json');\nconst ES_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json');",
  );
  uaeQa = uaeQa.replace(
    "    ['AU', AU_COUNTRY_CLOSURE, 'TT_CMS_AU_COUNTRY'],\n  ])",
    "    ['AU', AU_COUNTRY_CLOSURE, 'TT_CMS_AU_COUNTRY'],\n    ['ES', ES_COUNTRY_CLOSURE, 'TT_CMS_ES_COUNTRY'],\n  ])",
  );
  uaeQa = uaeQa.replace(
    "      { country_iso: 'AU', closure_ssot: 'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json' },\n    ],",
    "      { country_iso: 'AU', closure_ssot: 'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json' },\n      { country_iso: 'ES', closure_ssot: 'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json' },\n    ],",
  );
  uaeQa = uaeQa.replace(
    "active_city: registry?.active_city || { country_iso: 'AE', city_zh: '阿布扎比' }",
    "active_city: registry?.active_city || { country_iso: 'AE', city_zh: '阿布扎比' }",
  );
  uaeQa = uaeQa.replace(
    "template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU']",
    "template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES']",
  );
}
fs.writeFileSync(path.join(DEV, 'lib/cms-uae-content-qa.cjs'), uaeQa);

// country runtime — add validateEsLockRegistryUnchanged if missing
let aeRt = fs.readFileSync(path.join(DEV, 'lib/cms-ae-country-runtime.cjs'), 'utf8');
aeRt = aeRt.replace(
  `const AE_CITY_QA_EVIDENCE_TOKEN = {
  阿布扎比: 'ABU_DHABI',
  迪拜: 'DUBAI',
  沙迦: 'SHARJAH',
};`,
  `const AE_CITY_QA_EVIDENCE_TOKEN = {
  阿布扎比: 'ABU_DHABI',
  迪拜: 'DUBAI',
  沙迦: 'SHARJAH',
};`,
);
if (!aeRt.includes('function validateEsLockRegistryUnchanged()')) {
  aeRt = aeRt.replace(
    'function validateAuLockRegistryUnchanged() {',
    `const ES_CITIES_GUARD = ['巴塞罗那', '马德里', '塞维利亚'];
function validateEsLockRegistryUnchanged() {
  const issues = [];
  const rows = [];
  for (const cityZh of ES_CITIES_GUARD) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      rows.push({ matrix_id: matrixId, city_zh: cityZh, state: a.state, replace_count: a.replace_count });
      if (a.state !== 'LOCKED') issues.push(\`\${matrixId}: ES lock changed\`);
      if (a.replace_count !== 1) issues.push(\`\${matrixId}: ES replace_count=\${a.replace_count}\`);
    }
  }
  return { id: 'es_lock_registry_unchanged', label: '西班牙三城 LOCK 资产未改动 (24/24)', pass: issues.length === 0, locked_count: rows.filter((r) => r.state === 'LOCKED').length, total: rows.length, rows, issues };
}
function validateAuLockRegistryUnchanged() {`,
  );
}
if (!aeRt.includes('validateEsLockRegistryUnchanged,')) {
  aeRt = aeRt.replace('validateAuLockRegistryUnchanged,', 'validateAuLockRegistryUnchanged,\n  validateEsLockRegistryUnchanged,');
}
aeRt = aeRt.replace(
  "es_scope_lock: path.join(ROOT, 'evidence/GO_cms_operation/CMS-ES-POI-CATALOG-SCOPE-LOCK-LATEST.json')",
  "ae_scope_lock: path.join(ROOT, 'evidence/GO_cms_operation/CMS-AE-POI-CATALOG-SCOPE-LOCK-LATEST.json')",
);
aeRt = aeRt.replace('CMS-ES-POI-CATALOG-SCOPE-LOCK-LATEST.json missing', 'CMS-AE-POI-CATALOG-SCOPE-LOCK-LATEST.json missing');
aeRt = aeRt.replace(/ES scope poi_total/g, 'AE scope poi_total');
aeRt = aeRt.replace(/ES scope city_count/g, 'AE scope city_count');
aeRt = aeRt.replace(/TT_CMS_ES_POI_CATALOG_SCOPE_LOCK/g, 'TT_CMS_AE_POI_CATALOG_SCOPE_LOCK');
fs.writeFileSync(path.join(DEV, 'lib/cms-ae-country-runtime.cjs'), aeRt);

// country scripts
copyTransform('run-cms-es-country-runtime-audit.cjs', 'run-cms-ae-country-runtime-audit.cjs');
copyTransform('run-cms-es-country-closure-evidence.cjs', 'run-cms-ae-country-closure-evidence.cjs');
copyTransform('run-cms-spain-content-qa.cjs', 'run-cms-uae-content-qa.cjs');
copyTransform('run-cms-es-poi-catalog-scope-lock.cjs', 'run-cms-ae-poi-catalog-scope-lock.cjs');

// scope lock — ES closure + ES lock guard
let scope = fs.readFileSync(path.join(DEV, 'run-cms-ae-poi-catalog-scope-lock.cjs'), 'utf8');
scope = scope.replace(
  "  AU: path.join(ROOT, 'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json'),\n};",
  "  AU: path.join(ROOT, 'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json'),\n  ES: path.join(ROOT, 'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json'),\n};",
);
scope = scope.replace(
  "  assertCountryClosed(CLOSURES.AU, 'TT_CMS_AU_COUNTRY');\n  assertPriorLocksUntouched();",
  "  assertCountryClosed(CLOSURES.AU, 'TT_CMS_AU_COUNTRY');\n  assertCountryClosed(CLOSURES.ES, 'TT_CMS_ES_COUNTRY');\n  assertPriorLocksUntouched();",
);
scope = scope.replace(
  "    AU: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-AU-') && a.state === 'LOCKED').length,\n  };",
  "    AU: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-AU-') && a.state === 'LOCKED').length,\n    ES: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-ES-') && a.state === 'LOCKED').length,\n  };",
);
scope = scope.replace(
  "  if (counts.AU !== 24) throw new Error(`AU LOCK drift: ${counts.AU}/24 — abort`);",
  "  if (counts.AU !== 24) throw new Error(`AU LOCK drift: ${counts.AU}/24 — abort`);\n  if (counts.ES !== 24) throw new Error(`ES LOCK drift: ${counts.ES}/24 — abort`);",
);
scope = scope.replace(
  "      au_locked_required: 24,\n      verified: true,",
  "      au_locked_required: 24,\n      es_locked_required: 24,\n      verified: true,",
);
scope = scope.replace(
  "      { country_iso: 'AU', TT_CMS_AU_COUNTRY: 'CLOSED' },\n    ],",
  "      { country_iso: 'AU', TT_CMS_AU_COUNTRY: 'CLOSED' },\n      { country_iso: 'ES', TT_CMS_ES_COUNTRY: 'CLOSED' },\n    ],",
);
scope = scope.replace(
  "  console.log(`JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 · AU 24 LOCK unchanged`);",
  "  console.log(`JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 · AU 24 · ES 24 LOCK unchanged`);",
);
scope = scope.replace('const bcn = getCityPilot', 'const auh = getCityPilot');
scope = scope.replace('bcn.', 'auh.');
scope = scope.replace('barcelona_pilot', 'abu_dhabi_pilot');
scope = scope.replace('probeBarcelonaCatalog', 'probeAbuDhabiCatalog');
scope = scope.replace("city_zh: '巴塞罗那'", "city_zh: '阿布扎比'");
scope = scope.replace("city_en: 'Barcelona'", "city_en: 'Abu Dhabi'");
scope = scope.replace('CMS-ES-POI', 'CMS-AE-POI');
scope = scope.replace(/country_iso === 'ES'/g, "country_iso === 'AE'");
scope = scope.replace(
  "template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU']",
  "template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES']",
);
scope = scope.replace(
  "        template: 'JP + KR + TH + SG + FR + US + AU Golden Template'",
  "        template: 'JP + KR + TH + SG + FR + US + AU + ES Golden Template'",
);
scope = scope.replace('不得修改 JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 · AU 24 LOCK', '不得修改 JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 · AU 24 · ES 24 LOCK');
fs.writeFileSync(path.join(DEV, 'run-cms-ae-poi-catalog-scope-lock.cjs'), scope);

// ae pilot waves
let aeWaves = fs.readFileSync(path.join(DEV, 'lib/cms-ae-poi-pilot-waves.cjs'), 'utf8');
aeWaves = aeWaves.replace(
  "    'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json',\n  ],",
  "    'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json',\n    'evidence/GO_cms_operation/CMS-ES-COUNTRY-CLOSURE-LATEST.json',\n  ],",
);
aeWaves = aeWaves.replace(
  "    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU'],",
  "    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES'],",
);
aeWaves = aeWaves.replace(
  "      { stage: 'au_country', status: 'CLOSED', ssot: 'CMS-AU-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'ae_scope', status: 'LOCKED' },",
  "      { stage: 'au_country', status: 'CLOSED', ssot: 'CMS-AU-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'es_country', status: 'CLOSED', ssot: 'CMS-ES-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'ae_scope', status: 'LOCKED' },",
);
aeWaves = aeWaves.replace(/rowsForCountry\(rows, 'ES'\)/g, "rowsForCountry(rows, 'AE')");
aeWaves = aeWaves.replace(/rowsForCountryCity\(rows, 'ES'/g, "rowsForCountryCity(rows, 'AE'");
fs.writeFileSync(path.join(DEV, 'lib/cms-ae-poi-pilot-waves.cjs'), aeWaves);

// city scripts from barcelona template
const cities = [
  { zh: '阿布扎比', en: 'Abu Dhabi', slug: 'abu-dhabi', token: 'ABU_DHABI' },
  { zh: '迪拜', en: 'Dubai', slug: 'dubai', token: 'DUBAI' },
  { zh: '沙迦', en: 'Sharjah', slug: 'sharjah', token: 'SHARJAH' },
];
for (const c of cities) {
  const fromPairs = [
    ['barcelona', c.slug],
    ['Barcelona', c.en],
    ['BARCELONA', c.token],
    ['巴塞罗那', c.zh],
    ['cms_barcelona_', `cms_${c.slug.replace(/-/g, '_')}_`],
    ['TT_CMS_BARCELONA_', `TT_CMS_${c.token}_`],
  ];
  const transform = (src, dst) => {
    let t = fs.readFileSync(path.join(DEV, src), 'utf8');
    for (const [a, b] of fromPairs) t = t.split(a).join(b);
    t = replaceAll(t);
    fs.writeFileSync(path.join(DEV, dst), t);
  };
  transform('run-cms-barcelona-content-qa-wave.cjs', `run-cms-${c.slug}-content-qa-wave.cjs`);
  transform('run-cms-poi-city-barcelona-closure-evidence.cjs', `run-cms-poi-city-${c.slug}-closure-evidence.cjs`);
  transform('run-cms-poi-city-barcelona-content-qa-closure-evidence.cjs', `run-cms-poi-city-${c.slug}-content-qa-closure-evidence.cjs`);
  transform('run-cms-poi-city-barcelona-content-qa-exit-check.cjs', `run-cms-poi-city-${c.slug}-content-qa-exit-check.cjs`);
}

for (const slug of ['abu-dhabi', 'dubai', 'sharjah']) {
  const p = path.join(DEV, `run-cms-poi-city-${slug}-closure-evidence.cjs`);
  let t = fs.readFileSync(p, 'utf8');
  t = t.replace(/country_iso=ES/g, 'country_iso=AE');
  t = t.replace("active_country: { country_iso: 'ES'", "active_country: { country_iso: 'AE'");
  t = t.replace('POI City Closure Evidence · ES ·', 'POI City Closure Evidence · AE ·');
  t = t.replace('label: `ES ·', 'label: `AE ·');
  t = t.replace('CMS-ES-POI', 'CMS-AE-POI');
  fs.writeFileSync(p, t);
  const qa = path.join(DEV, `run-cms-poi-city-${slug}-content-qa-closure-evidence.cjs`);
  let q = fs.readFileSync(qa, 'utf8');
  q = q.replace("country_iso: 'ES'", "country_iso: 'AE'");
  q = q.replace('cms-spain-content-qa.cjs', 'cms-uae-content-qa.cjs');
  q = q.replace('buildSpainContentQa', 'buildUaeContentQa');
  fs.writeFileSync(qa, q);
  const ex = path.join(DEV, `run-cms-poi-city-${slug}-content-qa-exit-check.cjs`);
  let e = fs.readFileSync(ex, 'utf8');
  e = e.replace(/country_iso=ES/g, 'country_iso=AE');
  e = e.replace('TT_CMS_ES_COUNTRY', 'TT_CMS_AE_COUNTRY');
  e = e.replace('cms-spain-content-qa.cjs', 'cms-uae-content-qa.cjs');
  e = e.replace('buildSpainContentQa', 'buildUaeContentQa');
  e = e.replace('西班牙', '阿联酋');
  fs.writeFileSync(ex, e);
}

// ae country closure fixes
let aeCl = fs.readFileSync(path.join(DEV, 'run-cms-ae-country-closure-evidence.cjs'), 'utf8');
aeCl = aeCl.replace(
  "const AU_CITIES_GUARD = ['悉尼', '墨尔本', '黄金海岸'];",
  "const AU_CITIES_GUARD = ['悉尼', '墨尔本', '黄金海岸'];\nconst ES_CITIES_GUARD = ['巴塞罗那', '马德里', '塞维利亚'];",
);
aeCl = aeCl.replace(
  "issues.push(...assertLocksUnchanged(ES_CITIES, 'ES'));\n  issues.push(...assertLocksUnchanged(AU_CITIES_GUARD, 'AU'));",
  "issues.push(...assertLocksUnchanged(AE_CITIES, 'AE'));\n  issues.push(...assertLocksUnchanged(ES_CITIES_GUARD, 'ES'));\n  issues.push(...assertLocksUnchanged(AU_CITIES_GUARD, 'AU'));",
);
aeCl = aeCl.replace('es_lock_guard: { required: 24', 'ae_lock_guard: { required: 24');
aeCl = aeCl.replace('ES LOCK: 24/24', 'AE LOCK: 24/24');
aeCl = aeCl.replace("'JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU'", "'JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES'");
fs.writeFileSync(path.join(DEV, 'run-cms-ae-country-closure-evidence.cjs'), aeCl);

console.log('AE bootstrap complete');
