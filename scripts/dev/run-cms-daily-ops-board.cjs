#!/usr/bin/env node
/**
 * CMS 运营日报 · 运营每日唯一入口（not governance · not Health Score UI）
 *
 *   node scripts/dev/run-cms-daily-ops-board.cjs
 *
 * 机器汇总请用 run-cms-ops-refresh.cjs（含 Asset Matrix + Health Score + 本页）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-ASSET-MATRIX-LATEST.json');
const VIS_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-L5-VISUAL-SCAN-LATEST.json');
const DENOM_LOCK = path.join(ROOT, 'evidence/GO_cms_operation/CMS-DENOMINATOR-LOCK-LATEST.json');
const POI_CITY_OPS = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-OPS-LATEST.json');
const OPS_HIERARCHY = path.join(ROOT, 'evidence/GO_cms_operation/CMS-OPS-HIERARCHY-LATEST.json');
const REPORT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/daily/CMS-DAILY-REPORT-LATEST.json');
const DAILY_DIR = path.join(ROOT, 'evidence/GO_cms_operation/daily');

const {
  buildCmsOperationWave1,
  buildWave1DailyHeadline,
} = require('./lib/cms-l5-visual-scan.cjs');
const {
  loadDailySnapshot,
  saveDailySnapshot,
  previousUtcDateKey,
  utcDateKey,
} = require('./lib/cms-destination-ambient-ops.cjs');
const {
  buildCmsOpsHierarchy,
  formatFamilyTreeConsole,
  readHierarchyLatest,
} = require('./lib/cms-ops-hierarchy.cjs');
const {
  buildContentExecution,
  formatFamilyExecutionConsole,
  formatTodaysTasksFamilyOnly,
  readJson,
  CONTENT_EXEC_LATEST,
} = require('./lib/cms-infrastructure-freeze.cjs');
const CONTENT_EXEC = CONTENT_EXEC_LATEST;

function pad(s, n) {
  const t = String(s ?? '—');
  return t.length >= n ? t : t + ' '.repeat(n - t.length);
}

function rowByMetric(table, name) {
  return table.find((r) => r.metric === name) || null;
}

function printTable(rows) {
  console.log(`${pad('指标', 18)} ${pad('今天', 10)} ${pad('昨天', 10)} 变化`);
  console.log(`${'-'.repeat(18)} ${'-'.repeat(10)} ${'-'.repeat(10)} ${'-'.repeat(8)}`);
  for (const r of rows) {
    console.log(
      `${pad(r.metric, 18)} ${pad(r.today, 10)} ${pad(r.yesterday ?? '—', 10)} ${r.change}`,
    );
  }
}

function alignmentAnswer(row) {
  if (!row) return '—';
  if (row.change === '—' || row.change === '0%') return `${row.today}（较昨日持平）`;
  if (String(row.change).startsWith('+')) return `${row.today}（较昨日 ${row.change}）`;
  return `${row.today}（较昨日 ${row.change}）`;
}

function enrichWave1(vis, am) {
  if (!vis?.visual_findings?.length && !vis?.summary?.cms_operation_wave_1) return null;
  const cmsFindings = (vis.visual_findings || []).filter((f) => f.owner === 'CMS');
  const w1 = buildCmsOperationWave1(cmsFindings, am?.destination_ambient || null);
  const ySnap = loadDailySnapshot(DAILY_DIR, previousUtcDateKey(utcDateKey()));
  w1.daily_headline = buildWave1DailyHeadline(w1, ySnap?.metrics?.wave1_live ?? null);
  return w1;
}

function printWave1Headline(w1) {
  const h = w1.daily_headline;
  if (!h) return;
  console.log('CMS Operation Wave 1');
  console.log('');
  console.log('Overall');
  console.log(h.overall);
  console.log('');
  console.log('P0 Ambient');
  console.log(h.p0_ambient);
  console.log('');
  console.log("Today's Completed");
  console.log(h.todays_completed);
  console.log('');
  console.log('Next');
  console.log(h.next);
}

function printBlocked(w1) {
  if (!w1?.blocked?.length) return;
  const phase = w1.current_phase?.priority;
  let items = w1.blocked;
  if (phase === 'P0') {
    items = items.filter((b) => b.ops_priority === 'P0' || b.ops_priority === 'P1');
  } else if (phase === 'P1') {
    items = items.filter((b) => b.ops_priority !== 'P2');
  }
  console.log('Blocked');
  for (const item of items) {
    console.log(`${item.label}\t${item.waiting}`);
  }
  const hidden = w1.blocked.length - items.length;
  if (hidden > 0) {
    console.log(`  … ${hidden} 项在后续阶段（P2 等）· 见 CMS-L5-VISUAL-SCAN-LATEST.json`);
  }
}

function persistWave1Snapshot(w1, stampUtc) {
  if (!w1?.wave_progress) return;
  const key = utcDateKey();
  const existing = loadDailySnapshot(DAILY_DIR, key);
  const metrics = {
    ...(existing?.metrics || {}),
    date_utc: new Date().toISOString().slice(0, 10),
    wave1_live: w1.wave_progress.live,
    wave1_display: w1.wave_progress.display,
  };
  saveDailySnapshot(DAILY_DIR, key, metrics, stampUtc || existing?.stamp_utc || new Date().toISOString());
}

function printDenominatorLock(lock) {
  if (!lock?.cms_denominator) return;
  console.log('CMS 分母（已锁定 · 今日 SSOT）');
  console.log(`总计 ${lock.cms_denominator.completion} · REVIEW_REQUIRED ${lock.cms_denominator.review_required}`);
  if (lock.ambient_wave_closure?.status === 'COMPLETE') {
    console.log(`Destination Ambient: ${lock.ambient_wave_closure.display} ✓`);
  }
  console.log('');
  for (const [cat, row] of Object.entries(lock.cms_denominator.by_category || {})) {
    if (row.total === 0 && row.catalog_empty) continue;
    console.log(`  ${row.label}: ${row.completion}`);
  }
  console.log('');
  console.log(`非 CMS 登记: ${lock.non_cms_registry?.total ?? 0} 模块（今天不改）`);
  if (lock.next_action) {
    console.log(`Active Family 执行: ${lock.next_action.label || '—'}`);
  }
}

function printContentExecution(contentExec, hierarchy) {
  if (!contentExec) return;
  console.log(formatTodaysTasksFamilyOnly(contentExec));
  console.log('');
  console.log('─'.repeat(24));
  console.log('');
  console.log(formatFamilyExecutionConsole(contentExec));
  console.log('');
  const poi = hierarchy?.families?.find((f) => f.id === 'poi');
  if (poi?.active_city) {
    console.log(`Active City · ${poi.active_city.country_en} · ${poi.active_city.city_en}`);
    console.log(formatFamilyTreeConsole(poi));
    console.log('');
  }
}

function main() {
  if (!fs.existsSync(DENOM_LOCK)) {
    console.error('尚未锁分母 · 请先: node scripts/dev/run-cms-denominator-lock.cjs');
    process.exit(2);
  }

  if (!fs.existsSync(LATEST)) {
    console.error('尚无 SSOT · 请先完成一次闭环: node scripts/dev/run-cms-ops-refresh.cjs');
    process.exit(2);
  }

  const am = JSON.parse(fs.readFileSync(LATEST, 'utf8'));
  const report = am.daily_report || am.daily_ops_board?.daily_report;
  if (!report?.table) {
    console.error('daily_report missing · 请先: node scripts/dev/run-cms-ops-refresh.cjs');
    process.exit(2);
  }

  let denom = null;
  if (fs.existsSync(DENOM_LOCK)) {
    try {
      denom = JSON.parse(fs.readFileSync(DENOM_LOCK, 'utf8'));
    } catch {
      denom = null;
    }
  }
  let vis = null;
  if (fs.existsSync(VIS_LATEST)) {
    try {
      vis = JSON.parse(fs.readFileSync(VIS_LATEST, 'utf8'));
    } catch {
      vis = null;
    }
  }

  let contentExec = null;
  if (fs.existsSync(CONTENT_EXEC)) {
    contentExec = readJson(CONTENT_EXEC);
  }
  if (!contentExec && denom) {
    contentExec = buildContentExecution({ denom_lock: denom });
  }

  let hierarchy = null;
  if (fs.existsSync(OPS_HIERARCHY)) {
    try {
      hierarchy = JSON.parse(fs.readFileSync(OPS_HIERARCHY, 'utf8'));
    } catch {
      hierarchy = readHierarchyLatest();
    }
  }
  if (!hierarchy && denom) {
    hierarchy = buildCmsOpsHierarchy({ denom_lock: denom });
  }

  const w1 = enrichWave1(vis, am);
  const lt = report.long_term_kpi;
  const q = am.daily_ops_board?.daily_questions || {};
  const tasks = am.daily_ops_board?.todays_tasks || am.todays_tasks;
  const alignRow = rowByMetric(report.table, 'Source Alignment');
  const verifyRow = rowByMetric(report.table, 'Verify Fail');
  const reviewRow = rowByMetric(report.table, 'Pending Review');
  const publishRow = rowByMetric(report.table, 'Pending Publish');
  const newLive = q.new_live_assets_today ?? 0;

  console.log('CMS 运营日报 · 每日入口');
  console.log(`日期 (UTC): ${report.date_utc}`);
  console.log('基础设施：FROZEN · 仅执行 CMS 内容至 100% L5');
  console.log('');

  if (contentExec) {
    printContentExecution(contentExec, hierarchy);
  }

  if (denom) {
    printDenominatorLock(denom);
    console.log('');
  }

  if (w1) {
    console.log('（Legacy Wave 1 跟踪 · 仅旁证 · 运营以 Asset Family 为准）');
    printWave1Headline(w1);
    console.log('');
  }

  if (tasks?.today_checklist?.length) {
    console.log('Today');
    for (const item of tasks.today_checklist) {
      console.log(`  ${item.display}`);
    }
    if (tasks.summary_table?.length) {
      console.log('');
      for (const row of tasks.summary_table) {
        console.log(`  ${row.task}\t${row.status}`);
      }
    }
    console.log('');
  }

  if (w1) {
    printBlocked(w1);
    console.log('');
  }

  console.log('运营四问（结果）');
  console.log(`1. 今天新增 Live Asset：${newLive > 0 ? `+${newLive}` : newLive}（累计 ${lt.live_assets.display}）`);
  console.log(`2. Source Alignment 提升了吗：${alignmentAnswer(alignRow)}`);
  console.log(
    `3. Verify Fail：${verifyRow?.today ?? 0}${verifyRow?.today === 0 ? ' ✓' : ' · 需处理'}`,
  );
  console.log(
    `4. Pending Review / Publish：${reviewRow?.today ?? 0} / ${publishRow?.today ?? 0}`,
  );
  console.log('');
  console.log('明细（今天 vs 昨天）');
  printTable(report.table);
  console.log('');
  if (w1?.tracking_only_note) {
    console.log(`跟踪边界: ${w1.tracking_only_note}`);
    console.log('');
  }
  console.log('运营纪律 · Asset Family 顺序 · City 验收 · 禁止 bulk · 禁止 OCS 回流');

  persistWave1Snapshot(w1, am.stamp_utc);

  fs.mkdirSync(path.dirname(REPORT_LATEST), { recursive: true });
  fs.writeFileSync(
    REPORT_LATEST,
    JSON.stringify(
      {
        schema: 'traveltrust.cms_daily_report.v1',
        operator_daily_entry: true,
        stamp_utc: am.stamp_utc,
        todays_tasks: tasks,
        cms_denominator_lock: denom,
        cms_content_execution: contentExec,
        cms_ops_hierarchy: hierarchy,
        cms_operation_wave_1: w1,
        ambient_wave_closure: denom?.ambient_wave_closure || null,
        four_questions: {
          new_live_assets_today: newLive,
          source_alignment: alignmentAnswer(alignRow),
          verify_fail: verifyRow?.today ?? 0,
          pending_review: reviewRow?.today ?? 0,
          pending_publish: publishRow?.today ?? 0,
        },
        l5_status: vis?.TT_CMS_L5_STATUS || vis?.denominator_lock_alignment?.by_l5_status || vis?.summary?.by_l5_status || null,
        l5_status_raw_scan: vis?.summary?.by_l5_status || null,
        ...report,
      },
      null,
      2,
    ) + '\n',
  );

  if (w1?.daily_headline) {
    console.log('');
    console.log(`TT_CMS_WAVE1_OVERALL: ${w1.daily_headline.overall}`);
    console.log(`TT_CMS_WAVE1_TODAY: ${w1.daily_headline.todays_completed}`);
    console.log(`TT_CMS_WAVE1_NEXT: ${w1.daily_headline.next}`);
  }

  if (contentExec?.TT_CMS_ACTIVE_FAMILY) {
    console.log('');
    console.log(`TT_CMS_INFRASTRUCTURE: FROZEN`);
    console.log(`TT_CMS_ACTIVE_FAMILY: ${contentExec.TT_CMS_ACTIVE_FAMILY}`);
    console.log(`TT_CMS_ACCEPTANCE_UNIT: city`);
  }

  process.exit(0);
}

main();
