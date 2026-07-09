/**
 * CMS Operation · pipeline + daily ops board (SSOT inputs for Asset Matrix pack).
 */
const fs = require('fs');
const path = require('path');

const GATE_FIELDS = [
  'brief_review',
  'cms_review',
  'destination_authenticity',
  'brand_consistency',
  'catalog_publish',
  'verify',
  'evidence_complete',
];

const LIFECYCLE_PIPELINE = ['draft', 'review', 'approved', 'published', 'verified', 'live'];

const WAVE_ORDER = ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE', 'CN'];

function parseDestinationAmbientRows(text) {
  const rows = [];
  const blocks = text.split(/\n  - matrix_id:/).slice(1);
  for (const block of blocks) {
    const matrixId = block.match(/^ ([A-Z0-9-]+)/)?.[1];
    if (!matrixId) continue;
    const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    const gatesBlock = block.match(/\n    execution_gates:[\s\S]*?(?=\n    asset_version:)/);
    const execution_gates = {};
    for (const g of GATE_FIELDS) {
      const m = gatesBlock?.[0].match(new RegExp(`\\n      ${g}: (.+)`));
      execution_gates[g] = m ? m[1].trim().replace(/^"|"$/g, '') : null;
    }
    const revBlock = block.match(/\n    asset_version:[\s\S]*?(?=\n    catalog_|\n    public_|\n  - matrix_id:)/);
    const rollback = revBlock?.[0].match(/\n      rollback_target_revision: (.+)/)?.[1]?.trim();
    rows.push({
      matrix_id: matrixId,
      country_iso: get('country_iso'),
      country_zh: get('country_zh'),
      execution_order: Number(get('execution_order')),
      asset_lifecycle: get('asset_lifecycle'),
      matrix_row_status: get('matrix_row_status'),
      execution_gates,
      rollback_target_revision: rollback === 'null' ? null : rollback,
    });
  }
  return rows.sort((a, b) => a.execution_order - b.execution_order);
}

