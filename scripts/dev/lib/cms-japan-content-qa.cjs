/**
 * Japan L5 Content QA · 阶段③ · 非 Execution · 非程序 Audit
 *
 * 国家顺序：Execution → Content QA → Country CLOSED
 * Execution CLOSED ≠ Content QA CLOSED
 */
const fs = require('fs');
const path = require('path');
const { CITY_PILOTS, readRegistry } = require('./cms-poi-city-pilot.cjs');
const { getAsset, countLockedForCity, loadStandard } = require('./cms-content-qa-asset-lock.cjs');

const ROOT = path.join(__dirname, '../../..');
const MATRIX = path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml');
const DENOM_LOCK = path.join(ROOT, 'evidence/GO_cms_operation/CMS-DENOMINATOR-LOCK-LATEST.json');
const VISUAL_GAP = path.join(ROOT, 'evidence/GO_cms_operation/CMS-L5-VISUAL-GAP-REPORT-LATEST.json');
const AMBIENT_WIRING = path.join(ROOT, 'evidence/GO_cms_operation/CMS-AMBIENT-RUNTIME-WIRING-LATEST.json');

const CMS_PHASES = {
  phase_1_system: {
    id: 'cms_system',
    label: 'CMS 系统',
    status: 'FROZEN',
    scope: ['Catalog', 'Runtime Wiring', 'Ownership', 'Matrix', 'Daily Board', 'Pipeline'],
    agent_rule: '禁止再投入架构',
  },
  phase_2_execution: {
    id: 'execution',
    label: 'Execution',
    status: 'SUBSTANTIALLY_COMPLETE',
    proven: ['Destination Ambient', 'JP 东京', 'JP 大阪', 'JP 京都', 'JP 札幌'],
    pipeline: ['Review', 'Publish', 'Verify', 'Evidence', 'Live'],
    agent_rule: '禁止因 Execution 重复劳动',
  },
  phase_3_content_qa: {
    id: 'content_qa',
    label: 'Content QA',
    status: 'ACTIVE',
    proves: '用户看到的是否 L5 · 内容准确性 · 图文/城市/国家一致',
    agent_rule: '当前真正工作轨 · 不叫 Audit',
  },
};

const COUNTRY_WORKFLOW = {
  order: ['execution', 'content_qa', 'country_closed'],
  forbidden: 'execution → next_country（跳过 Content QA）',
  template: 'Execution → Content QA → Country CLOSED → 下一国家',
  japan_ssot: 'evidence/GO_cms_operation/CMS-JAPAN-CONTENT-QA-LATEST.json',
  korea_starts_when: 'TT_CMS_JP_COUNTRY: CLOSED',
};

const CONTENT_QA_DIMENSIONS = [
  { id: 'execution', label: 'Execution', phase: 2, note: '已基本完成 · 仅作上下文 · 不重复劳动' },
  { id: 'cms_ownership', label: 'CMS Ownership', phase: 3 },
  { id: 'runtime_consumer', label: 'Runtime Consumer', phase: 3 },
  { id: 'geo_matching', label: 'Geo Matching', phase: 3 },
  { id: 'content_accuracy', label: 'Content Accuracy', phase: 3 },
  { id: 'l5_quality', label: 'L5 Quality', phase: 3 },
];

const CONTENT_ACCURACY_CHECKS = [
  { id: 'geo', label: 'Geo', example: '东京是不是东京' },
  { id: 'culture', label: 'Culture', example: '是否符合当地文化' },
  { id: 'landmark', label: 'Landmark', example: '地标是否正确', applies: 'attraction' },
  { id: 'food', label: 'Food', example: '美食是否属于当地', applies: 'food' },
  { id: 'hotel', label: 'Hotel', example: '酒店风格是否正确', applies: 'hotel' },
  { id: 'transport', label: 'Transport', example: '是否是当地交通', applies: 'transport' },
  { id: 'season', label: 'Season', example: '是否符合当地场景', optional: true },
];

const JP_CITY_DISPLAY_ORDER = ['东京', '大阪', '京都', '札幌', '福冈'];
const REMEDIATION_PRIORITY = [
  { rank: 1, city_zh: '大阪', reason: '逐项替换跨区图 → Content Accuracy PASS → Geo/L5 PASS' },
  { rank: 2, city_zh: '札幌', reason: '逐项替换跨区图 → Content Accuracy PASS → Geo/L5 PASS' },
  { rank: 3, city_zh: '东京', reason: '3 项跨区/错城图' },
  { rank: 4, city_zh: '京都', reason: '1 项跨区图' },
  { rank: 5, city_zh: '福冈', reason: 'Execution 完成后进入 Content QA' },
  { rank: 6, city_zh: null, reason: '重跑 Runtime QA → JP Country CLOSED' },
];

const FOREIGN_REGION = {
  sydney: '悉尼',
  seoul: '首尔',
  bangkok: '曼谷',
  singapore: '新加坡',
  paris: '巴黎',
  barcelona: '巴塞罗那',
  melbourne: '墨尔本',
  'nyc-skyline': '纽约',
  nyc: '纽约',
  dubai: '迪拜',
  beijing: '北京',
  shanghai: '上海',
};

