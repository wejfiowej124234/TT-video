/**
 * CMS Infrastructure Freeze · ② staging ops
 *
 * Infrastructure FROZEN · only remaining work = CMS content → 100% L5.
 * Ops language = Asset Family progression (no Wave 1/2/3).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const FREEZE_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-INFRASTRUCTURE-FREEZE-LATEST.json');
const CONTENT_EXEC_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-EXECUTION-LATEST.json');
const DENOM_LOCK = path.join(ROOT, 'evidence/GO_cms_operation/CMS-DENOMINATOR-LOCK-LATEST.json');
const POI_SCOPE_LOCK = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CATALOG-SCOPE-LOCK-LATEST.json');

const CMS_INFRASTRUCTURE_FREEZE = {
  frozen: true,
  final_ops_abstraction: true,
  effective_utc: '2026-07-05',
  phase: '② staging',
  forbidden_additions: [
    'family',
    'country',
    'city',
    'wave',
    'kpi',
    'dashboard',
    'status',
    'registry',
    'runbook',
  ],
  only_remaining_work: 'cms_content_to_100_percent_l5',
  ops_language: 'asset_family_only',
  deprecated_ops_language: ['Wave 1', 'Wave 2', 'Wave 3', 'wave_1', 'wave_2', 'wave_3_plus'],
  hierarchy_frozen: ['asset_family', 'country', 'city', 'asset'],
  unified_pipeline: ['Review', 'Replace', 'Publish', 'Verify', 'Evidence', 'Live'],
};

/** CMS 真实图片内容族 · ③ 未完成项 */
const CMS_CONTENT_FAMILIES = [
  { id: 'destination_ambient', label: 'Destination Ambient', lock_key: 'destination_ambient' },
  { id: 'poi', label: 'POI', lock_key: 'poi', scope_denominator_key: 'TT_CMS_POI_DENOMINATOR_TOTAL' },
  { id: 'food', label: 'Food', lock_key: 'food', scope_denominator_key: null },
  { id: 'city', label: 'City Hero', lock_key: 'city' },
  { id: 'hotel', label: 'Hotel', lock_key: 'hotel' },
  { id: 'transport', label: 'Transport', lock_key: 'transport' },
  { id: 'provider_listing', label: 'Provider Listing', lock_key: 'provider_listing' },
  { id: 'acquisition_listing', label: 'Acquisition Listing', lock_key: 'acquisition_listing' },
  { id: 'banner', label: 'Banner', lock_key: 'banner' },
  { id: 'video_poster', label: 'Video Poster', lock_key: 'video_poster' },
];

const FAMILY_EXECUTION_ORDER = CMS_CONTENT_FAMILIES.map((f) => f.id);

function readJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function progressBar(pct, width = 10) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const filled = Math.round((clamped / 100) * width);
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)} ${clamped}%`;
}

function familyContentPct(familyId, lockCat, poiScope) {
  if (!lockCat) return 0;
  if (familyId === 'destination_ambient' && lockCat.total > 0) {
    return Math.round((lockCat.live / lockCat.total) * 100);
  }
  if (familyId === 'poi' && poiScope?.TT_CMS_POI_DENOMINATOR_TOTAL) {
    const total = poiScope.TT_CMS_POI_DENOMINATOR_TOTAL;
    const live = lockCat.catalog_empty ? 0 : lockCat.live;
    return total ? Math.round((live / total) * 100) : 0;
  }
  if (familyId === 'food' && poiScope?.denominator?.food) {
    const total = poiScope.denominator.food;
    const live = lockCat.catalog_empty ? 0 : lockCat.live;
    return total ? Math.round((live / total) * 100) : 0;
  }
  if (lockCat.total > 0 && !lockCat.catalog_empty) {
    return Math.round((lockCat.live / lockCat.total) * 100);
  }
  return 0;
}

function resolveFamilyExecutionStatus(familyId, pct, activeFamilyId) {
  if (pct >= 100) return 'CLOSED';
  if (familyId === activeFamilyId) return 'ACTIVE';
  const activeIdx = FAMILY_EXECUTION_ORDER.indexOf(activeFamilyId);
  const idx = FAMILY_EXECUTION_ORDER.indexOf(familyId);
  if (idx < activeIdx) return 'CLOSED';
  if (idx === activeIdx) return 'ACTIVE';
  return 'WAITING';
}

function familyExecutionDisplay(status) {
  if (status === 'CLOSED') return '✅ CLOSED';
  if (status === 'ACTIVE') return '▶ ACTIVE';
  return 'WAITING';
}

function buildPipelineNeeds(cmsItems) {
  const items = cmsItems || [];
  const notLive = items.filter((i) => i.l5_status !== 'LIVE');
  return {
    need_review: notLive.filter((i) => i.l5_status === 'REVIEW_REQUIRED' || !i.l5_status).length,
    need_replace: notLive.filter((i) =>
      /unsplash|pexels|placeholder|ts_unsplash|external|fallback/i.test(`${i.current_source || ''} ${i.url || ''}`),
    ).length,
    need_publish: notLive.filter((i) => i.asset_lifecycle === 'approved').length,
    need_verify: notLive.filter((i) => i.l5_status === 'VERIFIED' || i.asset_lifecycle === 'published').length,
    need_evidence: notLive.filter((i) => i.l5_status === 'LIVE' && !i.evidence_complete).length,
    target_all_zero: true,
  };
}

function resolveActiveFamily(families) {
  const active = families.find((f) => f.execution_status === 'ACTIVE');
  if (active) return active.id;
  const next = families.find((f) => f.execution_status === 'WAITING' && f.content_pct < 100);
  return next?.id || null;
}

function buildContentExecution(options = {}) {
  const denom = options.denom_lock || readJson(DENOM_LOCK);
  const poiScope = options.poi_scope || readJson(POI_SCOPE_LOCK);
  const byCat = denom?.cms_denominator?.by_category || {};
  const cmsItems = denom?.cms_denominator?.items || [];

  let families = CMS_CONTENT_FAMILIES.map((def, order) => {
    const lockCat = byCat[def.lock_key];
    const pct = familyContentPct(def.id, lockCat, poiScope);
    return {
      order: order + 1,
      id: def.id,
      label: def.label,
      content_pct: pct,
      progress_bar: progressBar(pct),
      lock_completion: lockCat?.completion || '0/0',
      catalog_empty: lockCat?.catalog_empty ?? true,
      live: lockCat?.live ?? 0,
      total: lockCat?.total ?? 0,
    };
  });

  // Determine active family: first not 100% in order
  let activeFamilyId = 'poi';
  for (const f of families) {
    if (f.content_pct < 100) {
      activeFamilyId = f.id;
      break;
    }
  }

  families = families.map((f) => ({
    ...f,
    execution_status: resolveFamilyExecutionStatus(f.id, f.content_pct, activeFamilyId),
    display: familyExecutionDisplay(resolveFamilyExecutionStatus(f.id, f.content_pct, activeFamilyId)),
  }));

  const pipeline_needs = buildPipelineNeeds(cmsItems);
  const contentLive = families.reduce((n, f) => n + (f.live || 0), 0);
  const ambientDone = families.find((f) => f.id === 'destination_ambient')?.content_pct === 100;

  return {
    schema: 'traveltrust.cms_content_execution.v1',
    layer: 'CMS_OPERATION',
    not_governance: true,
    phase: '② staging',
    infrastructure: CMS_INFRASTRUCTURE_FREEZE,
    statement:
      'CMS 系统已就绪 · ③ 未完成 = 真实图片内容未全部 L5 · 仅执行内容至 100%',
    content_families: families,
    active_family: activeFamilyId,
    active_family_label: families.find((f) => f.id === activeFamilyId)?.label || null,
    pipeline_needs,
    completion_gate: {
      all_families_100pct: families.every((f) => f.content_pct >= 100),
      pipeline_all_zero: Object.entries(pipeline_needs)
        .filter(([k]) => k.startsWith('need_'))
        .every(([, v]) => v === 0),
    },
    summary: {
      ambient_closed: ambientDone,
      cms_review_required: denom?.cms_denominator?.review_required ?? null,
      families_closed: families.filter((f) => f.execution_status === 'CLOSED').length,
      families_total: families.length,
    },
    TT_CMS_INFRASTRUCTURE: 'FROZEN',
    TT_CMS_CONTENT_EXECUTION: 'ACTIVE',
    TT_CMS_ACTIVE_FAMILY: activeFamilyId,
  };
}

function formatFamilyExecutionConsole(exec) {
  const lines = [
    'CMS Content Execution · 基础设施已冻结 · 仅推进内容至 100% L5',
    '推进单位：Asset Family（不再使用 Wave 1/2/3）',
    '',
  ];
  for (const f of exec.content_families) {
    lines.push(`${f.label.padEnd(22)} ${f.progress_bar}  ${f.display}`);
  }
  lines.push('');
  lines.push('Pipeline（目标全部为 0）');
  const p = exec.pipeline_needs;
  lines.push(`  Need Review    ${p.need_review}`);
  lines.push(`  Need Replace   ${p.need_replace}`);
  lines.push(`  Need Publish   ${p.need_publish}`);
  lines.push(`  Need Verify    ${p.need_verify}`);
  lines.push(`  Need Evidence  ${p.need_evidence}`);
  lines.push('');
  lines.push(`Active Family: ${exec.active_family_label || exec.active_family}`);
  return lines.join('\n');
}

function formatTodaysTasksFamilyOnly(exec) {
  const lines = ["Today's Tasks", '─'.repeat(24), ''];
  for (const f of exec.content_families) {
    if (f.execution_status === 'CLOSED') {
      lines.push(`${f.label}`);
      lines.push(`    ✅ CLOSED`);
    } else if (f.execution_status === 'ACTIVE') {
      lines.push(`${f.label}`);
      lines.push(`    ▶ ACTIVE  ${f.progress_bar}`);
    } else {
      lines.push(`${f.label}`);
      lines.push(`    WAITING`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function writeInfrastructureFreeze(stampUtc) {
  const out = {
    schema: 'traveltrust.cms_infrastructure_freeze.v1',
    stamp_utc: stampUtc || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'),
    layer: 'CMS_OPERATION',
    not_governance: true,
    ...CMS_INFRASTRUCTURE_FREEZE,
    content_families: CMS_CONTENT_FAMILIES.map((f) => f.label),
    TT_CMS_INFRASTRUCTURE: 'FROZEN',
    TT_CMS_ONLY_REMAINING: 'cms_content_to_100_percent_l5',
  };
  fs.mkdirSync(path.dirname(FREEZE_LATEST), { recursive: true });
  fs.writeFileSync(FREEZE_LATEST, JSON.stringify(out, null, 2) + '\n');
  return out;
}

function writeContentExecutionLatest(exec, stampUtc) {
  const out = { ...exec, stamp_utc: stampUtc || exec.stamp_utc };
  fs.mkdirSync(path.dirname(CONTENT_EXEC_LATEST), { recursive: true });
  fs.writeFileSync(CONTENT_EXEC_LATEST, JSON.stringify(out, null, 2) + '\n');
  return out;
}

module.exports = {
  FREEZE_LATEST,
  CONTENT_EXEC_LATEST,
  CMS_INFRASTRUCTURE_FREEZE,
  CMS_CONTENT_FAMILIES,
  buildContentExecution,
  buildPipelineNeeds,
  formatFamilyExecutionConsole,
  formatTodaysTasksFamilyOnly,
  writeInfrastructureFreeze,
  writeContentExecutionLatest,
  readJson,
};