function loadEvidence(evidDir, matrixId) {
  const p = path.join(evidDir, `${matrixId}.EVIDENCE.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function pipelineStage(row, ev) {
  if (row.asset_lifecycle === 'live') return 'live';
  if (row.execution_gates?.verify === 'PASS' || ev?.step_5_verify?.gate_result === 'PASS') {
    return 'verified';
  }
  if (row.asset_lifecycle === 'published') return 'published';
  if (row.asset_lifecycle === 'approved') return 'approved';
  if (row.asset_lifecycle === 'review') return 'review';
  return 'draft';
}

function isTodayUtc(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

function computeActivePhase(liveCountries) {
  if (!liveCountries.includes('JP')) {
    return {
      id: 'phase_1',
      label: 'JP Ambient',
      country_iso: 'JP',
      matrix_id: 'DA-JP-HOME',
      status: 'IN_PROGRESS',
    };
  }
  if (!liveCountries.includes('KR')) {
    return {
      id: 'phase_2',
      label: 'KR Ambient',
      country_iso: 'KR',
      matrix_id: 'DA-KR-HOME',
      status: 'IN_PROGRESS',
    };
  }
  for (const iso of WAVE_ORDER.slice(2)) {
    if (!liveCountries.includes(iso)) {
      return {
        id: 'phase_3',
        label: `${iso} Ambient`,
        country_iso: iso,
        matrix_id: `DA-${iso}-HOME`,
        status: 'IN_PROGRESS',
      };
    }
  }
  return {
    id: 'phase_4',
    label: 'POI → Hotel → Transport → Video',
    country_iso: null,
    matrix_id: null,
    status: 'READY',
  };
}

function computeDestinationAmbientOps(daMatrixPath, evidDir) {
  if (!fs.existsSync(daMatrixPath)) {
    return null;
  }
  const rows = parseDestinationAmbientRows(fs.readFileSync(daMatrixPath, 'utf8'));
  const pipelineCounts = Object.fromEntries(LIFECYCLE_PIPELINE.map((s) => [s, 0]));
  const byStage = Object.fromEntries(LIFECYCLE_PIPELINE.map((s) => [s, []]));
  const verifyFailures = [];
  const rollbackNeeded = [];
  let newLiveToday = 0;

  for (const row of rows) {
    const ev = loadEvidence(evidDir, row.matrix_id);
    const stage = pipelineStage(row, ev);
    pipelineCounts[stage] += 1;
    byStage[stage].push({
      matrix_id: row.matrix_id,
      country_iso: row.country_iso,
      asset_lifecycle: row.asset_lifecycle,
    });

    const verifyFail =
      row.execution_gates?.verify === 'FAIL' ||
      ev?.step_5_verify?.gate_result === 'FAIL' ||
      ev?.TT_CMS_DESTINATION_AMBIENT_ROW_VERIFY === 'FAIL';
    if (verifyFail) {
      verifyFailures.push({
        matrix_id: row.matrix_id,
        country_iso: row.country_iso,
        gate: 'verify',
      });
    }

    const needsRollback =
      row.rollback_target_revision != null ||
      (row.asset_lifecycle === 'published' && verifyFail) ||
      row.matrix_row_status === 'fail';
    if (needsRollback) {
      rollbackNeeded.push({
        matrix_id: row.matrix_id,
        country_iso: row.country_iso,
        rollback_target_revision: row.rollback_target_revision,
      });
    }

    if (stage === 'live' || row.asset_lifecycle === 'live') {
      const liveAt = ev?.step_5_verify?.verified_at_utc || ev?.step_6_evidence?.completed_at_utc;
      if (isTodayUtc(liveAt)) newLiveToday += 1;
    }
  }

  const liveCountries = byStage.live.map((r) => r.country_iso);
  const live = liveCountries.length;
  const total = rows.length;

  return {
    wave_order: WAVE_ORDER,
    live,
    total,
    display: `${live}/${total}`,
    pipeline: {
      stages: LIFECYCLE_PIPELINE,
      counts: pipelineCounts,
      by_stage: byStage,
    },
    ops_board: {
      live: liveCountries,
      review: byStage.review.map((r) => r.country_iso),
      approved: byStage.approved.map((r) => r.country_iso),
      published: byStage.published.map((r) => r.country_iso),
      verified: byStage.verified.map((r) => r.country_iso),
      draft: byStage.draft.map((r) => r.country_iso),
    },
    active_phase: computeActivePhase(liveCountries),
    verify_failures: verifyFailures,
    rollback_needed: rollbackNeeded,
    new_live_assets_today: newLiveToday,
    evidence_dir: evidDir,
  };
}

function computeDailyMetrics(destinationAmbient, sourceAlignment) {
  const pipeline = destinationAmbient?.pipeline?.counts || {};
  return {
    date_utc: new Date().toISOString().slice(0, 10),
    live_assets: destinationAmbient?.live ?? 0,
    live_assets_display: destinationAmbient?.display ?? '0/10',
    live_countries: destinationAmbient?.ops_board?.live ?? [],
    source_alignment_pct: sourceAlignment.pct,
    source_alignment_display: sourceAlignment.display,
    source_alignment_aligned: sourceAlignment.aligned,
    verify_fail: (destinationAmbient?.verify_failures ?? []).length,
    rollback: (destinationAmbient?.rollback_needed ?? []).length,
    pending_review: pipeline.review ?? 0,
    pending_publish: pipeline.approved ?? 0,
  };
}

function utcDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function previousUtcDateKey(dateKey) {
  const y = Number(dateKey.slice(0, 4));
  const m = Number(dateKey.slice(4, 6));
  const d = Number(dateKey.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return utcDateKey(dt);
}

function loadDailySnapshot(dailyDir, dateKey) {
  const p = path.join(dailyDir, `${dateKey}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function saveDailySnapshot(dailyDir, dateKey, metrics, stamp) {
  fs.mkdirSync(dailyDir, { recursive: true });
  const payload = {
    schema: 'traveltrust.cms_daily_ops_snapshot.v1',
    date_utc: metrics.date_utc,
    stamp_utc: stamp,
    metrics,
  };
  fs.writeFileSync(path.join(dailyDir, `${dateKey}.json`), JSON.stringify(payload, null, 2) + '\n');
  return payload;
}

function formatDelta(n) {
  if (n == null || Number.isNaN(n) || n === 0) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}

function formatDeltaPct(n) {
  if (n == null || Number.isNaN(n) || n === 0) return '—';
  const rounded = Math.round(n * 10) / 10;
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

function formatPct(n) {
  if (n == null) return '—';
  return `${n}%`;
}

function buildDailyReport(today, yesterday) {
  const y = yesterday?.metrics || yesterday || null;
  const rows = [
    {
      metric: 'Live Assets',
      today: today.live_assets,
      yesterday: y?.live_assets ?? null,
      change: formatDelta(y ? today.live_assets - y.live_assets : null),
    },
    {
      metric: 'Source Alignment',
      today: formatPct(today.source_alignment_pct),
      yesterday: y ? formatPct(y.source_alignment_pct) : null,
      change: formatDeltaPct(y ? today.source_alignment_pct - y.source_alignment_pct : null),
    },
    {
      metric: 'Verify Fail',
      today: today.verify_fail,
      yesterday: y?.verify_fail ?? null,
      change: formatDelta(y != null ? today.verify_fail - y.verify_fail : null),
    },
    {
      metric: 'Rollback',
      today: today.rollback,
      yesterday: y?.rollback ?? null,
      change: formatDelta(y != null ? today.rollback - y.rollback : null),
    },
    {
      metric: 'Pending Review',
      today: today.pending_review,
      yesterday: y?.pending_review ?? null,
      change: formatDelta(y != null ? today.pending_review - y.pending_review : null),
    },
    {
      metric: 'Pending Publish',
      today: today.pending_publish,
      yesterday: y?.pending_publish ?? null,
      change: formatDelta(y != null ? today.pending_publish - y.pending_publish : null),
    },
  ];

  return {
    role: 'operations_daily_report',
    not_governance: true,
    ssot: 'asset_matrix_pack',
    date_utc: today.date_utc,
    yesterday_date_utc: y?.date_utc || null,
    table: rows,
    long_term_kpi: {
      content_completion: {
        label: 'Source Alignment',
        current: today.source_alignment_display,
        target: '8 / 8',
      },
      live_assets: {
        label: 'Live Assets',
        current: today.live_assets,
        cumulative: today.live_countries,
        display: today.live_assets_display,
      },
      verify: {
        label: 'Verify Failed',
        current: today.verify_fail,
        target: 0,
      },
    },
  };
}

function getCountryPipelineStage(destinationAmbient, iso) {
  if (!destinationAmbient?.pipeline?.by_stage || !iso) return 'draft';
  for (const stage of LIFECYCLE_PIPELINE) {
    if (destinationAmbient.pipeline.by_stage[stage]?.some((r) => r.country_iso === iso)) {
      return stage;
    }
  }
  return 'draft';
}

/** Today's Tasks · projection of Asset Matrix state only (no second rule set). */
function computeTodaysTasks(destinationAmbient) {
  if (!destinationAmbient) {
    return { ssot: 'asset_matrix', today: [], summary_table: [] };
  }

  const wave = destinationAmbient.wave_order || WAVE_ORDER;
  const live = destinationAmbient.ops_board?.live || [];
  const workIso = wave.find((iso) => !live.includes(iso)) || wave[wave.length - 1];
  const workStage = getCountryPipelineStage(destinationAmbient, workIso);
  const matrixId = `DA-${workIso}-HOME`;
  const workLive = live.includes(workIso);

  const uploadDone = workStage !== 'draft';
  const publishDone = ['published', 'verified', 'live'].includes(workStage);
  const verifyDone = ['verified', 'live'].includes(workStage);
  const evidenceDone = workStage === 'live';

  const loopSteps = [
    { id: 'upload', label: `${matrixId} Upload`, done: uploadDone },
    { id: 'publish', label: 'Publish', done: publishDone },
    { id: 'verify', label: 'Verify', done: verifyDone },
    { id: 'evidence', label: 'Evidence', done: evidenceDone },
  ];

  const todayChecklist = loopSteps.map((s) => ({
    id: s.id,
    label: s.label,
    done: s.done,
    mark: s.done ? '✓' : '□',
    display: `${s.done ? '✓' : '□'} ${s.label}`,
  }));

  const summaryTable = [
    {
      task: `${workIso} Ambient Upload`,
      status: uploadDone ? '✓' : '⏳',
      done: uploadDone,
    },
    {
      task: `${workIso} Verify`,
      status: verifyDone ? '✓' : '⏳',
      done: verifyDone,
    },
    {
      task: `${workIso} Live`,
      status: workLive ? '✓' : '⏳',
      done: workLive,
    },
  ];

  const nextIso = wave[wave.indexOf(workIso) + 1];
  if (nextIso) {
    summaryTable.push({
      task: `${nextIso} 准备`,
      status: workLive ? (live.includes(nextIso) ? '✓' : '⏳') : '未开始',
      done: live.includes(nextIso),
    });
  }

  const allLoopDone = loopSteps.every((s) => s.done);

  return {
    ssot: 'asset_matrix',
    not_governance: true,
    projection_only: true,
    work_country_iso: workIso,
    work_matrix_id: matrixId,
    work_pipeline_stage: workStage,
    today_checklist: todayChecklist,
    summary_table: summaryTable,
    all_loop_done: allLoopDone,
    next_after_complete: nextIso ? `DA-${nextIso}-HOME` : null,
  };
}

function computeDailyOpsBoard({ destinationAmbient, sourceAlignment, yesterdaySnapshot }) {
  const today = computeDailyMetrics(destinationAmbient, sourceAlignment);
  const dailyReport = buildDailyReport(today, yesterdaySnapshot);
  const todaysTasks = computeTodaysTasks(destinationAmbient);

  return {
    role: 'operations_daily_summary',
    not_governance: true,
    ssot_chain: 'asset_matrix → health_score | daily_ops_board (kpi + todays_tasks)',
    todays_tasks: todaysTasks,
    daily_metrics: today,
    daily_report: dailyReport,
    daily_questions: {
      new_live_assets_today: destinationAmbient?.new_live_assets_today ?? 0,
      source_alignment: {
        current: sourceAlignment.display,
        current_pct: sourceAlignment.pct,
        previous: yesterdaySnapshot?.metrics
          ? `${yesterdaySnapshot.metrics.source_alignment_aligned} / ${sourceAlignment.total}`
          : null,
        previous_pct: yesterdaySnapshot?.metrics?.source_alignment_pct ?? null,
      },
      verify_failure_count: today.verify_fail,
      rollback_needed_count: today.rollback,
    },
    lifecycle_pipeline: LIFECYCLE_PIPELINE,
    active_phase: destinationAmbient?.active_phase ?? null,
    destination_ambient_live: destinationAmbient?.display ?? '0/10',
  };
}

function deriveContentHealthScore(sourceAlignment) {
  const pct = sourceAlignment.pct;
  let status;
  if (pct === 100) {
    status = 'ALL_ALIGNED';
  } else if (sourceAlignment.aligned === 0) {
    status = 'BASELINE_ESTABLISHED';
  } else {
    status = 'IN_PROGRESS';
  }
  return {
    ssot: 'source_alignment',
    label: `${pct}%`,
    status,
    display: sourceAlignment.display,
    pct,
    aligned: sourceAlignment.aligned,
    total: sourceAlignment.total,
  };
}

module.exports = {
  GATE_FIELDS,
  LIFECYCLE_PIPELINE,
  WAVE_ORDER,
  parseDestinationAmbientRows,
  computeDestinationAmbientOps,
  computeDailyMetrics,
  computeDailyOpsBoard,
  computeTodaysTasks,
  buildDailyReport,
  deriveContentHealthScore,
  utcDateKey,
  previousUtcDateKey,
  loadDailySnapshot,
  saveDailySnapshot,
};