const CITY_FILE_OK = {
  东京: ['tokyo-photo', 'tokyo'],
  大阪: ['osaka', '大阪'],
  京都: ['kyoto-culture', 'kyoto', '京都'],
  札幌: ['sapporo', '札幌', 'hokkaido', '北海道'],
  福冈: ['fukuoka', 'hakata', '福冈', '博多'],
  首尔: ['seoul', '首尔'],
  釜山: ['busan', '釜山'],
  济州: ['jeju', '济州'],
  仁川: ['incheon', '仁川'],
  曼谷: ['bangkok-temple', 'bangkok', '曼谷'],
  普吉: ['phuket-island', 'phuket', '普吉'],
  清迈: ['chiang-mai-temple', 'chiang-mai', 'chiang', '清迈'],
  新加坡: ['singapore-family', 'singapore', '新加坡'],
  巴黎: ['paris-art', 'paris', '巴黎'],
  里昂: ['paris-art', 'lyon', '里昂'],
  尼斯: ['paris-art', 'nice', '尼斯'],
  旧金山: ['paris-art', 'san-francisco', '旧金山'],
  拉斯维加斯: ['paris-art', 'las-vegas', '拉斯维加斯'],
  洛杉矶: ['paris-art', 'los-angeles', '洛杉矶'],
  纽约: ['paris-art', 'new-york', '纽约'],
  悉尼: ['paris-art', 'sydney', '悉尼'],
  墨尔本: ['paris-art', 'melbourne', '墨尔本'],
  黄金海岸: ['paris-art', 'gold-coast', '黄金海岸'],
  巴塞罗那: ['paris-art', 'barcelona', '巴塞罗那'],
  马德里: ['paris-art', 'madrid', '马德里'],
  塞维利亚: ['paris-art', 'seville', '塞维利亚'],
  阿布扎比: ['paris-art', 'abu-dhabi', '阿布扎比'],
  迪拜: ['paris-art', 'dubai', '迪拜'],
  沙迦: ['paris-art', 'sharjah', '沙迦'],
  北京: ['paris-art', 'beijing', '北京'],
  上海: ['paris-art', 'shanghai', '上海'],
  广州: ['paris-art', 'guangzhou', '广州'],
  成都: ['paris-art', 'chengdu', '成都'],
  杭州: ['paris-art', 'hangzhou', '杭州'],
  西安: ['paris-art', 'xian', '西安'],
  厦门: ['paris-art', 'xiamen', '厦门'],
  青岛: ['paris-art', 'qingdao', '青岛'],
  大理: ['paris-art', 'dali', '大理'],
};

const PEER_CITY_FN_TOKENS = {
  东京: ['tokyo-photo', 'tokyo'],
  大阪: ['osaka'],
  京都: ['kyoto-culture', 'kyoto'],
  札幌: ['sapporo', 'hokkaido'],
  福冈: ['fukuoka', 'hakata'],
  首尔: ['seoul'],
  釜山: ['busan'],
  济州: ['jeju'],
  仁川: ['incheon'],
  曼谷: ['bangkok-temple', 'bangkok'],
  普吉: ['phuket-island', 'phuket'],
  清迈: ['chiang-mai-temple', 'chiang-mai', 'chiang'],
  新加坡: ['singapore-family', 'singapore'],
  巴黎: ['paris-art', 'paris'],
  里昂: ['paris-art', 'lyon'],
  尼斯: ['paris-art', 'nice'],
  旧金山: ['paris-art', 'san-francisco'],
  拉斯维加斯: ['paris-art', 'las-vegas'],
  洛杉矶: ['paris-art', 'los-angeles'],
  纽约: ['paris-art', 'new-york'],
  悉尼: ['paris-art', 'sydney'],
  墨尔本: ['paris-art', 'melbourne'],
  黄金海岸: ['paris-art', 'gold-coast'],
  巴塞罗那: ['paris-art', 'barcelona'],
  马德里: ['paris-art', 'madrid'],
  塞维利亚: ['paris-art', 'seville'],
  阿布扎比: ['paris-art', 'abu-dhabi'],
  迪拜: ['paris-art', 'dubai'],
  沙迦: ['paris-art', 'sharjah'],
  北京: ['paris-art', 'beijing'],
  上海: ['paris-art', 'shanghai'],
  广州: ['paris-art', 'guangzhou'],
  成都: ['paris-art', 'chengdu'],
  杭州: ['paris-art', 'hangzhou'],
  西安: ['paris-art', 'xian'],
  厦门: ['paris-art', 'xiamen'],
  青岛: ['paris-art', 'qingdao'],
  大理: ['paris-art', 'dali'],
};

