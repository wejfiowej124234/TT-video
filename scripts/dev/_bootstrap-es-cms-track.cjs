#!/usr/bin/env node
/** ES CMS track bootstrap from AU templates */
const fs = require('fs');
const path = require('path');

const DEV = path.join(__dirname);

const PAIRS = [
  ['Australia', 'Spain'],
  ['AU · JP/KR/TH/SG/FR/US Country CLOSED 六模板', 'ES · JP/KR/TH/SG/FR/US/AU Country CLOSED 七模板'],
  ['AU · JP/KR/TH/SG/FR/US Country CLOSED 六模板', 'ES · JP/KR/TH/SG/FR/US/AU Country CLOSED 七模板'],
  ['cms-australia-content-qa.cjs', 'cms-spain-content-qa.cjs'],
  ['CMS-AUSTRALIA-CONTENT-QA', 'CMS-SPAIN-CONTENT-QA'],
  ['CMS-AU-COUNTRY', 'CMS-ES-COUNTRY'],
  ['cms-au-poi-pilot-waves.cjs', 'cms-es-poi-pilot-waves.cjs'],
  ['cms-au-country-runtime.cjs', 'cms-es-country-runtime.cjs'],
  ['buildAuPilotWaves', 'buildEsPilotWaves'],
  ['buildAustraliaContentQa', 'buildSpainContentQa'],
  ['buildAustraliaBacklog', 'buildSpainBacklog'],
  ['assertAuTemplateCountriesClosed', 'assertEsTemplateCountriesClosed'],
  ['assessAuCountry', 'assessSpainCountry'],
  ['assessAuCountryRuntimeConsumer', 'assessSpainCountryRuntimeConsumer'],
  ['AU_CITY_DISPLAY_ORDER', 'ES_CITY_DISPLAY_ORDER'],
  ['AU_COUNTRY_CRITERIA', 'ES_COUNTRY_CRITERIA'],
  ['AU_CITIES', 'ES_CITIES'],
  ['AU_CITY_QA_EVIDENCE_TOKEN', 'ES_CITY_QA_EVIDENCE_TOKEN'],
  ['validateAuCityExitChecks', 'validateEsCityExitChecks'],
  ['validateAuCityContentQaClosures', 'validateEsCityContentQaClosures'],
  ['validateAuCityExecutionClosures', 'validateEsCityExecutionClosures'],
  ['validateCatalogApiAllAuPois', 'validateCatalogApiAllEsPois'],
  ['validateAustraliaAmbient', 'validateSpainAmbient'],
  ['validateAuLockRegistryUnchanged', 'validateEsLockRegistryUnchanged'],
  ['validateAuScopeLock', 'validateEsScopeLock'],
  ['validateUsLockRegistryUnchanged', 'validateUsLockRegistryUnchanged'],
  ['validateAuLockRegistryUnchanged', 'validateAuLockRegistryUnchanged'],
  ['cms_au_country_runtime_audit.v1', 'cms_es_country_runtime_audit.v1'],
  ['cms_au_country_closure.v1', 'cms_es_country_closure.v1'],
  ['cms_au_poi_catalog_scope_lock.v1', 'cms_es_poi_catalog_scope_lock.v1'],
  ['cms_au_poi_pilot_wave.v1', 'cms_es_poi_pilot_wave.v1'],
  ['cms_au_poi_wave_kickoff.v1', 'cms_es_poi_wave_kickoff.v1'],
  ['cms_australia_content_qa.v1', 'cms_spain_content_qa.v1'],
  ['TT_CMS_AU_COUNTRY', 'TT_CMS_ES_COUNTRY'],
  ['TT_CMS_AU_CONTENT_QA', 'TT_CMS_ES_CONTENT_QA'],
  ['TT_CMS_AU_COUNTRY_RUNTIME', 'TT_CMS_ES_COUNTRY_RUNTIME'],
  ['TT_CMS_AU_POI', 'TT_CMS_ES_POI'],
  ['AU_COUNTRY_RUNTIME_PASS', 'ES_COUNTRY_RUNTIME_PASS'],
  ['au-country', 'es-country'],
  ['au_poi_runtime_exit_aggregate', 'es_poi_runtime_exit_aggregate'],
  ['catalog_api_au_poi', 'catalog_api_es_poi'],
  ['australia_ambient_runtime', 'spain_ambient_runtime'],
  ['au_lock_guard', 'es_lock_guard'],
  ['au_lock_registry_unchanged', 'es_lock_registry_unchanged'],
  ['au_scope_lock', 'es_scope_lock'],
  ['au_scope', 'es_scope'],
  ['au_denominator', 'es_denominator'],
  ['au_active', 'es_active'],
  ['au_sydney_execution', 'es_barcelona_execution'],
  ['au_country_runtime', 'es_country_runtime'],
  ['sydney_pilot', 'barcelona_pilot'],
  ['sydRows', 'bcnRows'],
  ['sydney_closed', 'barcelona_closed'],
  ['SYDNEY_CLOSED', 'BARCELONA_CLOSED'],
  ['Australia Country', 'Spain Country'],
  ['澳大利亚', '西班牙'],
  ['Australia L5', 'Spain L5'],
  ['australia_status', 'spain_status'],
  ['isAustraliaScopedImage', 'isSpainScopedImage'],
  ['isAustraliaScopedImage', 'isSpainScopedImage'],
  ['home_au', 'home_es'],
  ['market_au_poi', 'market_es_poi'],
  ['catalogAustraliaAmbientUrl', 'catalogSpainAmbientUrl'],
  ['auOnly', 'esOnly'],
  ['AU · 三城', 'ES · 三城'],
  ['三城 AU LOCK', '三城 ES LOCK'],
  ['country_iso=AU', 'country_iso=ES'],
  ["country_iso: 'AU'", "country_iso: 'ES'"],
  ['PH-AU-', 'PH-ES-'],
  ['run-cms-au-', 'run-cms-es-'],
  ['run-cms-australia-', 'run-cms-spain-'],
  ['_monitor-au', '_monitor-es'],
  ['abort AU kickoff', 'abort ES kickoff'],
  ["'悉尼', '墨尔本', '黄金海岸'", "'巴塞罗那', '马德里', '塞维利亚'"],
  ['悉尼 → 墨尔本 → 黄金海岸', '巴塞罗那 → 马德里 → 塞维利亚'],
  ['悉尼 CLOSED', '巴塞罗那 CLOSED'],
  ['悉尼', '巴塞罗那'],
  ['Sydney', 'Barcelona'],
  ['SYDNEY', 'BARCELONA'],
  ['sydney', 'barcelona'],
  ['墨尔本', '马德里'],
  ['Melbourne', 'Madrid'],
  ['MELBOURNE', 'MADRID'],
  ['melbourne', 'madrid'],
  ['黄金海岸', '塞维利亚'],
  ['Gold Coast', 'Seville'],
  ['GOLD_COAST', 'SEVILLE'],
  ['gold-coast', 'seville'],
  ['gold coast', 'seville'],
  ['GOLD COAST', 'SEVILLE'],
  ['WAVE_7_AU_PILOT', 'WAVE_8_ES_PILOT'],
  ['POI-WAVE-7-AU-PILOT', 'POI-WAVE-8-ES-PILOT'],
  ['buildAuPilotWaves', 'buildEsPilotWaves'],
  ['AU_CITY_ORDER', 'ES_CITY_ORDER'],
  ['auRows', 'esRows'],
  ['auByCity', 'esByCity'],
  ['probeSydneyCatalog', 'probeBarcelonaCatalog'],
  ['run-cms-sydney-content-qa-wave.cjs', 'run-cms-barcelona-content-qa-wave.cjs'],
  ['AU Country Runtime', 'ES Country Runtime'],
  ['AU POI Catalog Scope Lock', 'ES POI Catalog Scope Lock'],
  ['AU_COUNTRY_CLOSED', 'ES_COUNTRY_CLOSED'],
  ['Australia Country CLOSED', 'Spain Country CLOSED'],
  ['Australia Country Runtime Audit', 'Spain Country Runtime Audit'],
  ['Australia Country Runtime', 'Spain Country Runtime'],
  ['australia|au\\b|sydney|melbourne|gold coast|澳大利亚|悉尼|墨尔本|黄金海岸', 'spain|es\\b|barcelona|madrid|seville|西班牙|巴塞罗那|马德里|塞维利亚|圣家堂|tapas'],
  ['US 33 LOCK', 'US 33 · AU 24 LOCK'],
  ['fr_locked_required: 24', 'fr_locked_required: 24'],
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
copyTransform('lib/cms-australia-content-qa.cjs', 'lib/cms-spain-content-qa.cjs');
copyTransform('lib/cms-au-poi-pilot-waves.cjs', 'lib/cms-es-poi-pilot-waves.cjs');
copyTransform('lib/cms-au-country-runtime.cjs', 'lib/cms-es-country-runtime.cjs');

// fix spain content qa template guard - add AU
let spainQa = fs.readFileSync(path.join(DEV, 'lib/cms-spain-content-qa.cjs'), 'utf8');
if (!spainQa.includes('AU_COUNTRY_CLOSURE')) {
  spainQa = spainQa.replace(
    'const US_COUNTRY_CLOSURE = path.join(ROOT, \'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json\');',
    'const US_COUNTRY_CLOSURE = path.join(ROOT, \'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json\');\nconst AU_COUNTRY_CLOSURE = path.join(ROOT, \'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json\');',
  );
  spainQa = spainQa.replace(
    "    ['US', US_COUNTRY_CLOSURE, 'TT_CMS_US_COUNTRY'],\n  ])",
    "    ['US', US_COUNTRY_CLOSURE, 'TT_CMS_US_COUNTRY'],\n    ['AU', AU_COUNTRY_CLOSURE, 'TT_CMS_AU_COUNTRY'],\n  ])",
  );
  spainQa = spainQa.replace(
    "      { country_iso: 'US', closure_ssot: 'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json' },\n    ],",
    "      { country_iso: 'US', closure_ssot: 'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json' },\n      { country_iso: 'AU', closure_ssot: 'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json' },\n    ],",
  );
  spainQa = spainQa.replace(
    "active_city: registry?.active_city || { country_iso: 'ES', city_zh: '巴塞罗那' }",
    "active_city: registry?.active_city || { country_iso: 'ES', city_zh: '巴塞罗那' }",
  );
}
fs.writeFileSync(path.join(DEV, 'lib/cms-spain-content-qa.cjs'), spainQa);

// country runtime ES tokens
let esRt = fs.readFileSync(path.join(DEV, 'lib/cms-es-country-runtime.cjs'), 'utf8');
esRt = esRt.replace(
  `const ES_CITY_QA_EVIDENCE_TOKEN = {
  巴塞罗那: 'BARCELONA',
  马德里: 'MADRID',
  塞维利亚: 'SEVILLE',
};`,
  `const ES_CITY_QA_EVIDENCE_TOKEN = {
  巴塞罗那: 'BARCELONA',
  马德里: 'MADRID',
  塞维利亚: 'SEVILLE',
};`,
);
// Add validateAuLockRegistryUnchanged if missing after transform
if (!esRt.includes('function validateAuLockRegistryUnchanged()')) {
  esRt = esRt.replace(
    'function validateUsLockRegistryUnchanged() {',
    `const AU_CITIES_GUARD = ['悉尼', '墨尔本', '黄金海岸'];
function validateAuLockRegistryUnchanged() {
  const issues = [];
  const rows = [];
  for (const cityZh of AU_CITIES_GUARD) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      rows.push({ matrix_id: matrixId, city_zh: cityZh, state: a.state, replace_count: a.replace_count });
      if (a.state !== 'LOCKED') issues.push(\`\${matrixId}: AU lock changed\`);
      if (a.replace_count !== 1) issues.push(\`\${matrixId}: AU replace_count=\${a.replace_count}\`);
    }
  }
  return { id: 'au_lock_registry_unchanged', label: '澳大利亚三城 LOCK 资产未改动 (24/24)', pass: issues.length === 0, locked_count: rows.filter((r) => r.state === 'LOCKED').length, total: rows.length, rows, issues };
}
function validateUsLockRegistryUnchanged() {`,
  );
}
if (!esRt.includes('validateAuLockRegistryUnchanged,')) {
  esRt = esRt.replace('validateUsLockRegistryUnchanged,', 'validateUsLockRegistryUnchanged,\n  validateAuLockRegistryUnchanged,');
}
fs.writeFileSync(path.join(DEV, 'lib/cms-es-country-runtime.cjs'), esRt);

// country scripts
copyTransform('run-cms-au-country-runtime-audit.cjs', 'run-cms-es-country-runtime-audit.cjs');
copyTransform('run-cms-au-country-closure-evidence.cjs', 'run-cms-es-country-closure-evidence.cjs');
copyTransform('run-cms-australia-content-qa.cjs', 'run-cms-spain-content-qa.cjs');
copyTransform('run-cms-au-poi-catalog-scope-lock.cjs', 'run-cms-es-poi-catalog-scope-lock.cjs');

// fix scope lock AU closure + counts
let scope = fs.readFileSync(path.join(DEV, 'run-cms-es-poi-catalog-scope-lock.cjs'), 'utf8');
scope = scope.replace(
  "  US: path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json'),\n};",
  "  US: path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json'),\n  AU: path.join(ROOT, 'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json'),\n};",
);
scope = scope.replace(
  "  assertCountryClosed(CLOSURES.US, 'TT_CMS_US_COUNTRY');\n  assertPriorLocksUntouched();",
  "  assertCountryClosed(CLOSURES.US, 'TT_CMS_US_COUNTRY');\n  assertCountryClosed(CLOSURES.AU, 'TT_CMS_AU_COUNTRY');\n  assertPriorLocksUntouched();",
);
scope = scope.replace(
  "    US: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-US-') && a.state === 'LOCKED').length,\n  };",
  "    US: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-US-') && a.state === 'LOCKED').length,\n    AU: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-AU-') && a.state === 'LOCKED').length,\n  };",
);
scope = scope.replace(
  "  if (counts.US !== 33) throw new Error(`US LOCK drift: ${counts.US}/33 — abort`);",
  "  if (counts.US !== 33) throw new Error(`US LOCK drift: ${counts.US}/33 — abort`);\n  if (counts.AU !== 24) throw new Error(`AU LOCK drift: ${counts.AU}/24 — abort`);",
);
scope = scope.replace(
  "      us_locked_required: 33,\n      verified: true,",
  "      us_locked_required: 33,\n      au_locked_required: 24,\n      verified: true,",
);
scope = scope.replace(
  "      { country_iso: 'US', TT_CMS_US_COUNTRY: 'CLOSED' },\n    ],",
  "      { country_iso: 'US', TT_CMS_US_COUNTRY: 'CLOSED' },\n      { country_iso: 'AU', TT_CMS_AU_COUNTRY: 'CLOSED' },\n    ],",
);
scope = scope.replace(
  "  console.log(`JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 LOCK unchanged`);",
  "  console.log(`JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 · AU 24 LOCK unchanged`);",
);
scope = scope.replace('const bcn = getCityPilot', 'const bcn = getCityPilot');
scope = scope.replace('const syd = getCityPilot', 'const bcn = getCityPilot');
scope = scope.replace('syd.', 'bcn.');
fs.writeFileSync(path.join(DEV, 'run-cms-es-poi-catalog-scope-lock.cjs'), scope);

// es pilot waves template countries
let esWaves = fs.readFileSync(path.join(DEV, 'lib/cms-es-poi-pilot-waves.cjs'), 'utf8');
esWaves = esWaves.replace(
  "    'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json',\n  ],",
  "    'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json',\n    'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json',\n  ],",
);
esWaves = esWaves.replace(
  "    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US'],",
  "    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU'],",
);
esWaves = esWaves.replace(
  "      { stage: 'us_country', status: 'CLOSED', ssot: 'CMS-US-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'es_scope', status: 'LOCKED' },",
  "      { stage: 'us_country', status: 'CLOSED', ssot: 'CMS-US-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'au_country', status: 'CLOSED', ssot: 'CMS-AU-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'es_scope', status: 'LOCKED' },",
);
fs.writeFileSync(path.join(DEV, 'lib/cms-es-poi-pilot-waves.cjs'), esWaves);

// city scripts from barcelona template (sydney)
const cities = [
  { zh: '巴塞罗那', en: 'Barcelona', slug: 'barcelona', token: 'BARCELONA' },
  { zh: '马德里', en: 'Madrid', slug: 'madrid', token: 'MADRID' },
  { zh: '塞维利亚', en: 'Seville', slug: 'seville', token: 'SEVILLE' },
];
for (const c of cities) {
  const fromPairs = [
    ['sydney', c.slug],
    ['Sydney', c.en],
    ['SYDNEY', c.token],
    ['悉尼', c.zh],
    ['cms_sydney_', `cms_${c.slug}_`],
    ['TT_CMS_SYDNEY_', `TT_CMS_${c.token}_`],
  ];
  const transform = (src, dst) => {
    let t = fs.readFileSync(path.join(DEV, src), 'utf8');
    for (const [a, b] of fromPairs) t = t.split(a).join(b);
    t = replaceAll(t);
    fs.writeFileSync(path.join(DEV, dst), t);
  };
  transform('run-cms-sydney-content-qa-wave.cjs', `run-cms-${c.slug}-content-qa-wave.cjs`);
  transform('run-cms-poi-city-sydney-closure-evidence.cjs', `run-cms-poi-city-${c.slug}-closure-evidence.cjs`);
  transform('run-cms-poi-city-sydney-content-qa-closure-evidence.cjs', `run-cms-poi-city-${c.slug}-content-qa-closure-evidence.cjs`);
  transform('run-cms-poi-city-sydney-content-qa-exit-check.cjs', `run-cms-poi-city-${c.slug}-content-qa-exit-check.cjs`);
}

// closure script fix country_iso ES
for (const slug of ['barcelona', 'madrid', 'seville']) {
  const p = path.join(DEV, `run-cms-poi-city-${slug}-closure-evidence.cjs`);
  let t = fs.readFileSync(p, 'utf8');
  t = t.replace(/country_iso=US/g, 'country_iso=ES');
  t = t.replace("active_country: { country_iso: 'US'", "active_country: { country_iso: 'ES'");
  t = t.replace('POI City Closure Evidence · US ·', 'POI City Closure Evidence · ES ·');
  t = t.replace('label: `US ·', 'label: `ES ·');
  fs.writeFileSync(p, t);
  const qa = path.join(DEV, `run-cms-poi-city-${slug}-content-qa-closure-evidence.cjs`);
  let q = fs.readFileSync(qa, 'utf8');
  q = q.replace("country_iso: 'US'", "country_iso: 'ES'");
  q = q.replace('cms-australia-content-qa.cjs', 'cms-spain-content-qa.cjs');
  q = q.replace('buildAustraliaContentQa', 'buildSpainContentQa');
  fs.writeFileSync(qa, q);
  const ex = path.join(DEV, `run-cms-poi-city-${slug}-content-qa-exit-check.cjs`);
  let e = fs.readFileSync(ex, 'utf8');
  e = e.replace(/country_iso=US/g, 'country_iso=ES');
  e = e.replace('TT_CMS_AU_COUNTRY', 'TT_CMS_ES_COUNTRY');
  e = e.replace('cms-australia-content-qa.cjs', 'cms-spain-content-qa.cjs');
  e = e.replace('buildAustraliaContentQa', 'buildSpainContentQa');
  e = e.replace('美国', '西班牙');
  fs.writeFileSync(ex, e);
}

// es country closure fixes
let esCl = fs.readFileSync(path.join(DEV, 'run-cms-es-country-closure-evidence.cjs'), 'utf8');
esCl = esCl.replace('assertLocksUnchanged(AU_CITIES, \'AU\')', 'assertLocksUnchanged(AU_CITIES_GUARD, \'AU\')');
esCl = esCl.replace(
  "const US_CITIES = ['旧金山', '拉斯维加斯', '洛杉矶', '纽约'];",
  "const US_CITIES = ['旧金山', '拉斯维加斯', '洛杉矶', '纽约'];\nconst AU_CITIES_GUARD = ['悉尼', '墨尔本', '黄金海岸'];",
);
esCl = esCl.replace(
  "issues.push(...assertLocksUnchanged(AU_CITIES, 'AU'));",
  "issues.push(...assertLocksUnchanged(ES_CITIES, 'ES'));\n  issues.push(...assertLocksUnchanged(AU_CITIES_GUARD, 'AU'));",
);
esCl = esCl.replace('au_lock_guard: { required: 24', 'es_lock_guard: { required: 24');
esCl = esCl.replace('AU LOCK: 24/24', 'ES LOCK: 24/24');
esCl = esCl.replace("'JP', 'KR', 'TH', 'SG', 'FR', 'US'", "'JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU'");
fs.writeFileSync(path.join(DEV, 'run-cms-es-country-closure-evidence.cjs'), esCl);

console.log('ES bootstrap complete');
