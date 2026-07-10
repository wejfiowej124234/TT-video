#!/usr/bin/env node
/**
 * Production Readiness Master Checklist · Phase B v4
 * 两层统计：Open Root Causes（唯一根因）+ Blocking Checks（影响次数）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVID_DIR = path.join(ROOT, 'evidence/GO_production_readiness');
const OUT_JSON = path.join(EVID_DIR, 'PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json');
const OUT_MD = path.join(EVID_DIR, 'PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.md');

const FILES = {
  checklist: path.join(ROOT, 'registry/production-readiness-master-checklist.v1.yaml'),
  bdr: path.join(ROOT, 'registry/business-data-readiness.v1.yaml'),
  hat: path.join(ROOT, 'registry/hat-six-role-matrix.v1.yaml'),
  bfm: path.join(ROOT, 'registry/business-flow-matrix.v1.yaml'),
  manual: path.join(ROOT, 'registry/manual-validation-checklist.v1.yaml'),
  issues: path.join(ROOT, 'registry/production-readiness-open-issues.v1.yaml'),
  gates: path.join(ROOT, 'registry/production-readiness-phase-gates.v1.yaml'),
  guideDay1: path.join(ROOT, 'evidence/GO_production_readiness/step1/GUIDE-BUSINESS-DATA-READINESS-DAY1-LATEST.json'),
  providerDay2: path.join(ROOT, 'evidence/GO_production_readiness/step2/PROVIDER-BUSINESS-DATA-READINESS-DAY2-LATEST.json'),
  listingsDay3: path.join(ROOT, 'evidence/GO_production_readiness/step3/LISTINGS-BUSINESS-DATA-READINESS-DAY3-LATEST.json'),
  poiDay4: path.join(ROOT, 'evidence/GO_production_readiness/step3/POI-BUSINESS-DATA-READINESS-DAY4-LATEST.json'),
  pricingDay5: path.join(ROOT, 'evidence/GO_production_readiness/step3/PRICING-BUSINESS-DATA-READINESS-DAY5-LATEST.json'),
};

function readText(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function isBlocking(v) {
  return v === 'pending' || v === 'fail' || v === 'blocked' || v === 'not_started';
}

function parseBdrChecks(text) {
  return [...text.matchAll(/\{ id: (\w+), label: ([^,]+), verdict: (\w+) \}/g)].map((m) => ({
    id: m[1],
    label: m[2].trim(),
    verdict: m[3],
  }));
}

function parseHatMatrix(text) {
  const steps = [...text.matchAll(/\{ id: (\w+), label: ([^}]+) \}/g)]
    .slice(0, 7)
    .map((m) => ({ id: m[1], label: m[2].trim() }));

  const roles = [];
  for (const block of text.split(/\n  - id: /).slice(1)) {
    const id = block.match(/^(tourist|guide|provider|acquisition|admin|governance)/)?.[1];
    if (!id) continue;
    const label = block.match(/\n    label: (.+)/)?.[1];
    const remark = block.match(/\n    remark: (.+)/)?.[1]?.replace(/^"|"$/g, '') || '';
    const cells = {};
    for (const c of block.matchAll(
      /(\w+): \{ verdict: (\w+|na), note: "([^"]*)" \}/g,
    )) {
      cells[c[1]] = { verdict: c[2], note: c[3] };
    }
    roles.push({ id, label, remark, cells });
  }
  return { steps, roles };
}

function parseBfmFlows(text) {
  const flows = [];
  for (const block of (text.split('flows:')[1] || '').split(/\n  - id: /).slice(1)) {
    const id = block.match(/^(guide|provider|acquisition)/)?.[1];
    if (!id) continue;
    const label = block.match(/\n    label: (.+)/)?.[1];
    const flowVerdict = block.match(/\n    verdict: (\w+)/)?.[1];
    const steps = [
      ...block.matchAll(/\{ id: (\w+), label: ([^,]+), verdict: (\w+)(?:, note: "[^"]*")? \}/g),
    ].map((m) => ({
      id: m[1],
      label: m[2],
      verdict: m[3],
    }));
    flows.push({ id, label, flow_verdict: flowVerdict, steps });
  }
  return flows;
}

function parseManualChecks(text) {
  return [...text.matchAll(/\{ id: (\w+), label: ([^,]+), verdict: (\w+)(?:, note: "[^"]*")? \}/g)].map((m) => ({
    id: m[1],
    label: m[2].trim(),
    verdict: m[3],
  }));
}

function issueLifecycle(issue) {
  if (issue.lifecycle) return issue.lifecycle;
  if (issue.status === 'fixed') return 'CLOSED';
  return 'OPEN';
}

function isOpenRootCause(issue) {
  return issueLifecycle(issue) !== 'CLOSED';
}

function parseOpenIssues(text) {
  const issuesBlock = text.replace(/\r\n/g, '\n').split('\nissues:')[1] || text;
  const issues = [];
  for (const block of issuesBlock.split(/\n  - id: /).slice(1)) {
    const id = block.match(/^(BD-\d+|HAT-\d+|BFM-\d+|MV-\d+|PE-\d+)/)?.[1];
    if (!id) continue;
    const root_cause = block.match(/\n    root_cause: (.+)/)?.[1];
    const lifecycle = block.match(/\n    lifecycle: (\w+)/)?.[1];
    const status = block.match(/\n    status: (\w+)/)?.[1];
    const note = block.match(/\n    note: (.+)/)?.[1];
    const discovered_at = block.match(/\n    discovered_at: "?([^"\n]+)"?/)?.[1];
    const closedRaw = block.match(/\n    closed_at: (.+)/)?.[1]?.trim();
    const closed_at = closedRaw === 'null' ? null : closedRaw?.replace(/^"|"$/g, '');
    const active = block.match(/\n    active: (true|false)/)?.[1] === 'true';
    let exit_condition = block.match(/\n    exit_condition: (.+)/)?.[1];
    if (exit_condition === '>-') {
      exit_condition = block.match(/\n    exit_condition: >-\n      (.+)/)?.[1];
    }
    const impactMatch = block.match(/impacts: \[([^\]]+)\]/);
    const impacts = impactMatch?.[1]?.split(',').map((s) => s.trim()) || [];
    const row = { id, root_cause, lifecycle, status, exit_condition, note, impacts, discovered_at, closed_at, active };
    row.lifecycle = issueLifecycle(row);
    issues.push(row);
  }
  return issues;
}

function parseExecutionPolicy(text) {
  const block = text.split('execution_policy:')[1]?.split('\n\n')[0] || '';
  return {
    one_root_cause_at_a_time: /one_root_cause_at_a_time: true/.test(block),
    no_skip_sprint: /no_skip_sprint: true/.test(block),
    active_sprint: block.match(/\n  active_sprint: (.+)/)?.[1]?.trim(),
    sprint_label: block.match(/\n  sprint_label: (.+)/)?.[1]?.trim(),
  };
}

function parseActiveSprint(text) {
  const block = (text.replace(/\r\n/g, '\n').split('sprints:')[1] || '').split('\n\nmetrics:')[0] || '';
  const chunk = block.split(/\n  - id: /).slice(1).find((c) => /status: in_progress/.test(c));
  if (!chunk) return null;
  const id = chunk.match(/^(\S+)/)?.[1];
  const goal = chunk.match(/\n    goal: (.+)/)?.[1];
  const root_cause = chunk.match(/\n    root_cause: (.+)/)?.[1];
  const label = chunk.match(/\n    label: (.+)/)?.[1];
  const sprint_exit = [...chunk.matchAll(/\n      - (.+)/g)].map((m) => m[1]);
  const execution_one_liner = chunk.match(/\n    execution_one_liner: (.+)/)?.[1];
  const today_kpi = chunk.match(/\n    today_kpi: (.+)/)?.[1];
  const active_root_cause = chunk.match(/\n    active_root_cause: (.+)/)?.[1];
  return { id, label, goal, root_cause: active_root_cause || root_cause, sprint_exit, sprint_review, execution_one_liner, today_kpi, active_root_cause };
}

function gateVerdictPass(verdict) {
  return verdict === 'pass' || verdict === 'PASS';
}

function allHatPass(hat) {
  return hat.roles.every((r) =>
    hat.steps.every((s) => {
      const v = r.cells[s.id]?.verdict;
      return v === 'na' || gateVerdictPass(v);
    }),
  );
}

function allBfmPass(flows) {
  return (
    flows.length > 0 &&
    flows.every(
      (f) =>
        (!f.flow_verdict || gateVerdictPass(f.flow_verdict)) &&
        f.steps.length > 0 &&
        f.steps.every((s) => gateVerdictPass(s.verdict)),
    )
  );
}

function allManualPass(checks) {
  return checks.length > 0 && checks.every((c) => gateVerdictPass(c.verdict));
}

function computeProductionEntryReady({ allBdrReady, hat, bfmFlows, manualChecks, openRootCauses }) {
  const gates = {
    business_data_readiness: allBdrReady ? 'READY' : 'NOT_READY',
    hat: allHatPass(hat) ? 'PASS' : 'NOT_PASS',
    business_flow_matrix: allBfmPass(bfmFlows) ? 'PASS' : 'NOT_PASS',
    manual_validation: allManualPass(manualChecks) ? 'PASS' : 'NOT_PASS',
    open_root_causes: openRootCauses,
  };
  const allMet =
    gates.business_data_readiness === 'READY' &&
    gates.hat === 'PASS' &&
    gates.business_flow_matrix === 'PASS' &&
    gates.manual_validation === 'PASS' &&
    gates.open_root_causes === 0;
  return {
    TT_PRODUCTION_ENTRY_READY: allMet ? 'YES' : 'NO_GO',
    gates,
    rule: 'Business Data READY AND HAT PASS AND Business Flow PASS AND Manual Validation PASS AND Open Root Causes=0',
  };
}

function parseTodayFocus(text) {
  const block = text.split('today_focus:')[1]?.split('\n\n')[0] || '';
  const get = (k) => block.match(new RegExp(`\\n  ${k}: (.+)`))?.[1]?.trim()?.replace(/^"|"$/g, '');
  return {
    module: get('module'),
    execute_step: get('execute_step'),
    step1_day: get('step1_day'),
    reason: get('reason'),
    next: get('next'),
  };
}

function daysBetween(fromDate, toDate) {
  const a = new Date(fromDate);
  const b = new Date(toDate);
  return Math.round(((b - a) / 86400000) * 10) / 10;
}

function computeMttc(issues) {
  const today = new Date().toISOString().slice(0, 10);
  const closed = issues
    .filter((i) => issueLifecycle(i) === 'CLOSED' && i.discovered_at && i.closed_at)
    .map((i) => ({
      id: i.id,
      discovered_at: i.discovered_at,
      closed_at: i.closed_at,
      mttc_days: daysBetween(i.discovered_at, i.closed_at),
    }));
  const open_ages = issues
    .filter((i) => isOpenRootCause(i) && i.discovered_at)
    .map((i) => ({
      id: i.id,
      discovered_at: i.discovered_at,
      open_age_days: daysBetween(i.discovered_at, today),
    }));
  const average_mttc_days =
    closed.length > 0
      ? Math.round((closed.reduce((s, x) => s + x.mttc_days, 0) / closed.length) * 10) / 10
      : null;
  return { closed, open_ages, average_mttc_days, sample_size_closed: closed.length };
}

function parseChecklistRows(text) {
  const rows = [];
  for (const block of text.split(/\n  - id: /).slice(1)) {
    const id = block.match(/^(cms|business_data_readiness|hat|business_flow_matrix|manual_validation|production_entry)/)?.[1];
    if (!id) continue;
    const get = (k) => block.match(new RegExp(`\\n    ${k}: (.+)`))?.[1]?.trim()?.replace(/^"|"$/g, '');
    rows.push({
      id,
      module: get('module'),
      execute_step: get('execute_step'),
      priority: get('priority'),
      status: get('status'),
      blocker: get('blocker'),
      next: get('next'),
    });
  }
  return rows;
}

function countBlocking(items, getVerdict) {
  return items.filter((x) => isBlocking(getVerdict(x))).length;
}

function verdictIcon(v) {
  if (v === 'pass') return '✅';
  if (v === 'fail') return '❌';
  if (v === 'na') return '—';
  if (v === 'blocked') return '🚫';
  return '⬜';
}

function formatRemark(role, steps) {
  const parts = [];
  if (role.remark) parts.push(role.remark);
  for (const s of steps) {
    const cell = role.cells[s.id];
    if (cell?.note && cell.verdict !== 'pass' && cell.verdict !== 'na') {
      parts.push(`${s.label}: ${cell.note}`);
    }
  }
  return parts.join(' · ') || '—';
}

function computeDailyDelta(prevDoc, allIssues, openRootCauses, blockingChecksTotal, activeSprint) {
  const prevIssues = prevDoc?.open_issues?.all || [];
  const prevById = Object.fromEntries(prevIssues.map((i) => [i.id, issueLifecycle(i)]));

  const newRootCauses = [];
  const closedToday = [];
  const lifecycleTransitions = [];

  for (const issue of allIssues) {
    const prevLc = prevById[issue.id];
    const lc = issueLifecycle(issue);
    if (isOpenRootCause(issue) && (!prevLc || prevLc === 'CLOSED')) {
      newRootCauses.push(issue.id);
    }
    if (prevLc && prevLc !== 'CLOSED' && lc === 'CLOSED') {
      closedToday.push(issue.id);
    }
    if (prevLc && prevLc !== lc) {
      lifecycleTransitions.push({ id: issue.id, from: prevLc, to: lc });
    }
  }

  const activeIssue = allIssues.find((i) => i.id === activeSprint?.root_cause);
  const activeLifecycle = activeIssue ? issueLifecycle(activeIssue) : null;

  const prevRC = prevDoc?.metrics?.open_root_causes?.current ?? null;
  const prevBC = prevDoc?.metrics?.blocking_checks?.current ?? null;

  return {
    date: new Date().toISOString().slice(0, 10),
    new_root_causes: { count: newRootCauses.length, ids: newRootCauses },
    closed_today: { count: closedToday.length, ids: closedToday },
    fixed_root_causes: { count: closedToday.length, ids: closedToday },
    lifecycle_transitions: lifecycleTransitions,
    active_sprint_issue: activeSprint?.root_cause || null,
    active_sprint_lifecycle: activeLifecycle,
    open_root_causes: {
      previous: prevRC,
      current: openRootCauses,
      delta: prevRC != null ? openRootCauses - prevRC : null,
      reduced: prevRC != null ? openRootCauses < prevRC : false,
      net: prevRC != null ? `${prevRC} → ${openRootCauses}${openRootCauses - prevRC > 0 ? ` (+${openRootCauses - prevRC})` : openRootCauses - prevRC < 0 ? ` (${openRootCauses - prevRC})` : ''}` : null,
    },
    blocking_checks: {
      previous: prevBC,
      current: blockingChecksTotal,
      delta: prevBC != null ? blockingChecksTotal - prevBC : null,
      net: prevBC != null ? `${prevBC} → ${blockingChecksTotal}${blockingChecksTotal - prevBC < 0 ? ` (${blockingChecksTotal - prevBC})` : blockingChecksTotal - prevBC > 0 ? ` (+${blockingChecksTotal - prevBC})` : ''}` : null,
    },
    interpretation:
      closedToday.length > 0
        ? 'closed_root_cause'
        : newRootCauses.length > 0
          ? 'discovering_more'
          : 'continue_sprint',
  };
}

function computeDailyThreeQuestions(activeSprint, dailyDelta, guideDay1) {
  const closed = dailyDelta.closed_today;
  const rc = dailyDelta.open_root_causes;
  return {
    q1_active_sprint: {
      label: 'Active Sprint 是什么？',
      sprint: activeSprint?.label || '—',
      goal: activeSprint?.goal || '—',
      root_cause: activeSprint?.root_cause || '—',
      lifecycle: dailyDelta.active_sprint_lifecycle || 'OPEN',
    },
    q2_closed_today: {
      label: '今天关闭了什么？',
      closed: closed.ids,
      summary:
        closed.count > 0
          ? closed.ids.map((id) => `${id}: → CLOSED`).join(' · ')
          : `${dailyDelta.active_sprint_issue || '—'}: ${dailyDelta.active_sprint_lifecycle || 'OPEN'} · 未关闭 · 继续`,
    },
    q3_open_root_causes: {
      label: 'Open Root Causes 是否减少？',
      previous: rc.previous,
      current: rc.current,
      reduced: rc.reduced,
      net: rc.net || String(rc.current),
      progress: rc.previous != null && rc.reduced ? 'YES' : rc.previous != null ? 'NO · 继续' : 'BASELINE',
    },
    guide_business_data_ready: guideDay1?.ready === 'YES' ? 'YES' : 'NO',
  };
}

function formatMd(doc) {
  const rc = doc.metrics.open_root_causes;
  const bc = doc.metrics.blocking_checks;
  const mttc = doc.metrics.mttc;
  const dd = doc.daily_delta;
  const dq = doc.daily_three_questions;
  const ep = doc.execution_policy;
  const sprint = doc.active_sprint;
  const pe = doc.production_go;

  return [
    '# Production Readiness · Daily',
    '',
    '## ① Active Sprint 是什么？',
    '',
    `**${dq.q1_active_sprint.sprint}** · Goal: **${dq.q1_active_sprint.goal}**`,
    `Root Cause（手段）: **${dq.q1_active_sprint.root_cause}** · Lifecycle: **${dq.q1_active_sprint.lifecycle}**`,
    '',
    '## ② 今天关闭了什么？',
    '',
    dq.q2_closed_today.summary,
    '',
    '## ③ Open Root Causes 是否减少？',
    '',
    `**${dq.q3_open_root_causes.net}** · ${dq.q3_open_root_causes.progress}`,
    '',
    `_Guide Business Data Ready: ${dq.guide_business_data_ready}_ · TT_PRODUCTION_ENTRY_READY: **${doc.TT_PRODUCTION_ENTRY_READY}**`,
    '',
    '---',
    '',
    '# Production Readiness Master Checklist',
    '',
    '| | |',
    '|---|---|',
    `| **Phase B Framework** | **${doc.phase_b_framework_status}** |`,
    `| **Active Sprint** | **${sprint?.label || ep.sprint_label || '—'} · ${sprint?.goal || '—'}** |`,
    `| **Root Cause（手段）** | **${sprint?.root_cause || ep.active_sprint || '—'}** |`,
    `| **Date** | ${doc.recorded_at_utc.slice(0, 10)} |`,
    `| **Open Root Causes** | **${rc.current}** |`,
    `| **Blocking Checks** | **${bc.current}** |`,
    `| **Avg MTTC (closed)** | **${mttc.average_mttc_days != null ? `${mttc.average_mttc_days} days` : '— (none closed yet)'}** |`,
    `| **TT_PRODUCTION_ENTRY_READY** | **${doc.TT_PRODUCTION_ENTRY_READY}** |`,
    '',
    '## Daily Delta · Today',
    '',
    '| | |',
    '|---|---|',
    `| **New Root Causes** | +${dd.new_root_causes.count}${dd.new_root_causes.ids.length ? ` (${dd.new_root_causes.ids.join(', ')})` : ''} |`,
    `| **Closed Today** | -${dd.closed_today.count}${dd.closed_today.ids.length ? ` (${dd.closed_today.ids.join(', ')})` : ''} |`,
    `| **Open Root Causes** | ${dd.open_root_causes.net || `${rc.current}`} |`,
    `| **Blocking Checks** | ${dd.blocking_checks.net || `${bc.current}`} |`,
    '',
    `_Today: ${dd.interpretation === 'closed_root_cause' ? '关闭 Root Cause' : dd.interpretation === 'discovering_more' ? '发现新问题' : '继续 Sprint'}_`,
    '',
    '## MTTC · Mean Time To Close',
    '',
    '| ID | Discovered | Closed / Age | Days |',
    '|----|------------|--------------|------|',
    ...mttc.closed.map(
      (x) => `| ${x.id} | ${x.discovered_at} | ${x.closed_at} | ${x.mttc_days} |`,
    ),
    ...mttc.open_ages.map(
      (x) => `| ${x.id} | ${x.discovered_at} | open | ${x.open_age_days} |`,
    ),
    '',
    `**Average MTTC (closed):** ${mttc.average_mttc_days != null ? `${mttc.average_mttc_days} days` : '—'}`,
    '',
    ...(sprint
      ? [
          '## Active Sprint',
          '',
          `**Goal:** ${sprint.goal}`,
          '',
          '**Exit:**',
          ...sprint.sprint_exit.map((x) => `- ${x}`),
          '',
        ]
      : []),
    '## Production Entry · Hard Gate',
    '',
    '| Gate | Required | Current |',
    '|------|----------|---------|',
    `| Business Data | READY | ${pe.gates.business_data_readiness} |`,
    `| HAT | PASS | ${pe.gates.hat} |`,
    `| Business Flow | PASS | ${pe.gates.business_flow_matrix} |`,
    `| Manual Validation | PASS | ${pe.gates.manual_validation} |`,
    `| Open Root Causes | 0 | ${pe.gates.open_root_causes} |`,
    '',
    `**TT_PRODUCTION_ENTRY_READY:** **${doc.TT_PRODUCTION_ENTRY_READY}**`,
    '',
    '## Phase B Gates',
    '',
    '```',
    'Business Data READY → HAT PASS → Business Flow PASS → Manual Validation PASS → Production Entry',
    '```',
    '',
    '| Gate | 进入条件 | 当前 |',
    '|------|----------|------|',
    ...doc.phase_gates.map((g) => `| ${g.label} | ${g.enter_condition || '—'} | **${g.current}** |`),
    '',
    '## Business Data · 领域收口',
    '',
    '| 域 | Ready |',
    '|----|-------|',
    ...doc.business_data_domains.map((d) => `| ${d.label} | ${d.ready ? 'READY' : 'NOT_READY'} |`),
    '',
    `**Overall Business Data Readiness:** **${doc.business_data_overall}**`,
    '',
    `**${doc.today_focus.module}** (Day ${doc.today_focus.step1_day || 1}) → ${doc.today_focus.next}`,
    '',
    ...(doc.guide_day1_evidence
      ? [
          '### Guide Day 1 结论（Evidence）',
          '',
          '```',
          `Checks: ${doc.guide_day1_evidence.checks}`,
          `PASS: ${doc.guide_day1_evidence.pass}`,
          `WARN: ${doc.guide_day1_evidence.warn}`,
          `FAIL: ${doc.guide_day1_evidence.fail}`,
          `Open Root Causes: ${doc.guide_day1_evidence.open_root_causes.join(', ') || '—'}`,
          `Ready: ${doc.guide_day1_evidence.ready} (rule: FAIL=0 WARN<=1)`,
          '```',
          '',
        ]
      : ['_Run: node scripts/dev/run-guide-business-data-readiness-probes.cjs_', '']),
    '## Open Issues · Exit Condition',
    '',
    '| ID | Root Cause | Lifecycle | Exit Condition |',
    '|----|------------|-----------|----------------|',
    ...doc.open_issues.all.map(
      (i) => `| ${i.id} | ${i.root_cause} | ${issueLifecycle(i)} | ${i.exit_condition || '—'} |`,
    ),
    '',
    '## Master Checklist',
    '',
    '| 模块 | 步 | Linked Open | Blocking Checks |',
    '|------|----|-------------|-----------------|',
    ...doc.rows.map(
      (r) =>
        `| ${r.module} | ${r.execute_step || '—'} | ${r.linked_open_issues} | ${r.blocking_checks} |`,
    ),
    '',
    '## HAT · 备注',
    '',
    '| 角色 | ' + doc.hat_matrix.steps.map((s) => s.label).join(' | ') + ' | 备注 |',
    '|------|' + doc.hat_matrix.steps.map(() => '------').join('|') + '|------|',
    ...doc.hat_matrix.roles.map((r) => {
      const cells = doc.hat_matrix.steps.map((s) => {
        const c = r.cells[s.id];
        if (!c || c.verdict === 'na') return '—';
        return verdictIcon(c.verdict);
      });
      return `| ${r.label} | ${cells.join(' | ')} | ${formatRemark(r, doc.hat_matrix.steps)} |`;
    }),
    '',
    '```bash',
    'node scripts/dev/run-production-readiness-master-checklist.cjs',
    'node scripts/dev/run-guide-business-data-readiness-probes.cjs',
    '```',
  ].join('\n');
}

function main() {
  const stamp = new Date().toISOString();
  const prevDoc = readJson(OUT_JSON);

  const bdrText = readText(FILES.bdr);
  const hatText = readText(FILES.hat);
  const bfmText = readText(FILES.bfm);
  const manualText = readText(FILES.manual);
  const issuesText = readText(FILES.issues);
  const checklistText = readText(FILES.checklist);

  const bdrChecks = parseBdrChecks(bdrText);
  const bdrBlocking = countBlocking(bdrChecks, (x) => x.verdict);

  const hat = parseHatMatrix(hatText);
  let hatBlocking = 0;
  for (const role of hat.roles) {
    for (const step of hat.steps) {
      const c = role.cells[step.id];
      if (c && c.verdict !== 'na' && isBlocking(c.verdict)) hatBlocking += 1;
    }
  }

  const bfmFlows = parseBfmFlows(bfmText);
  const bfmBlocking = countBlocking(bfmFlows.flatMap((f) => f.steps), (x) => x.verdict);

  const manualChecks = parseManualChecks(manualText);
  const manualBlocking = countBlocking(manualChecks, (x) => x.verdict);

  const allIssues = parseOpenIssues(issuesText);
  const openIssues = allIssues.filter((i) => isOpenRootCause(i));
  const openRootCauses = openIssues.length;

  const blockingChecksTotal = bdrBlocking + hatBlocking + bfmBlocking + manualBlocking + 1;

  const impactMap = {
    business_data_readiness: 'business_data_readiness',
    hat: 'hat',
    business_flow_matrix: 'business_flow_matrix',
    manual_validation: 'manual_validation',
  };

  function linkedOpenIssues(moduleId) {
    const key = impactMap[moduleId];
    if (!key) return moduleId === 'production_entry' ? openRootCauses : 0;
    return openIssues.filter((i) => i.impacts.includes(key)).length;
  }

  const blockingById = {
    cms: 0,
    business_data_readiness: bdrBlocking,
    hat: hatBlocking,
    business_flow_matrix: bfmBlocking,
    manual_validation: manualBlocking,
    production_entry: 1,
  };

  const rows = parseChecklistRows(checklistText).map((r) => ({
    ...r,
    blocking_checks: blockingById[r.id] ?? 0,
    linked_open_issues: linkedOpenIssues(r.id),
  }));

  const prevRC = prevDoc?.metrics?.open_root_causes?.current ?? null;
  const prevBC = prevDoc?.metrics?.blocking_checks?.current ?? null;

  const bdrModules = ['guide', 'provider', 'poi', 'pricing', 'availability', 'listings'];
  const bdrModuleStats = bdrModules.map((modId) => {
    const block = bdrText.split(`  - id: ${modId}`)[1]?.split(/\n  - id: /)[0] || '';
    const checks = [...block.matchAll(/\{ id: (\w+), label: ([^,]+), verdict: (\w+) \}/g)].map((m) => ({
      verdict: m[3],
    }));
    return {
      id: modId,
      label: block.match(/\n    label: (.+)/)?.[1] || modId,
      blocking_checks: countBlocking(checks, (x) => x.verdict),
    };
  });

  const guideDay1 = readJson(FILES.guideDay1);
  const providerDay2 = readJson(FILES.providerDay2);
  const listingsDay3 = readJson(FILES.listingsDay3);
  const poiDay4 = readJson(FILES.poiDay4);
  const pricingDay5 = readJson(FILES.pricingDay5);
  const executionPolicy = parseExecutionPolicy(issuesText);
  const activeSprint = parseActiveSprint(issuesText);
  const todayFocus = parseTodayFocus(checklistText);
  const mttc = computeMttc(allIssues);

  const dailyDelta = computeDailyDelta(prevDoc, allIssues, openRootCauses, blockingChecksTotal, activeSprint);
  const dailyThreeQuestions = computeDailyThreeQuestions(activeSprint, dailyDelta, guideDay1);

  const businessDataDomains = [
    { id: 'guide', label: 'Guide', ready: guideDay1?.ready === 'YES' },
    { id: 'provider', label: 'Provider', ready: providerDay2?.ready === 'YES' },
    { id: 'listings', label: 'Listings', ready: listingsDay3?.ready === 'YES' },
    { id: 'poi', label: 'POI', ready: poiDay4?.ready === 'YES' },
    { id: 'pricing', label: 'Pricing', ready: pricingDay5?.ready === 'YES' },
  ];
  const allBdrReady = businessDataDomains.every((d) => d.ready);

  const productionEntry = computeProductionEntryReady({
    allBdrReady,
    hat,
    bfmFlows,
    manualChecks,
    openRootCauses,
  });

  const phaseGates = [
    {
      id: 'business_data_readiness',
      label: 'Business Data Readiness',
      enter_condition: '—',
      current: allBdrReady ? 'READY' : guideDay1?.ready === 'YES' ? 'PARTIAL' : 'NOT_READY',
    },
    {
      id: 'hat',
      label: 'HAT',
      enter_condition: 'Business Data = READY',
      current: allHatPass(hat) ? 'PASS' : 'NOT_PASS',
    },
    {
      id: 'business_flow_matrix',
      label: 'Business Flow',
      enter_condition: 'HAT = PASS',
      current: allBfmPass(bfmFlows) ? 'PASS' : 'NOT_PASS',
    },
    {
      id: 'manual_validation',
      label: 'Manual Validation',
      enter_condition: 'Business Flow = PASS',
      current: allManualPass(manualChecks) ? 'PASS' : 'NOT_PASS',
    },
    {
      id: 'production_entry',
      label: 'Production Entry',
      enter_condition: 'All gates + Open Root Causes = 0',
      current: productionEntry.TT_PRODUCTION_ENTRY_READY,
    },
  ];

  const doc = {
    schema: 'traveltrust.production_readiness_master_checklist_evidence.v9',
    recorded_at_utc: stamp,
    phase: 'B',
    phase_b_framework_status: 'FROZEN',
    phase_b_execution: 'ACTIVE',
    TT_PRODUCTION_READINESS_MASTER_CHECKLIST: 'ACTIVE',
    TT_PRODUCTION_READINESS_PHASE_B_FRAMEWORK: 'FROZEN',
    TT_PRODUCTION_READINESS_PHASE_B_EXECUTION: 'STARTED',
    TT_CMS_PHASE_A: 'FROZEN',
    TT_PRODUCTION_ENTRY_READY: productionEntry.TT_PRODUCTION_ENTRY_READY,
    execution_policy: executionPolicy,
    active_sprint: activeSprint,
    daily_delta: dailyDelta,
    daily_three_questions: dailyThreeQuestions,
    project_discipline: {
      progress_metric: 'Open Root Causes 是否减少',
      forbidden: ['Registry', 'Matrix', 'Checklist', 'Sprint design', 'Gate design'],
    },
    lifecycle_chain: 'OPEN → FIXING → IN_VALIDATION → CLOSED',
    phase_gates: phaseGates,
    business_data_domains: businessDataDomains,
    business_data_overall: allBdrReady ? 'READY' : 'NOT_READY',
    guide_day1_evidence: guideDay1
      ? {
          checks: guideDay1.checks_total,
          pass: guideDay1.pass,
          warn: guideDay1.warn ?? 0,
          fail: guideDay1.fail,
          open_root_causes: guideDay1.open_root_causes || [],
          cascade_notes: guideDay1.cascade_notes || [],
          ready: guideDay1.ready,
          ready_rule: guideDay1.ready_rule,
        }
      : null,
    metrics: {
      open_root_causes: {
        label: 'Open Root Causes',
        current: openRootCauses,
        previous: prevRC,
        delta: prevRC != null ? prevRC - openRootCauses : null,
        ssot: 'registry/production-readiness-open-issues.v1.yaml',
      },
      blocking_checks: {
        label: 'Blocking Checks',
        current: blockingChecksTotal,
        previous: prevBC,
        delta: prevBC != null ? prevBC - blockingChecksTotal : null,
        by_module: {
          business_data_readiness: bdrBlocking,
          hat: hatBlocking,
          business_flow_matrix: bfmBlocking,
          manual_validation: manualBlocking,
          production_entry: 1,
        },
      },
      mttc: {
        label: 'Mean Time To Close (days)',
        average_mttc_days: mttc.average_mttc_days,
        sample_size_closed: mttc.sample_size_closed,
        closed: mttc.closed,
        open_ages: mttc.open_ages,
      },
    },
    production_go: {
      current: productionEntry.TT_PRODUCTION_ENTRY_READY,
      ssot: 'TT_PRODUCTION_ENTRY_READY',
      rule: productionEntry.rule,
      gates: productionEntry.gates,
    },
    today_focus: todayFocus.module
      ? todayFocus
      : {
          module: 'Sprint A · BD-001',
          execute_step: 1,
          step1_day: 1,
          reason: '一次只处理一个 Root Cause',
          next: 'Validation 3× PASS → Exit Condition → fixed',
        },
    rows,
    open_issues: {
      ssot: 'registry/production-readiness-open-issues.v1.yaml',
      open_count: openRootCauses,
      total_count: allIssues.length,
      open: openIssues,
      all: allIssues,
    },
    business_data_readiness: {
      blocking_checks: bdrBlocking,
      modules: bdrModuleStats,
    },
    hat_matrix: {
      blocking_checks: hatBlocking,
      steps: hat.steps,
      roles: hat.roles,
    },
    business_flow_matrix: {
      blocking_checks: bfmBlocking,
      flows: bfmFlows,
    },
    manual_validation: {
      blocking_checks: manualBlocking,
      checks: manualChecks,
    },
  };

  fs.mkdirSync(EVID_DIR, { recursive: true });
  const dailyDir = path.join(EVID_DIR, 'daily');
  fs.mkdirSync(dailyDir, { recursive: true });
  const dailyPath = path.join(dailyDir, `PRODUCTION-READINESS-DAILY-${dailyDelta.date}.json`);
  fs.writeFileSync(
    dailyPath,
    JSON.stringify(
      { date: dailyDelta.date, daily_three_questions: dailyThreeQuestions, daily_delta: dailyDelta, metrics: doc.metrics },
      null,
      2,
    ) + '\n',
  );
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatMd(doc) + '\n');

  const dq = dailyThreeQuestions;
  console.log('TT_PRODUCTION_READINESS: Production Readiness Sprint · Sprint A');
  console.log(`Execution: ${activeSprint?.execution_one_liner || '只验证并关闭 BD-001'}`);
  console.log(`Today KPI: ${activeSprint?.today_kpi || 'OPEN → IN_VALIDATION → CONFIRMED → CLOSED'}`);
  console.log('');
  console.log('① Active Sprint:', `${dq.q1_active_sprint.sprint} · ${dq.q1_active_sprint.goal}`);
  console.log(`   ${dq.q1_active_sprint.root_cause} · ${dq.q1_active_sprint.lifecycle}`);
  console.log('② Closed today:', dq.q2_closed_today.summary);
  console.log('③ Open RC:', dq.q3_open_root_causes.net, '·', dq.q3_open_root_causes.progress);
  console.log('');
  console.log(`Guide Business Data Ready: ${dq.guide_business_data_ready}`);
  console.log(`TT_PRODUCTION_ENTRY_READY: ${productionEntry.TT_PRODUCTION_ENTRY_READY}`);
  console.log(`Evidence: ${OUT_JSON}`);
  console.log(`Daily: ${dailyPath}`);
}

main();
