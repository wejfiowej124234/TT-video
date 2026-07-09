#!/usr/bin/env node
/**
 * One-shot AU CMS track bootstrap from US templates · delete after run
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const DEV = path.join(__dirname);

const HERO_ROTATION = [
  'ocs-paris-art-official-guide-cover.jpg',
  'ocs-paris-art-community-media.jpg',
  'ocs-paris-art-community-cover.jpg',
  'ocs-paris-art-provider-cover.jpg',
  'ocs-paris-art-guide-avatar.jpg',
  'ocs-paris-art-official-guide-cover.jpg',
  'ocs-paris-art-community-media.jpg',
  'ocs-paris-art-community-cover.jpg',
];

const AU_CITIES = [
  {
    city_zh: '悉尼',
    city_en: 'Sydney',
    slug: 'sydney',
    script_slug: 'sydney',
    qa_token: 'SYDNEY',
    matrix_ids: [
      'PH-AU-184-ATR', 'PH-AU-185-ATR', 'PH-AU-186-ATR', 'PH-AU-187-ATR',
      'PH-AU-188-FOOD', 'PH-AU-189-FOOD', 'PH-AU-190-FOOD', 'PH-AU-191-FOOD',
    ],
    pois: ['歌剧院', '海港大桥', '邦迪海滩', '岩石区', '海鲜', 'brunch', '咖啡', '牛排'],
  },
  {
    city_zh: '墨尔本',
    city_en: 'Melbourne',
    slug: 'melbourne',
    script_slug: 'melbourne',
    qa_token: 'MELBOURNE',
    matrix_ids: [
      'PH-AU-176-ATR', 'PH-AU-177-ATR', 'PH-AU-178-ATR', 'PH-AU-179-ATR',
      'PH-AU-180-FOOD', 'PH-AU-181-FOOD', 'PH-AU-182-FOOD', 'PH-AU-183-FOOD',
    ],
    pois: ['联邦广场', '大洋路', '涂鸦巷', '菲利普岛', 'brunch', '咖啡', '多元料理', '海鲜'],
  },
  {
    city_zh: '黄金海岸',
    city_en: 'Gold Coast',
    slug: 'gold-coast',
    script_slug: 'gold-coast',
    qa_token: 'GOLD_COAST',
    loop_dir: 'gold coast',
    loop_base: 'GOLD COAST',
    matrix_ids: [
      'PH-AU-168-ATR', 'PH-AU-169-ATR', 'PH-AU-170-ATR', 'PH-AU-171-ATR',
      'PH-AU-172-FOOD', 'PH-AU-173-FOOD', 'PH-AU-174-FOOD', 'PH-AU-175-FOOD',
    ],
    pois: ['冲浪者天堂', '梦幻世界', '可伦宾', 'Q1', '海鲜', '牛排', 'brunch', '咖啡'],
  },
];

function heroFiles(matrixIds) {
  const o = {};
  matrixIds.forEach((id, i) => { o[id] = HERO_ROTATION[i % HERO_ROTATION.length]; });
  return o;
}

function replaceAll(s, pairs) {
  let out = s;
  for (const [a, b] of pairs) out = out.split(a).join(b);
  return out;
}

function genFromSf(srcRel, dstRel, pairs) {
  const t = fs.readFileSync(path.join(DEV, srcRel), 'utf8');
  fs.writeFileSync(path.join(DEV, dstRel), replaceAll(t, pairs));
}

// --- lib: australia content qa ---
let usaQa = fs.readFileSync(path.join(DEV, 'lib/cms-usa-content-qa.cjs'), 'utf8');
usaQa = replaceAll(usaQa, [
  ['USA L5 Content QA', 'Australia L5 Content QA'],
  ['US · JP + KR + TH + SG + FR Country CLOSED 五模板', 'AU · JP/KR/TH/SG/FR/US Country CLOSED 六模板'],
  ['CMS-USA-CONTENT-QA-LATEST.json', 'CMS-AUSTRALIA-CONTENT-QA-LATEST.json'],
  ['CMS-US-COUNTRY-RUNTIME-AUDIT-LATEST.json', 'CMS-AU-COUNTRY-RUNTIME-AUDIT-LATEST.json'],
  ['US_CITY_DISPLAY_ORDER', 'AU_CITY_DISPLAY_ORDER'],
  ['US_COUNTRY_CRITERIA', 'AU_COUNTRY_CRITERIA'],
  ['assertUsTemplateCountriesClosed', 'assertAuTemplateCountriesClosed'],
  ['assessUsCountryRuntimeConsumer', 'assessAuCountryRuntimeConsumer'],
  ['assessUsCountry', 'assessAuCountry'],
  ['buildUsaBacklog', 'buildAustraliaBacklog'],
  ['buildUsaContentQa', 'buildAustraliaContentQa'],
  ['US_COUNTRY_CLOSURE', 'AU_COUNTRY_CLOSURE'],
  ["country_iso: 'US'", "country_iso: 'AU'"],
  ["country_zh: '美国'", "country_zh: '澳大利亚'"],
  ['TT_CMS_US_COUNTRY', 'TT_CMS_AU_COUNTRY'],
  ['TT_CMS_US_CONTENT_QA', 'TT_CMS_AU_CONTENT_QA'],
  ['cms_usa_content_qa.v1', 'cms_australia_content_qa.v1'],
  ['USA Country Runtime', 'Australia Country Runtime'],
  ['USA Country Runtime audit', 'Australia Country Runtime audit'],
  ['四城', '三城'],
  ['/4 cities', '/3 cities'],
  ["'旧金山', '拉斯维加斯', '洛杉矶', '纽约'", "'悉尼', '墨尔本', '黄金海岸'"],
  ['PH-US-', 'PH-AU-'],
  ['CMS-US-COUNTRY-RUNTIME', 'CMS-AU-COUNTRY-RUNTIME'],
  ['run-cms-us-country-runtime-audit.cjs', 'run-cms-au-country-runtime-audit.cjs'],
  ['US Country Runtime audit', 'AU Country Runtime audit'],
]);
usaQa += `
const US_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json');
`;
// fix template guard to include US
usaQa = usaQa.replace(
  "    ['FR', FR_COUNTRY_CLOSURE, 'TT_CMS_FR_COUNTRY'],\n  ])",
  "    ['FR', FR_COUNTRY_CLOSURE, 'TT_CMS_FR_COUNTRY'],\n    ['US', US_COUNTRY_CLOSURE, 'TT_CMS_US_COUNTRY'],\n  ])",
);
usaQa = usaQa.replace(
  "      { country_iso: 'FR', closure_ssot: 'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json' },\n    ],",
  "      { country_iso: 'FR', closure_ssot: 'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json' },\n      { country_iso: 'US', closure_ssot: 'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json' },\n    ],",
);
usaQa = usaQa.replace(
  "CITY_PILOTS[zh]?.country_iso === 'US'",
  "CITY_PILOTS[zh]?.country_iso === 'AU'",
);
usaQa = usaQa.replace(
  "active_city: registry?.active_city || { country_iso: 'US', city_zh: '旧金山' }",
  "active_city: registry?.active_city || { country_iso: 'AU', city_zh: '悉尼' }",
);
fs.writeFileSync(path.join(DEV, 'lib/cms-australia-content-qa.cjs'), usaQa);

// --- lib: au pilot waves ---
let usWaves = fs.readFileSync(path.join(DEV, 'lib/cms-us-poi-pilot-waves.cjs'), 'utf8');
usWaves = replaceAll(usWaves, [
  ['US', 'AU'],
  ['美国', '澳大利亚'],
  ['旧金山', '悉尼'],
  ['WAVE_6_US_PILOT', 'WAVE_7_AU_PILOT'],
  ['POI-WAVE-6-US-PILOT', 'POI-WAVE-7-AU-PILOT'],
  ['buildUsPilotWaves', 'buildAuPilotWaves'],
  ['US_CITY_ORDER', 'AU_CITY_ORDER'],
  ['usRows', 'auRows'],
  ['us_country_total', 'au_country_total'],
  ['us_cities', 'au_cities'],
  ['us_denominator', 'au_denominator'],
  ['san_francisco_pilot', 'sydney_pilot'],
  ['sfRows', 'sydRows'],
  ['wave6', 'wave7'],
  ["'旧金山', '拉斯维加斯', '洛杉矶', '纽约'", "'悉尼', '墨尔本', '黄金海岸'"],
  ['CMS-US-COUNTRY-CLOSURE', 'CMS-AU-COUNTRY-CLOSURE'],
  ['us_scope', 'au_scope'],
  ['us_san_francisco_execution', 'au_sydney_execution'],
  ['us_country_runtime', 'au_country_runtime'],
  ['TT_CMS_US_COUNTRY', 'TT_CMS_AU_COUNTRY'],
  ['bulk_ingest_us_all', 'bulk_ingest_au_all'],
  ['skip_pilot_before_next_city', 'skip_pilot_before_next_city'],
]);
usWaves = usWaves.replace(
  "    'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json',\n  ],",
  "    'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json',\n    'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json',\n  ],",
);
usWaves = usWaves.replace(
  "    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR'],",
  "    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US'],",
);
usWaves = usWaves.replace(
  "      { stage: 'fr_country', status: 'CLOSED', ssot: 'CMS-FR-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'us_scope', status: 'LOCKED' },",
  "      { stage: 'fr_country', status: 'CLOSED', ssot: 'CMS-FR-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'us_country', status: 'CLOSED', ssot: 'CMS-US-COUNTRY-CLOSURE-LATEST.json' },\n      { stage: 'au_scope', status: 'LOCKED' },",
);
fs.writeFileSync(path.join(DEV, 'lib/cms-au-poi-pilot-waves.cjs'), usWaves);

// --- lib: au country runtime ---
let usRt = fs.readFileSync(path.join(DEV, 'lib/cms-us-country-runtime.cjs'), 'utf8');
usRt = replaceAll(usRt, [
  ['USA Country Runtime', 'Australia Country Runtime'],
  ['US_CITIES', 'AU_CITIES'],
  ['CMS-US-COUNTRY-RUNTIME-AUDIT-LATEST.json', 'CMS-AU-COUNTRY-RUNTIME-AUDIT-LATEST.json'],
  ['CMS-US-COUNTRY-CLOSURE-LATEST.json', 'CMS-AU-COUNTRY-CLOSURE-LATEST.json'],
  ['CMS-USA-CONTENT-QA-LATEST.json', 'CMS-AUSTRALIA-CONTENT-QA-LATEST.json'],
  ['CMS-US-POI-CATALOG-SCOPE-LOCK-LATEST.json', 'CMS-AU-POI-CATALOG-SCOPE-LOCK-LATEST.json'],
  ['validateUsCityExitChecks', 'validateAuCityExitChecks'],
  ['validateUsCityContentQaClosures', 'validateAuCityContentQaClosures'],
  ['validateUsCityExecutionClosures', 'validateAuCityExecutionClosures'],
  ['validateCatalogApiAllUsPois', 'validateCatalogApiAllAuPois'],
  ['validateUsaAmbient', 'validateAustraliaAmbient'],
  ['validateUsLockRegistryUnchanged', 'validateAuLockRegistryUnchanged'],
  ['validateUsScopeLock', 'validateAuScopeLock'],
  ['US_CITY_QA_EVIDENCE_TOKEN', 'AU_CITY_QA_EVIDENCE_TOKEN'],
  ["'旧金山', '拉斯维加斯', '洛杉矶', '纽约'", "'悉尼', '墨尔本', '黄金海岸'"],
  ['四城', '三城'],
  ['33 POI / 4 cities', '24 POI / 3 cities'],
  ['poi_total !== 33', 'poi_total !== 24'],
  ['cityCount !== 4', 'cityCount !== 3'],
  ['us_denominator', 'au_denominator'],
  ['TT_CMS_US_POI_CATALOG_SCOPE_LOCK', 'TT_CMS_AU_POI_CATALOG_SCOPE_LOCK'],
  ['us_scope_lock', 'au_scope_lock'],
  ['us_lock_registry_unchanged', 'au_lock_registry_unchanged'],
  ['四城 US LOCK 资产 (33/33)', '三城 AU LOCK 资产 (24/24)'],
  ['us_lock_guard', 'au_lock_guard'],
  ['required: 33', 'required: 24'],
  ['country_iso=US', 'country_iso=AU'],
  ['美国 Ambient', '澳大利亚 Ambient'],
  ['by_iso?.US', 'by_iso?.AU'],
  ['usa_ambient_runtime', 'australia_ambient_runtime'],
  ['catalog_api_us_poi', 'catalog_api_au_poi'],
  ['us_poi_runtime_exit_aggregate', 'au_poi_runtime_exit_aggregate'],
  ['PH-US-', 'PH-AU-'],
]);
usRt = usRt.replace(
  `const US_CITY_QA_EVIDENCE_TOKEN = {
  旧金山: 'SAN_FRANCISCO',
  拉斯维加斯: 'LAS_VEGAS',
  洛杉矶: 'LOS_ANGELES',
  纽约: 'NEW_YORK',
};`,
  `const AU_CITY_QA_EVIDENCE_TOKEN = {
  悉尼: 'SYDNEY',
  墨尔本: 'MELBOURNE',
  黄金海岸: 'GOLD_COAST',
};`,
);
usRt = usRt.replace(
  '  return US_CITY_QA_EVIDENCE_TOKEN[cityZh] || cityEvidenceToken(cityZh);',
  '  return AU_CITY_QA_EVIDENCE_TOKEN[cityZh] || cityEvidenceToken(cityZh);',
);
usRt += `
function validateUsLockRegistryUnchanged() {
  const issues = [];
  const rows = [];
  const US_CITIES_GUARD = ['旧金山', '拉斯维加斯', '洛杉矶', '纽约'];
  for (const cityZh of US_CITIES_GUARD) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      rows.push({ matrix_id: matrixId, city_zh: cityZh, state: a.state, replace_count: a.replace_count });
      if (a.state !== 'LOCKED') issues.push(\`\${matrixId}: US lock changed\`);
      if (a.replace_count !== 1) issues.push(\`\${matrixId}: US replace_count=\${a.replace_count}\`);
      if (a.unlock_reason) issues.push(\`\${matrixId}: US unlock_reason set\`);
    }
  }
  return {
    id: 'us_lock_registry_unchanged',
    label: '美国四城 LOCK 资产未改动 (33/33)',
    pass: issues.length === 0,
    locked_count: rows.filter((r) => r.state === 'LOCKED').length,
    total: rows.length,
    rows,
    issues,
  };
}
`;
usRt = usRt.replace(
  '  validateAuLockRegistryUnchanged,',
  '  validateAuLockRegistryUnchanged,\n  validateUsLockRegistryUnchanged,',
);
fs.writeFileSync(path.join(DEV, 'lib/cms-au-country-runtime.cjs'), usRt);

// --- country scripts ---
genFromSf('run-cms-us-country-runtime-audit.cjs', 'run-cms-au-country-runtime-audit.cjs', [
  ['USA Country Runtime Audit', 'Australia Country Runtime Audit'],
  ['cms-us-country-runtime.cjs', 'cms-au-country-runtime.cjs'],
  ['CMS-US-COUNTRY-RUNTIME', 'CMS-AU-COUNTRY-RUNTIME'],
  ['US_COUNTRY_RUNTIME_PASS', 'AU_COUNTRY_RUNTIME_PASS'],
  ['TT_CMS_US_COUNTRY_RUNTIME', 'TT_CMS_AU_COUNTRY_RUNTIME'],
  ['us-country', 'au-country'],
  ['美国', '澳大利亚'],
  ['法国', '澳大利亚'],
  ['home_usa', 'home_au'],
  ['market_fr_poi', 'market_au_poi'],
  ['isUsaScopedImage', 'isAustraliaScopedImage'],
  ['catalogUsaAmbientUrl', 'catalogAustraliaAmbientUrl'],
  ['usa|us\\b|san francisco', 'australia|au\\b|sydney|melbourne|gold coast'],
  ['traveltrust.cms_us_country_runtime_audit.v1', 'traveltrust.cms_au_country_runtime_audit.v1'],
  ['us_lock_guard', 'au_lock_guard'],
  ['fr_lock_guard', 'fr_lock_guard'],
  ['US POI Runtime', 'AU POI Runtime'],
  ['四城', '三城'],
  ['validateUsLockRegistryUnchanged', 'validateUsLockRegistryUnchanged'],
]);
genFromSf('run-cms-us-country-closure-evidence.cjs', 'run-cms-au-country-closure-evidence.cjs', [
  ['USA Country CLOSED', 'Australia Country CLOSED'],
  ['cms-usa-content-qa.cjs', 'cms-australia-content-qa.cjs'],
  ['cms-us-country-runtime.cjs', 'cms-au-country-runtime.cjs'],
  ['buildUsaContentQa', 'buildAustraliaContentQa'],
  ['US_CITY_DISPLAY_ORDER', 'AU_CITY_DISPLAY_ORDER'],
  ['US_CITIES', 'AU_CITIES'],
  ['CMS-US-COUNTRY', 'CMS-AU-COUNTRY'],
  ['TT_CMS_US_COUNTRY', 'TT_CMS_AU_COUNTRY'],
  ['TT_CMS_US_CONTENT_QA', 'TT_CMS_AU_CONTENT_QA'],
  ['CMS-USA-CONTENT-QA', 'CMS-AUSTRALIA-CONTENT-QA'],
  ['usa_content_qa_ssot', 'australia_content_qa_ssot'],
  ['traveltrust.cms_us_country_closure.v1', 'traveltrust.cms_au_country_closure.v1'],
  ['US_COUNTRY_CLOSED', 'AU_COUNTRY_CLOSED'],
  ['us_country_runtime_pass', 'au_country_runtime_pass'],
  ['us_lock_registry_unchanged', 'au_lock_registry_unchanged'],
  ['us_lock_guard', 'au_lock_guard'],
  ['四城', '三城'],
  ['four_city', 'three_city'],
  ["country_iso: 'US'", "country_iso: 'AU'"],
  ["country_zh: '美国'", "country_zh: '澳大利亚'"],
  ['city_count: 4', 'city_count: 3'],
  ['required: 33', 'required: 24'],
  ['US LOCK: 33/33', 'AU LOCK: 24/24'],
  ['/4', '/3'],
  ["'JP', 'KR', 'TH', 'SG', 'FR'", "'JP', 'KR', 'TH', 'SG', 'FR', 'US'"],
]);
genFromSf('run-cms-usa-content-qa.cjs', 'run-cms-australia-content-qa.cjs', [
  ['USA L5 Content QA', 'Australia L5 Content QA'],
  ['cms-usa-content-qa.cjs', 'cms-australia-content-qa.cjs'],
  ['buildUsaContentQa', 'buildAustraliaContentQa'],
  ['CMS-USA-CONTENT-QA', 'CMS-AUSTRALIA-CONTENT-QA'],
  ['TT_CMS_US_CONTENT_QA', 'TT_CMS_AU_CONTENT_QA'],
  ['TT_CMS_US_COUNTRY', 'TT_CMS_AU_COUNTRY'],
  ['/4 cities', '/3 cities'],
]);

// scope lock from US
let scopeLock = fs.readFileSync(path.join(DEV, 'run-cms-us-poi-catalog-scope-lock.cjs'), 'utf8');
scopeLock = replaceAll(scopeLock, [
  ['US POI Catalog Scope Lock', 'AU POI Catalog Scope Lock'],
  ['TT_CMS_JP/KR/TH/SG/FR_COUNTRY: CLOSED', 'TT_CMS_JP/KR/TH/SG/FR/US_COUNTRY: CLOSED'],
  ['FR 24 LOCK', 'FR 24 · US 33 LOCK'],
  ['cms-us-poi-pilot-waves.cjs', 'cms-au-poi-pilot-waves.cjs'],
  ['buildUsPilotWaves', 'buildAuPilotWaves'],
  ['CMS-US-POI', 'CMS-AU-POI'],
  ['CMS-US-POI-WAVE-KICKOFF', 'CMS-AU-POI-WAVE-KICKOFF'],
  ['probeSfCatalog', 'probeSydneyCatalog'],
  ['旧金山', '悉尼'],
  ['san_francisco_pilot', 'sydney_pilot'],
  ['usRows', 'auRows'],
  ['usByCity', 'auByCity'],
  ['us_denominator', 'au_denominator'],
  ['traveltrust.cms_us_poi_catalog_scope_lock.v1', 'traveltrust.cms_au_poi_catalog_scope_lock.v1'],
  ['TT_CMS_US_POI', 'TT_CMS_AU_POI'],
  ['usa_status', 'australia_status'],
  ['cms-usa-content-qa.cjs', 'cms-australia-content-qa.cjs'],
  ['buildUsaContentQa', 'buildAustraliaContentQa'],
  ['CMS-USA-CONTENT-QA', 'CMS-AUSTRALIA-CONTENT-QA'],
  ['4 cities', '3 cities'],
  ['旧金山 → 拉斯维加斯 → 洛杉矶 → 纽约', '悉尼 → 墨尔本 → 黄金海岸'],
  ['US Country Runtime', 'AU Country Runtime'],
  ['TT_CMS_US_COUNTRY', 'TT_CMS_AU_COUNTRY'],
  ['run-cms-san-francisco-content-qa-wave.cjs', 'run-cms-sydney-content-qa-wave.cjs'],
  ['abort US kickoff', 'abort AU kickoff'],
]);
scopeLock = scopeLock.replace(
  "  FR: path.join(ROOT, 'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json'),\n};",
  "  FR: path.join(ROOT, 'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json'),\n  US: path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json'),\n};",
);
scopeLock = scopeLock.replace(
  '  assertCountryClosed(CLOSURES.FR, \'TT_CMS_FR_COUNTRY\');\n  assertPriorLocksUntouched();',
  '  assertCountryClosed(CLOSURES.FR, \'TT_CMS_FR_COUNTRY\');\n  assertCountryClosed(CLOSURES.US, \'TT_CMS_US_COUNTRY\');\n  assertPriorLocksUntouched();',
);
scopeLock = scopeLock.replace(
  "    FR: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-FR-') && a.state === 'LOCKED').length,\n  };",
  "    FR: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-FR-') && a.state === 'LOCKED').length,\n    US: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-US-') && a.state === 'LOCKED').length,\n  };",
);
scopeLock = scopeLock.replace(
  '  if (counts.FR !== 24) throw new Error(`FR LOCK drift: ${counts.FR}/24 — abort`);',
  '  if (counts.FR !== 24) throw new Error(`FR LOCK drift: ${counts.FR}/24 — abort`);\n  if (counts.US !== 33) throw new Error(`US LOCK drift: ${counts.US}/33 — abort`);',
);
scopeLock = scopeLock.replace(
  "        active_country: { country_iso: 'US', country_zh: '美国', status: 'ACTIVE' },\n        active_city: { country_iso: 'US', city_zh: '旧金山', city_en: 'San Francisco', status: 'ACTIVE' },",
  "        active_country: { country_iso: 'AU', country_zh: '澳大利亚', status: 'ACTIVE' },\n        active_city: { country_iso: 'AU', city_zh: '悉尼', city_en: 'Sydney', status: 'ACTIVE' },",
);
scopeLock = scopeLock.replace(
  "        template_countries: ['JP', 'KR', 'TH', 'SG', 'FR'],",
  "        template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US'],",
);
scopeLock = scopeLock.replace(
  "        us_scope_lock:",
  "        au_scope_lock:",
);
scopeLock = scopeLock.replace(
  "      fr_locked_required: 24,\n      verified: true,",
  "      fr_locked_required: 24,\n      us_locked_required: 33,\n      verified: true,",
);
scopeLock = scopeLock.replace(
  "      { country_iso: 'FR', TT_CMS_FR_COUNTRY: 'CLOSED' },\n    ],",
  "      { country_iso: 'FR', TT_CMS_FR_COUNTRY: 'CLOSED' },\n      { country_iso: 'US', TT_CMS_US_COUNTRY: 'CLOSED' },\n    ],",
);
scopeLock = scopeLock.replace(
  "    country: { country_iso: 'US', country_zh: '美国' },",
  "    country: { country_iso: 'AU', country_zh: '澳大利亚' },",
);
scopeLock = scopeLock.replace(
  "  const usRows = scope.rows.filter((r) => r.country_iso === 'US');",
  "  const auRows = scope.rows.filter((r) => r.country_iso === 'AU');",
);
scopeLock = scopeLock.replace(
  "  const sf = getCityPilot('旧金山');",
  "  const syd = getCityPilot('悉尼');",
);
scopeLock = scopeLock.replace(
  '  const sfRows = rowsForCountryCity(rows, \'US\', \'旧金山\');',
  '  const sydRows = rowsForCountryCity(rows, \'AU\', \'悉尼\');',
);
scopeLock = scopeLock.replace(/sf\./g, 'syd.');
scopeLock = scopeLock.replace(
  "  console.log(`JP 41 · KR 31 · TH 28 · SG 10 · FR 24 LOCK unchanged`);",
  "  console.log(`JP 41 · KR 31 · TH 28 · SG 10 · FR 24 · US 33 LOCK unchanged`);",
);
fs.writeFileSync(path.join(DEV, 'run-cms-au-poi-catalog-scope-lock.cjs'), scopeLock);

// per-city scripts
for (const c of AU_CITIES) {
  const pairs = [
    ['旧金山', c.city_zh],
    ['San Francisco', c.city_en],
    ['SAN_FRANCISCO', c.qa_token],
    ['san-francisco', c.script_slug],
    ['san francisco', c.loop_dir || c.slug],
    ['SAN FRANCISCO', c.loop_base || c.city_en.toUpperCase()],
    ['cms_san-francisco_content_qa_wave', `cms_${c.script_slug}_content_qa_wave`],
    ['TT_CMS_SAN_FRANCISCO_CONTENT_QA_WAVE', `TT_CMS_${c.qa_token}_CONTENT_QA_WAVE`],
  ];
  genFromSf('run-cms-san-francisco-content-qa-wave.cjs', `run-cms-${c.script_slug}-content-qa-wave.cjs`, pairs);
  genFromSf('run-cms-poi-city-san-francisco-closure-evidence.cjs', `run-cms-poi-city-${c.script_slug}-closure-evidence.cjs`, [
    ...pairs,
    ['US · 旧金山', `AU · ${c.city_zh}`],
    ['san_francisco_city_closure', `${c.script_slug.replace(/-/g, '_')}_city_closure`],
    ['san_francisco_closed', `${c.script_slug.replace(/-/g, '_')}_closed`],
    ['SAN_FRANCISCO_CLOSED', `${c.qa_token}_CLOSED`],
    ['US_CITY_PILOT_ACTIVE', 'AU_CITY_PILOT_ACTIVE'],
    ['CMS-US-POI', 'CMS-AU-POI'],
    ['TT_CMS_US_POI_WAVE', 'TT_CMS_AU_POI_WAVE'],
    ['after: \'旧金山 CLOSED\'', `after: '${c.city_zh} CLOSED'`],
    ['POI-US-CITY', 'POI-AU-CITY'],
  ]);
  genFromSf('run-cms-poi-city-san-francisco-content-qa-closure-evidence.cjs', `run-cms-poi-city-${c.script_slug}-content-qa-closure-evidence.cjs`, [
    ...pairs,
    ['cms-usa-content-qa.cjs', 'cms-australia-content-qa.cjs'],
    ['buildUsaContentQa', 'buildAustraliaContentQa'],
  ]);
  genFromSf('run-cms-poi-city-san-francisco-content-qa-exit-check.cjs', `run-cms-poi-city-${c.script_slug}-content-qa-exit-check.cjs`, [
    ...pairs,
    ['San Francisco Content QA Exit Check', `${c.city_en} Content QA Exit Check`],
    ['san-francisco', c.script_slug],
    ['country_iso: \'US\'', "country_iso: 'AU'"],
    ['cms-usa-content-qa.cjs', 'cms-australia-content-qa.cjs'],
    ['buildUsaContentQa', 'buildAustraliaContentQa'],
    ['美国', '澳大利亚'],
  ]);
}

console.log('AU bootstrap scripts written');