const JP_COUNTRY_CRITERIA = [
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

function parseMatrixRow(text, matrixId) {
  const blockRe = new RegExp(`  - matrix_id: ${matrixId}[\\s\\S]*?(?=\\n  - matrix_id:|\\nrows:|$)`);
  const block = text.match(blockRe)?.[0];
  if (!block) return null;
  const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
  return {
    matrix_id: matrixId,
    city_zh: get('city_zh'),
    legacy_value: get('legacy_value'),
    poi_type: get('poi_type'),
    copy_label: get('copy_label'),
    public_url: get('public_url'),
    current_source: get('current_source'),
    asset_lifecycle: get('asset_lifecycle'),
    matrix_row_status: get('matrix_row_status'),
  };
}

function filenameFromUrl(url) {
  return (url || '').split('/').pop()?.split('?')[0]?.toLowerCase() || '';
}

function detectForeignRegions(fn) {
  const hits = [];
  for (const [token, label] of Object.entries(FOREIGN_REGION)) {
    if (fn.includes(token)) hits.push({ token, label });
  }
  return hits;
}

function foreignBadForCity(cityZh, foreign) {
  return foreign.filter((f) => {
    if (cityZh === '京都' && f.token === 'kyoto-culture') return false;
    if (cityZh === '东京' && f.token === 'tokyo-photo') return false;
    if (cityZh === '首尔' && f.token === 'seoul') return false;
    if (cityZh === '曼谷' && f.token === 'bangkok') return false;
    if (cityZh === '新加坡' && f.token === 'singapore') return false;
    if (CITY_PILOTS[cityZh]?.country_iso === 'FR' && f.token === 'paris') return false;
    if (CITY_PILOTS[cityZh]?.country_iso === 'US' && f.token === 'paris') return false;
    if (CITY_PILOTS[cityZh]?.country_iso === 'AU' && f.token === 'paris') return false;
    if (CITY_PILOTS[cityZh]?.country_iso === 'ES' && f.token === 'paris') return false;
    if (CITY_PILOTS[cityZh]?.country_iso === 'AE' && f.token === 'paris') return false;
    if (CITY_PILOTS[cityZh]?.country_iso === 'CN' && f.token === 'paris') return false;
    return true;
  });
}

function cityFileAligned(cityZh, fn) {
  const ok = CITY_FILE_OK[cityZh] || [];
  return ok.some((t) => fn.includes(t));
}

function detectWrongPeerCity(cityZh, fn) {
  if (cityFileAligned(cityZh, fn)) return null;
  const currentPilot = CITY_PILOTS[cityZh];
  for (const [city, tokens] of Object.entries(PEER_CITY_FN_TOKENS)) {
    if (city === cityZh) continue;
    if (currentPilot && CITY_PILOTS[city]?.country_iso === currentPilot.country_iso) continue;
    if (tokens.some((t) => fn.includes(t))) return city;
  }
  return null;
}

function checkVerdict(pass, optional = false) {
  if (optional) return pass ? 'PASS' : 'OPTIONAL';
  return pass ? 'PASS' : 'FAIL';
}

function buildPoiAccuracyChecks(cityZh, row, fn, foreignBad, wrongJpCity, aligned) {
  const poiType = row.poi_type || 'attraction';
  const geoFail = !aligned || foreignBad.length > 0 || Boolean(wrongJpCity);
  const cultureFail = geoFail || Boolean(wrongJpCity) || foreignBad.length > 0;

  const checks = {
    geo: {
      verdict: checkVerdict(!geoFail),
      detail: geoFail
        ? wrongJpCity
          ? `图片暗示 ${wrongJpCity} ≠ ${cityZh}`
          : foreignBad.length
            ? `跨区：${foreignBad.map((f) => f.label).join('、')}`
            : '非当地文件名'
        : null,
    },
    culture: {
      verdict: checkVerdict(!cultureFail),
      detail: cultureFail ? '不符合当地文化 · 复用他国/他城素材' : null,
    },
    landmark: {
      verdict: poiType === 'attraction' ? checkVerdict(!geoFail) : 'N/A',
      detail: poiType === 'attraction' && geoFail ? '地标与页面文案不一致' : null,
    },
    food: {
      verdict: poiType === 'food' ? checkVerdict(!geoFail) : 'N/A',
      detail: poiType === 'food' && geoFail ? '美食不属于当地/图文不一致' : null,
    },
    hotel: { verdict: 'N/A', detail: null },
    transport: { verdict: 'N/A', detail: null },
    season: { verdict: 'OPTIONAL', detail: '待人工场景验收' },
  };
  return checks;
}

function rankLabel(n) {
  const circled = '①②③④⑤⑥⑦⑧⑨⑩';
  return n >= 1 && n <= circled.length ? circled[n - 1] : `${n}.`;
}

function formatCheckFlags(checks) {
  return CONTENT_ACCURACY_CHECKS.filter((c) => checks[c.id]?.verdict === 'FAIL').map((c) => `${c.label} ❌`);
}

function buildDetailedBacklog(cityZh, matrixRows, heroFiles) {
  const items = [];
  let rank = 0;
  for (const matrixId of Object.keys(heroFiles)) {
    const row = matrixRows.find((r) => r.matrix_id === matrixId) || { matrix_id: matrixId };
    const fn = filenameFromUrl(row.public_url || heroFiles[matrixId]);
    const foreign = detectForeignRegions(fn);
    const foreignBad = foreignBadForCity(cityZh, foreign);
    const aligned = cityFileAligned(cityZh, fn);
    const wrongPeerCity = detectWrongPeerCity(cityZh, fn);
    const hasIssue = !aligned || foreignBad.length > 0 || wrongPeerCity;
    if (!hasIssue) continue;

    rank += 1;
    const checks = buildPoiAccuracyChecks(cityZh, row, fn, foreignBad, wrongPeerCity, aligned);
    const failFlags = formatCheckFlags(checks);
    items.push({
      rank,
      matrix_id: matrixId,
      poi: row.legacy_value || matrixId,
      poi_type: row.poi_type || null,
      copy_label: row.copy_label || null,
      file: fn,
      detected_regions: foreignBad.map((f) => f.label),
      wrong_peer_city: wrongPeerCity,
      content_accuracy: checks,
      check_flags: failFlags,
      display_line: failFlags.length ? failFlags.join(' ') : 'Geo ❌',
      remediation: '替换为当地真实图片 · Review → Publish → Verify → Evidence → Live',
    });
  }
  return items;
}

function assessGeo(cityZh, matrixRows, heroFiles) {
  const issues = buildDetailedBacklog(cityZh, matrixRows, heroFiles).map((item) => ({
    matrix_id: item.matrix_id,
    poi: item.poi,
    poi_type: item.poi_type,
    file: item.file,
    detected_regions: item.detected_regions,
    wrong_peer_city: item.wrong_peer_city,
    issue: 'cross_region_image',
    content_accuracy: item.content_accuracy,
    check_flags: item.check_flags,
    remediation: item.remediation,
  }));
  return {
    verdict: issues.length === 0 ? 'PASS' : 'FAIL',
    issue_count: issues.length,
    total: Object.keys(heroFiles).length,
    issues,
  };
}

function assessContentAccuracy(cityZh, detailedItems, executionVerdict, poiTotal) {
  if (executionVerdict === 'WAITING') {
    return {
      verdict: 'WAITING',
      issue_count: 0,
      total: poiTotal || 0,
      items: [],
      note: 'Execution 未开始',
    };
  }
  const failCount = detailedItems.length;
  return {
    verdict: failCount === 0 ? 'PASS' : 'FAIL',
    issue_count: failCount,
    total: poiTotal || failCount,
    items: detailedItems,
    checks_schema: CONTENT_ACCURACY_CHECKS.map((c) => c.id),
  };
}

function assessCmsOwnership(cityZh, pilot, matrixRows) {
  const denom = readJson(DENOM_LOCK);
  const allItems = denom?.cms_denominator?.items || [];
  const byMatrix = {};
  for (const matrixId of pilot.matrix_ids) {
    const row = matrixRows.find((r) => r.matrix_id === matrixId);
    const fn = filenameFromUrl(row?.public_url);
    const item =
      allItems.find((i) => i.matrix_id === matrixId) ||
      allItems.find((i) => fn && (i.url || '').includes(fn));
    const catalog =
      (row?.public_url || '').includes('/uploads/community-posts/') ||
      item?.current_source === 'catalog' ||
      item?.asset_lifecycle === 'live' ||
      row?.asset_lifecycle === 'live';
    byMatrix[matrixId] = { matrix_id: matrixId, catalog };
  }
  const missing = Object.values(byMatrix).filter((r) => !r.catalog);
  return {
    verdict: missing.length === 0 ? 'PASS' : 'FAIL',
    live: Object.values(byMatrix).filter((r) => r.catalog).length,
    total: pilot.matrix_ids.length,
    missing_matrix_ids: missing.map((r) => r.matrix_id),
  };
}

function poiFamilyBoard(visualGap) {
  return visualGap?.summary?.family_board?.poi || visualGap?.family_board?.poi || null;
}

/** City Exit Check evidence · Golden Template gate（各国/各城复用路径约定） */
function cityExitCheckEvidencePath(pilot) {
  const token = String(pilot.city_en || pilot.slug || '')
    .replace(/\s+/g, '-')
    .toUpperCase();
  return path.join(ROOT, 'evidence/GO_cms_operation', `CMS-POI-CITY-${token}-CONTENT-QA-EXIT-CHECK-LATEST.json`);
}

const CITY_RUNTIME_SCOPE = {
  tier: 'city_consumer_runtime',
  consumer_surface: '/market → Custom Itinerary → country → city → POI preview',
  gate_2_equals_gate_4: true,
  not_vetoed_by: 'national_poi_family_board',
  country_tier: 'national_runtime · TT_CMS_JP_COUNTRY only',
};

/** 城市级 Runtime · Content QA / Golden Template · 与 Exit Check Gate 4 同源 */
function assessCityRuntimeConsumer(cityZh, pilot) {
  const exec = assessExecution(cityZh, readRegistry());
  if (exec.verdict === 'WAITING') {
    return { verdict: 'WAITING', reason: exec.reason || 'Execution 未开始', ...CITY_RUNTIME_SCOPE };
  }

  const exitPath = cityExitCheckEvidencePath(pilot);
  if (fs.existsSync(exitPath)) {
    try {
      const exit = JSON.parse(fs.readFileSync(exitPath, 'utf8'));
      const consumer = exit.checks?.find((c) => c.id === 'consumer_runtime_cms');
      if (consumer?.pass) {
        return {
          verdict: 'PASS',
          reason: 'City Consumer Runtime · Exit Check Gate 4 同源',
          ...CITY_RUNTIME_SCOPE,
          exit_check: path.relative(ROOT, exitPath).replace(/\\/g, '/'),
          catalog_api_requests: consumer.catalog_api_requests,
          poi_verified: (consumer.rows || []).filter((r) => r.cms_runtime_ok).length,
        };
      }
      return {
        verdict: 'FAIL',
        reason: 'City Exit Check · Consumer Runtime 未 PASS',
        ...CITY_RUNTIME_SCOPE,
        exit_check: path.relative(ROOT, exitPath).replace(/\\/g, '/'),
        issues: (consumer?.issues || []).slice(0, 5),
      };
    } catch {
      /* fall through */
    }
  }

  const allLocked = pilot.matrix_ids.every((id) => {
    const a = getAsset(id);
    return a.state === 'LOCKED' && !a.unlock_reason;
  });
  const slug = pilot.slug || String(pilot.city_en || '').toLowerCase();
  return {
    verdict: 'FAIL',
    reason: allLocked
      ? 'City Exit Check 未跑 · Gate 2 Runtime 须 Gate 4 同源证据'
      : 'City Consumer Runtime 须全部 LOCK 后跑 Exit Check',
    ...CITY_RUNTIME_SCOPE,
    required_command: `node scripts/dev/run-cms-poi-city-${slug}-content-qa-exit-check.cjs`,
  };
}

/** 国家级 Runtime · Country CLOSED 专用 · JP Country Runtime Audit SSOT */
function assessCountryRuntimeConsumer(visualGap) {
  const auditPath = path.join(ROOT, 'evidence/GO_cms_operation/CMS-JP-COUNTRY-RUNTIME-AUDIT-LATEST.json');
  const audit = readJson(auditPath);
  if (audit?.TT_CMS_JP_COUNTRY_RUNTIME === 'PASS') {
    return {
      verdict: 'PASS',
      reason: 'Japan Country Runtime audit PASS · 五城 Consumer + Catalog + Ambient',
      tier: 'national_runtime',
      ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-RUNTIME-AUDIT-LATEST.json',
      poi_runtime: `${audit.poi_runtime_pass}/${audit.poi_runtime_required}`,
    };
  }
  if (audit?.TT_CMS_JP_COUNTRY_RUNTIME === 'FAIL') {
    return {
      verdict: 'FAIL',
      reason: 'Japan Country Runtime audit FAIL',
      tier: 'national_runtime',
      ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-RUNTIME-AUDIT-LATEST.json',
      blockers: (audit.blockers || []).slice(0, 5),
    };
  }

  const poiBoard = poiFamilyBoard(visualGap);
  if (!poiBoard) {
    return {
      verdict: 'UNKNOWN',
      reason: '缺少 JP Country Runtime audit · 先跑 run-cms-jp-country-runtime-audit.cjs',
      tier: 'national_runtime',
    };
  }
  if (poiBoard.cms_ownership === 'CLOSED') {
    return {
      verdict: 'PASS',
      reason: '全站 POI Consumer 族读 CMS',
      tier: 'national_runtime',
      ssot: 'evidence/GO_cms_operation/CMS-L5-VISUAL-GAP-REPORT-LATEST.json',
    };
  }
  return {
    verdict: 'FAIL',
    reason: 'Japan Country Runtime 未 PASS · 先跑 run-cms-jp-country-runtime-audit.cjs',
    tier: 'national_runtime',
    note: '不否决 City Content QA CLOSED / Golden Template',
  };
}

function assessRuntimeConsumer(cityZh, pilot) {
  return assessCityRuntimeConsumer(cityZh, pilot);
}

function assessL5Quality(geo, cmsOwnership, contentAccuracy) {
  if (contentAccuracy.verdict === 'FAIL') {
    return {
      verdict: 'FAIL',
      reason: 'Content Accuracy 未 PASS · L5 画质无法弥补图文/地理错误',
      blocked_by: 'content_accuracy',
    };
  }
  if (geo.verdict !== 'PASS') {
    return { verdict: 'FAIL', reason: `${geo.issue_count} 项视觉源未对齐`, blocked_by: 'geo_matching' };
  }
  if (cmsOwnership.verdict !== 'PASS') {
    return { verdict: 'FAIL', reason: 'CMS catalog 未全部 LIVE', blocked_by: 'cms_ownership' };
  }
  return { verdict: 'PASS', reason: 'Content Accuracy PASS · 无 placeholder/unsplash' };
}

function assessExecution(cityZh, registry) {
  const pilot = CITY_PILOTS[cityZh];
  if (pilot?.country_iso === 'KR' || pilot?.country_iso === 'TH') {
    const closed = registry?.closed_cities?.find((c) => c.city_zh === cityZh);
    if (closed) {
      return {
        verdict: 'PASS',
        closed_at_utc: closed.closed_at_utc,
        poi_count: closed.poi_count,
        note: `Phase② ${pilot.country_iso} · 禁止重复 Execution`,
      };
    }
    return { verdict: 'FAIL', reason: 'City Execution 未完成' };
  }
  if (cityZh === '福冈') {
    const started = registry?.closed_cities?.some((c) => c.city_zh === '福冈');
    if (!started) return { verdict: 'WAITING', reason: '未开始 Execution' };
  }
  const closed = registry?.closed_cities?.find((c) => c.city_zh === cityZh);
  if (closed) {
    return {
      verdict: 'PASS',
      closed_at_utc: closed.closed_at_utc,
      poi_count: closed.poi_count,
      note: 'Phase② 已完成 · 禁止重复 Execution',
    };
  }
  return { verdict: 'FAIL', reason: 'City Execution 未完成' };
}

function contentQaClosed(cityQa) {
  if (cityQa.execution.verdict === 'WAITING') return false;
  if (cityQa.execution.verdict !== 'PASS') return false;
  return ['cms_ownership', 'runtime_consumer', 'geo_matching', 'content_accuracy', 'l5_quality'].every(
    (k) => cityQa[k].verdict === 'PASS',
  );
}

function assessRuntimeConsumerForPoi(catalogVerifyOk, visualGap) {
  if (!catalogVerifyOk) {
    return { verdict: 'FAIL', reason: 'Catalog Verify 未 PASS · Consumer 无法读 CMS' };
  }
  const poiBoard = poiFamilyBoard(visualGap);
  if (poiBoard?.cms_ownership === 'CLOSED') {
    return { verdict: 'PASS', reason: 'Consumer POI 族已读 CMS' };
  }
  return {
    verdict: 'PASS',
    reason: 'Catalog Publish + Verify PASS · POI 级 Runtime 就绪',
    note: '国家级 POI Consumer 族仍 OPEN 时 · Country CLOSED 另验',
  };
}

function assessSinglePoiContentQa({ cityZh, matrixId, heroFile, catalogVerifyOk = true, visualGap = null }) {
  const pilot = CITY_PILOTS[cityZh];
  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const row = parseMatrixRow(matrixText, matrixId);
  const heroFiles = { [matrixId]: heroFile || pilot.hero_files[matrixId] };
  const matrixRows = row ? [row] : [];
  const geo = assessGeo(cityZh, matrixRows, heroFiles);
  const cms_ownership = catalogVerifyOk
    ? { verdict: 'PASS', live: 1, total: 1, missing_matrix_ids: [] }
    : { verdict: 'FAIL', live: 0, total: 1, missing_matrix_ids: [matrixId] };
  const runtime_consumer = assessRuntimeConsumerForPoi(catalogVerifyOk, visualGap);
  const content_accuracy = {
    verdict: geo.issue_count === 0 ? 'PASS' : 'FAIL',
    issue_count: geo.issue_count,
    total: 1,
    items: buildDetailedBacklog(cityZh, matrixRows, heroFiles),
  };
  const execution = { verdict: 'PASS', note: 'Phase② 已证 · 本轮 Publish+Verify 完成' };
  const l5_quality = assessL5Quality(geo, cms_ownership, content_accuracy);
  const snapshot = {
    execution,
    cms_ownership,
    runtime_consumer,
    geo_matching: geo,
    content_accuracy,
    l5_quality,
  };
  const allPass = ['cms_ownership', 'runtime_consumer', 'geo_matching', 'content_accuracy', 'l5_quality'].every(
    (k) => snapshot[k].verdict === 'PASS',
  );
  return { matrix_id: matrixId, poi: row?.legacy_value, hero_file: heroFiles[matrixId], ...snapshot, all_pass: allPass };
}

function buildCityQa(cityZh, matrixText, registry, visualGap) {
  const pilot = CITY_PILOTS[cityZh];
  if (!pilot) throw new Error(`unknown city: ${cityZh}`);
  const matrixRows = pilot.matrix_ids.map((id) => parseMatrixRow(matrixText, id)).filter(Boolean);
  const execution = assessExecution(cityZh, registry);

  const lockedEntries = pilot.matrix_ids
    .filter((id) => getAsset(id).state === 'LOCKED')
    .map((id) => ({
      matrix_id: id,
      poi: pilot.pois[pilot.matrix_ids.indexOf(id)],
      lock_state: 'LOCKED',
      display_line: 'LOCKED',
      hero_file: getAsset(id).hero_file,
    }));

  const openBacklog =
    execution.verdict === 'WAITING'
      ? []
      : buildDetailedBacklog(cityZh, matrixRows, pilot.hero_files).map((item) => ({
          ...item,
          lock_state: getAsset(item.matrix_id).state,
        }));

  const geo =
    execution.verdict === 'WAITING'
      ? { verdict: 'WAITING', issue_count: 0, total: pilot.matrix_ids.length, issues: [] }
      : assessGeo(cityZh, matrixRows, pilot.hero_files);

  const content_accuracy = assessContentAccuracy(cityZh, openBacklog, execution.verdict, pilot.matrix_ids.length);

  const cms_ownership =
    execution.verdict === 'WAITING'
      ? { verdict: 'WAITING', live: 0, total: pilot.matrix_ids.length, missing_matrix_ids: [] }
      : assessCmsOwnership(cityZh, pilot, matrixRows);

  const runtime_consumer = assessCityRuntimeConsumer(cityZh, pilot);

  const l5_quality =
    execution.verdict === 'WAITING'
      ? { verdict: 'WAITING', reason: 'Execution 未开始' }
      : assessL5Quality(geo, cms_ownership, content_accuracy);

  return {
    city_zh: cityZh,
    city_en: pilot.city_en,
    country_iso: 'JP',
    poi_count: pilot.matrix_ids.length,
    execution,
    cms_ownership,
    runtime_consumer,
    geo_matching: geo,
    content_accuracy,
    l5_quality,
    backlog_items: openBacklog,
    locked_items: lockedEntries,
    backlog_issue_count: openBacklog.length,
    locked_count: lockedEntries.length,
    content_qa_closed:
      lockedEntries.length === pilot.matrix_ids.length &&
      openBacklog.length === 0 &&
      lockedEntries.every((e) => {
        const a = getAsset(e.matrix_id);
        return a.state === 'LOCKED' && a.content_qa?.all_pass === true && !a.unlock_reason;
      }),
  };
}

function buildJapanBacklog(cities) {
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
      status:
        c.execution.verdict === 'WAITING'
          ? 'waiting'
          : c.content_qa_closed
            ? 'content_qa_closed'
            : c.backlog_issue_count > 0
              ? 'remediation'
              : c.locked_count === c.poi_count
                ? 'content_qa_closed'
                : 'review',
      items: c.backlog_items,
      locked_items: c.locked_items || [],
    };
    totalIssues += c.backlog_issue_count;
  }
  return { tree, total_issues: totalIssues, remediation_priority: REMEDIATION_PRIORITY };
}

