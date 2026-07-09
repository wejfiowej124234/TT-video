#!/usr/bin/env node
/**
 * Sprint Review · 关闭 Root Cause 后写极短回顾（含 Lesson Learned）
 *
 *   node scripts/dev/write-sprint-review.cjs --sprint A --issue BD-001 --result CLOSED \
 *     --found "Guide Availability 未配置" --validation "连续 3 次 PASS" \
 *     --impact "Availability,Pricing,HAT Guide 下单" \
 *     --lesson "Availability 缺失会导致 Pricing Probe 连锁失败；Pricing FAIL 须先验证 Availability"
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const ISSUES_YAML = path.join(ROOT, 'registry/production-readiness-open-issues.v1.yaml');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      out[key] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
    }
  }
  return out;
}

function readYaml(p) {
  return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
}

function parseSprint(text, sprintId) {
  const block = text.split('sprints:')[1]?.split('\n\nmetrics:')[0] || '';
  for (const chunk of block.split(/\n  - id: /).slice(1)) {
    const id = chunk.match(/^(\S+)/)?.[1];
    if (id !== sprintId) continue;
    const goal = chunk.match(/\n    goal: (.+)/)?.[1];
    const root_cause = chunk.match(/\n    root_cause: (.+)/)?.[1];
    const review = chunk.match(/\n    sprint_review: (.+)/)?.[1];
    const label = chunk.match(/\n    label: (.+)/)?.[1];
    return { id: sprintId, label, goal, root_cause, sprint_review: review };
  }
  return null;
}

function parseIssue(text, issueId) {
  const issuesBlock = text.split('\nissues:')[1] || '';
  for (const block of issuesBlock.split(/\n  - id: /).slice(1)) {
    const id = block.match(/^(\S+)/)?.[1];
    if (id !== issueId) continue;
    const lifecycle = block.match(/\n    lifecycle: (\w+)/)?.[1];
    const status = block.match(/\n    status: (\w+)/)?.[1];
    return {
      id: issueId,
      root_cause: block.match(/\n    root_cause: (.+)/)?.[1],
      discovered_at: block.match(/\n    discovered_at: "?([^"\n]+)"?/)?.[1],
      closed_at: block.match(/\n    closed_at: (.+)/)?.[1]?.trim()?.replace(/^"|"$/g, ''),
      lifecycle: lifecycle || (status === 'fixed' ? 'CLOSED' : 'OPEN'),
    };
  }
  return null;
}

function main() {
  const args = parseArgs();
  const sprintId = args.sprint || 'A';
  const issueId = args.issue || 'BD-001';
  const yaml = readYaml(ISSUES_YAML);
  const sprint = parseSprint(yaml, sprintId);
  const issue = parseIssue(yaml, issueId);

  if (!sprint || !issue) {
    console.error('Sprint or issue not found');
    process.exit(1);
  }

  const result = args.result || (issue.lifecycle === 'CLOSED' ? 'CLOSED' : 'IN_PROGRESS');
  const found = args.found || issue.root_cause || '—';
  const validation = args.validation || '—';
  const impact = args.impact || '—';
  const lesson =
    args.lesson ||
    '—（关闭时补一句 Lesson Learned · 供日后 Pricing/Availability 类问题参考）';
  const today = new Date().toISOString().slice(0, 10);

  const lines =
    result === 'CLOSED'
      ? [
          `# ${sprint.label} Review`,
          '',
          `**Sprint Goal:** ${sprint.goal}`,
          `**Root Cause:** ${issueId}`,
          `**Result:** CLOSED`,
          '',
          `**发现：** ${found}`,
          `**验证：** ${validation}`,
          `**影响：** ${impact}`,
          `**关闭：** ${issue.closed_at && issue.closed_at !== 'null' ? issue.closed_at : today}`,
          '',
          `**Lesson Learned：** ${lesson}`,
          '',
        ]
      : [
          `# ${sprint.label} Review`,
          '',
          `**Status:** IN PROGRESS`,
          `**Sprint Goal:** ${sprint.goal}`,
          `**Root Cause:** ${issueId} · Lifecycle: ${issue.lifecycle}`,
          '',
          '**Lifecycle:** OPEN → FIXING → IN_VALIDATION → CLOSED',
          '',
          '**Sprint Exit:**',
          '- Availability Probe PASS',
          '- Pricing Probe PASS',
          '- Guide HAT 下单 PASS',
          '- BD-001 CLOSED',
          '',
          `_关闭后补 Lesson Learned · node scripts/dev/write-sprint-review.cjs --sprint ${sprintId} --issue ${issueId} --result CLOSED --lesson "..."_`,
          '',
        ];

  const outPath = path.join(ROOT, sprint.sprint_review);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n') + '\n');
  console.log(`Sprint Review: ${outPath}`);
  console.log(`Status: ${result}`);
}

main();
