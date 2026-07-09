#!/usr/bin/env node
/**
 * Root Cause Validation · BD-001 · Sprint A Step 1–2
 * 只验证 Availability → Pricing 是否连锁 PASS · 不改 Pricing/HAT/其它数据
 *
 *   node scripts/dev/run-root-cause-validation-bd001.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const EVID_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step1/validation');
const OUT_JSON = path.join(EVID_DIR, 'BD-001-ROOT-CAUSE-VALIDATION-LATEST.json');
const OUT_MD = path.join(EVID_DIR, 'BD-001-ROOT-CAUSE-VALIDATION-LATEST.md');
const STREAK_JSON = path.join(EVID_DIR, 'BD-001-consecutive-pass-streak.json');
const AVAIL_PROBE = path.join(ROOT, 'evidence/GO_production_readiness/step1/probes/guide_availability_probe.json');
const PRICING_PROBE = path.join(ROOT, 'evidence/GO_production_readiness/step1/probes/guide_pricing_probe.json');
const CONSECUTIVE_REQUIRED = 3;

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  const stamp = new Date().toISOString();

  try {
    execSync('node scripts/dev/run-guide-business-data-readiness-probes.cjs', {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    });
  } catch {
    /* expected when FAIL */
  }

  const avail = readJson(AVAIL_PROBE);
  const pricing = readJson(PRICING_PROBE);
  const prevStreak = readJson(STREAK_JSON) || { consecutive_pass: 0, history: [] };

  const availV = avail?.verdict;
  const pricingV = pricing?.verdict;
  const pairPass = availV === 'PASS' && pricingV === 'PASS';

  let consecutive = pairPass ? prevStreak.consecutive_pass + 1 : 0;
  const history = [
    ...(prevStreak.history || []).slice(-9),
    { at: stamp, availability: availV, pricing: pricingV, pair_pass: pairPass, streak: consecutive },
  ];

  let validation;
  let validationCase;
  let recommendation;
  let nextSteps = [];

  if (availV === 'PASS' && pricingV === 'FAIL') {
    validation = 'CASE_B';
    validationCase = 'B';
    consecutive = 0;
    recommendation =
      'Case B · Availability PASS + Pricing FAIL · BD-001 仅解释 Availability · Pricing 独立';
    nextSteps = [
      '1) BD-001 → lifecycle CLOSED（Availability 归因）· closed_at · Sprint Review',
      '2) 登记 BD-004 Guide Pricing Configuration（须有 evidence · 验证后 · 验证前禁止创建）',
      '3) Sprint A 继续直到 Guide Business Data Ready',
      '4) 勿开始 BD-002 / HAT-003',
    ];
  } else if (!pairPass) {
    validation = 'PENDING';
    validationCase = null;
    consecutive = 0;
    recommendation =
      'Step 1 · 仅配置一条正确的 Guide Availability（staging）· 不改 Pricing/HAT/其它数据';
    nextSteps = [
      '配置 Availability 后重跑本脚本',
      'Case A: Avail+Pricing PASS → 进入 Step 2 连续 3 次验证',
    ];
  } else if (consecutive < CONSECUTIVE_REQUIRED) {
    validation = 'STREAK_IN_PROGRESS';
    validationCase = 'A';
    recommendation = `Case A · 双 PASS ${consecutive}/${CONSECUTIVE_REQUIRED} · 期间不修改代码 · 再跑 ${CONSECUTIVE_REQUIRED - consecutive} 次`;
    nextSteps = ['勿改代码 · 重跑本脚本直到 CONFIRMED'];
  } else {
    validation = 'CONFIRMED';
    validationCase = 'A';
    recommendation = `Case A · 连续 ${CONSECUTIVE_REQUIRED} 次 PASS · CONFIRMED · 进入 Step 3 Exit Condition`;
    nextSteps = [
      'Step 3: Availability + Pricing + Guide HAT 下单 PASS → BD-001 CLOSED',
      'Step 4: 重跑 Guide probes · Guide Business Data Ready YES',
      'Step 5: Open RC 5→4 · Sprint B',
    ];
  }

  const streakDoc = {
    schema: 'traveltrust.root_cause_validation_streak.v1',
    issue_id: 'BD-001',
    consecutive_pass_required: CONSECUTIVE_REQUIRED,
    consecutive_pass: consecutive,
    last_run_utc: stamp,
    history,
  };

  const doc = {
    schema: 'traveltrust.root_cause_validation.v3',
    recorded_at_utc: stamp,
    issue_id: 'BD-001',
    sprint: 'A',
    sprint_goal: 'Guide Business Data Ready',
    execution_one_liner: '只验证并关闭 BD-001 · 不改 Pricing/HAT/其它数据',
    TT_BD001_ROOT_CAUSE_VALIDATION: validation,
    validation_case: validationCase,
    consecutive_pass_required: CONSECUTIVE_REQUIRED,
    consecutive_pass: consecutive,
    probes: {
      availability: { verdict: availV, evidence: 'guide_availability_probe.json' },
      pricing: { verdict: pricingV, root_cause: pricing?.root_cause, evidence: 'guide_pricing_probe.json' },
    },
    decision_tree: {
      case_a: 'Availability PASS + Pricing PASS → CONFIRMED → 3x PASS → Step 3 Exit',
      case_b: 'Availability PASS + Pricing FAIL → BD-001 CLOSED(Avail) → BD-004（验证后登记）',
    },
    recommendation,
    next_steps: nextSteps,
    forbidden: ['修 Pricing', '修 HAT', 'BD-002', 'HAT-003', '框架扩展'],
  };

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(STREAK_JSON, JSON.stringify(streakDoc, null, 2) + '\n');
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(
    OUT_MD,
    [
      '# BD-001 · Sprint A Validation',
      '',
      `| **Validation** | **${validation}** |`,
      `| **Case** | ${validationCase || '—'} |`,
      `| **Consecutive PASS** | ${consecutive} / ${CONSECUTIVE_REQUIRED} |`,
      '',
      recommendation,
      '',
      '## Next Steps',
      '',
      ...nextSteps.map((s) => `- ${s}`),
      '',
      '```bash',
      'node scripts/dev/run-root-cause-validation-bd001.cjs',
      '```',
    ].join('\n') + '\n',
  );

  console.log(`\nTT_BD001_ROOT_CAUSE_VALIDATION: ${validation}`);
  if (validationCase) console.log(`Case: ${validationCase}`);
  console.log(`Consecutive PASS: ${consecutive}/${CONSECUTIVE_REQUIRED}`);
  console.log(recommendation);
  nextSteps.forEach((s) => console.log(s));
  console.log(`Evidence: ${OUT_JSON}`);
}

main();