function assessJpCountry(cities, visualGap, ambientWiring) {
  const allExecution = cities.every((c) => c.execution.verdict === 'PASS');
  const activeCities = cities.filter((c) => c.execution.verdict !== 'WAITING');
  const geo100 = activeCities.every((c) => c.geo_matching.verdict === 'PASS');
  const accuracy100 = activeCities.every((c) => c.content_accuracy.verdict === 'PASS');
  const crossRegion = activeCities.reduce((n, c) => n + c.geo_matching.issue_count, 0);
  const l5Pass = activeCities.every((c) => c.l5_quality.verdict === 'PASS');
  const cityRuntimePass = activeCities.every((c) => c.runtime_consumer.verdict === 'PASS');
  const countryRuntime = assessCountryRuntimeConsumer(visualGap);
  const poiBoard = poiFamilyBoard(visualGap);
  const jpRuntimeAudit = readJson(path.join(ROOT, 'evidence/GO_cms_operation/CMS-JP-COUNTRY-RUNTIME-AUDIT-LATEST.json'));

  const criteria = {
    all_city_execution_closed: allExecution,
    content_accuracy_100: accuracy100 && crossRegion === 0,
    all_city_runtime_pass: cityRuntimePass,
    runtime_consumer_cms: countryRuntime.verdict === 'PASS',
    geo_matching_100: geo100 && crossRegion === 0,
    l5_visual_pass: l5Pass && crossRegion === 0,
    cross_region_images_0: crossRegion === 0,
    unsplash_0: false,
    ocs_runtime_0: false,
  };

  const poiUnsplashRuntime = (visualGap?.assets || []).filter(
    (a) =>
      String(a.source_lane || a.current_source || '').includes('unsplash') &&
      String(a.asset_family || a.role || '').includes('poi'),
  ).length;
  const jpRuntimePass = jpRuntimeAudit?.TT_CMS_JP_COUNTRY_RUNTIME === 'PASS';
  criteria.unsplash_0 =
    jpRuntimePass || (poiUnsplashRuntime === 0 && (ambientWiring?.TT_CMS_AMBIENT_UNSplash ?? 0) === 0);
  criteria.ocs_runtime_0 = jpRuntimePass || poiBoard?.cms_ownership === 'CLOSED';

  const allPass = Object.values(criteria).every(Boolean);

  return {
    verdict: allPass ? 'CLOSED' : 'OPEN',
    TT_CMS_JP_COUNTRY: allPass ? 'CLOSED' : 'OPEN',
    workflow: COUNTRY_WORKFLOW,
    runtime_tiers: {
      city: CITY_RUNTIME_SCOPE,
      country: { tier: 'national_runtime', ssot: 'CMS-L5-VISUAL-GAP-REPORT-LATEST.json' },
      rule: 'City Golden Template 不依赖 national_runtime · Country CLOSED 才验 national_runtime',
    },
    country_runtime_consumer: countryRuntime,
    criteria: JP_COUNTRY_CRITERIA.map((c) => ({
      ...c,
      pass: Boolean(criteria[c.key]),
      verdict: criteria[c.key] ? 'PASS' : 'FAIL',
    })),
    cross_region_total: crossRegion,
    content_accuracy_issues: activeCities.reduce((n, c) => n + c.content_accuracy.issue_count, 0),
    cities_execution_closed: cities.filter((c) => c.execution.verdict === 'PASS').length,
    cities_content_qa_closed: cities.filter((c) => c.content_qa_closed).length,
    enter_korea_when: 'TT_CMS_JP_COUNTRY: CLOSED',
  };
}

function formatCityQaTable(city) {
  const row = (label, v) => `| ${label} | ${v} |`;
  const lines = [
    `### ${city.city_zh} · ${city.city_en}`,
    '',
    '| 检查项 | 结果 |',
    '|--------|------|',
    row('Execution（Phase② · 不重复）', city.execution.verdict),
    row('CMS Ownership', city.cms_ownership.verdict),
    row('Runtime Consumer', city.runtime_consumer.verdict),
    row('Geo Matching', city.geo_matching.verdict),
    row('Content Accuracy', city.content_accuracy.verdict),
    row('L5 Quality', city.l5_quality.verdict),
    row('**Content QA Closed**', city.content_qa_closed ? '**YES**' : '**NO**'),
    '',
  ];
  if (city.backlog_items.length) {
    lines.push(`**Backlog (${city.backlog_issue_count})**`, '');
    for (const item of city.backlog_items) {
      lines.push(`${rankLabel(item.rank)} ${item.poi}`);
      lines.push(`   ${item.display_line}`);
      lines.push(`   \`${item.file}\` · ${item.matrix_id}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

function formatMarkdown(report) {
  const lines = [
    '# Japan L5 Content QA',
    '',
    `> Phase③ Content QA · ${report.stamp_utc}`,
    '',
    '## 三阶段',
    '',
    '| 阶段 | 状态 |',
    '|------|------|',
    `| ① CMS 系统 | ${report.phases.phase_1_system.status} |`,
    `| ② Execution | ${report.phases.phase_2_execution.status} |`,
    `| ③ Content QA | ${report.phases.phase_3_content_qa.status} |`,
    '',
    `**国家顺序：** ${report.country.workflow.template}`,
    '',
    `**TT_CMS_JP_COUNTRY:** \`${report.country.TT_CMS_JP_COUNTRY}\``,
    '',
    '| 国家级标准 | 结果 |',
    '|------------|------|',
  ];
  for (const c of report.country.criteria) {
    lines.push(`| ${c.label} | ${c.verdict} |`);
  }
  lines.push('', `Content Accuracy issues: **${report.country.content_accuracy_issues}**`, '');
  lines.push('## Backlog', '', '```');
  lines.push('Japan');
  for (const cityZh of JP_CITY_DISPLAY_ORDER) {
    const node = report.backlog.tree[cityZh];
    if (!node) continue;
    if (node.status === 'waiting') {
      lines.push(` ├── ${cityZh}`);
      lines.push(' │    waiting');
      continue;
    }
    lines.push(` ├── ${cityZh}`);
    for (const li of node.locked_items || []) {
      lines.push(` │    ✅ ${li.poi}  LOCKED`);
    }
    lines.push(` │    ${node.issue_count} open`);
    for (const item of node.items || []) {
      lines.push(` │    ${rankLabel(item.rank)} ${item.poi}  ${item.display_line}`);
    }
  }
  lines.push('```', '');
  lines.push('## Remediation Priority', '');
  for (const p of report.backlog.remediation_priority) {
    if (!p.city_zh) {
      lines.push(`${p.rank}. ${p.reason}`);
      continue;
    }
    const node = report.backlog.tree[p.city_zh];
    lines.push(`${p.rank}. **${p.city_zh}** — ${p.reason} (${node?.issue_count ?? '—'} items)`);
  }
  lines.push('', '## City QA Tables', '');
  for (const city of report.cities) {
    lines.push(formatCityQaTable(city));
  }
  return lines.join('\n');
}

function buildJapanContentQa(options = {}) {
  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const registry = readRegistry();
  const visualGap = readJson(VISUAL_GAP);
  const ambientWiring = readJson(AMBIENT_WIRING);

  const cities = JP_CITY_DISPLAY_ORDER.map((cityZh) => buildCityQa(cityZh, matrixText, registry, visualGap));
  const backlog = buildJapanBacklog(cities);
  const country = assessJpCountry(cities, visualGap, ambientWiring);

  return {
    schema: 'traveltrust.cms_japan_content_qa.v2',
    stamp_utc: options.stamp_utc || new Date().toISOString(),
    phase: '③_content_qa',
    layer: 'CONTENT_QA',
    not_execution: true,
    not_audit: true,
    terminology: 'L5 Content QA · 内容验收 · 非程序 Audit',
    standard_ssot: 'evidence/GO_cms_operation/CMS-CONTENT-QA-STANDARD-FROZEN.v1.json',
    asset_lock_ssot: 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json',
    phases: CMS_PHASES,
    country_workflow: COUNTRY_WORKFLOW,
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
      next_remediation_city: REMEDIATION_PRIORITY.find((p) => p.city_zh && (backlog.tree[p.city_zh]?.issue_count || 0) > 0)?.city_zh || null,
    },
    TT_CMS_JP_CONTENT_QA: country.verdict === 'CLOSED' ? 'CLOSED' : 'OPEN',
    TT_CMS_JP_COUNTRY: country.TT_CMS_JP_COUNTRY,
  };
}

module.exports = {
  CMS_PHASES,
  COUNTRY_WORKFLOW,
  CONTENT_QA_DIMENSIONS,
  CONTENT_ACCURACY_CHECKS,
  JP_CITY_DISPLAY_ORDER,
  REMEDIATION_PRIORITY,
  JP_COUNTRY_CRITERIA,
  buildCityQa,
  assessExecution,
  buildJapanContentQa,
  formatMarkdown,
  assessGeo,
  contentQaClosed,
  assessSinglePoiContentQa,
  buildDetailedBacklog,
  rankLabel,
};
