#!/usr/bin/env node
/**
 * FPC B36 · consumer truthfulness scan (locale · vitest · mock isolation) @ ①
 *
 *   node scripts/dev/run-fpc-truthfulness-consumer-scan.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const FE = path.join(ROOT, 'frontend');
const EVID_DIR = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B36-truthfulness'
);

const CONSUMER_KEY_PREFIXES = [
  'market_',
  'home_',
  'landing_',
  'pay_',
  'escrow_',
  'orders_',
  'community_',
  'footer_',
  'header_',
  'traveltrust_',
  'me_',
  'publish_hub_',
  'help_',
  'trust_',
  'providerRegister_',
  'governance_',
  'steward_',
];

const ALLOWLIST_KEY_PREFIXES = ['pay_mockPay_', 'ui_placeholder_', 'admin_'];

/** Explicit allowlist — honest deferred boundaries documented @ ① */
const ALLOWLIST_KEYS = new Set([
  'traveltrust_footer_social_pending_line',
  'traveltrust_announcements_network_none',
  'steward_workbench_todo_aria',
  'steward_workbench_todo_title',
  'steward_workbench_todo_subtitle',
  'steward_workbench_todo_create_proposal',
  'steward_workbench_todo_proposals',
  'steward_workbench_todo_proposals_desc',
  'steward_workbench_todo_delegate',
  'steward_workbench_todo_delegate_desc',
  'steward_workbench_todo_claim',
  'steward_workbench_todo_claim_desc',
  'steward_workbench_todo_badge_proposals',
  'steward_workbench_todo_badge_delegate',
  'steward_workbench_todo_badge_claim',
  'steward_workbench_todo_locked_title',
  'steward_workbench_todo_locked_body',
  'steward_workbench_subtitle',
]);

const FORBIDDEN_VALUE = [
  { id: 'coming_soon', re: /\bcoming\s+soon\b/i },
  { id: 'todo_marker', re: /\bTODO\b/ },
  { id: 'fake_data', re: /\bfake\s+data\b/i },
  { id: 'lorem_ipsum', re: /lorem\s+ipsum/i },
  { id: 'demo_only', re: /\bdemo\s+only\b/i },
  { id: 'phase_a_placeholder', re: /Phase A 后续|Coming in Phase A/i },
  { id: 'mock_stats_hover', re: /mock stats/i },
];

function sh(cmd, cwd) {
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 300_000 });
}

function extractLocaleKeys(src) {
  const keys = {};
  const re = /^\s{2}([a-zA-Z0-9_]+):\s*(?:"([^"]*)"|'([^']*)')/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    keys[m[1]] = m[2] ?? m[3] ?? '';
  }
  return keys;
}

function isConsumerKey(key) {
  if (ALLOWLIST_KEY_PREFIXES.some((p) => key.startsWith(p))) return false;
  return CONSUMER_KEY_PREFIXES.some((p) => key.startsWith(p));
}

function scanLocales() {
  const violations = [];
  for (const file of ['locales/zh.ts', 'locales/en.ts']) {
    const src = fs.readFileSync(path.join(FE, file), 'utf8');
    const keys = extractLocaleKeys(src);
    for (const [key, value] of Object.entries(keys)) {
      if (!isConsumerKey(key)) continue;
      if (ALLOWLIST_KEYS.has(key)) continue;
      if (!value || value === '—' || value === '-') continue;
      for (const rule of FORBIDDEN_VALUE) {
        if (rule.re.test(value)) {
          violations.push({ file, key, rule: rule.id, sample: value.slice(0, 120) });
        }
      }
    }
  }
  return violations;
}

function checkMockIsolation() {
  const checks = [];
  const gateway = fs.readFileSync(
    path.join(FE, 'components/traveltrust/cinematic/TravelTrustStablecoinGateway.tsx'),
    'utf8'
  );
  checks.push({
    id: 'mock_pay_ui_gated',
    pass: gateway.includes('allowChainOffMockPayUi') && gateway.includes('showMockSwapUi'),
  });
  const hygiene = fs.readFileSync(path.join(FE, 'lib/publicChromeHygiene.ts'), 'utf8');
  checks.push({
    id: 'test_persona_sanitized',
    pass: hygiene.includes('publicChromeDisplayName') && hygiene.includes('allowPublicTestPersonaChrome'),
  });
  const spacing = fs.readFileSync(path.join(FE, 'lib/traveltrustSpacingDebug.ts'), 'utf8');
  checks.push({
    id: 'spacing_debug_gated',
    pass: spacing.includes('allowTravelTrustSpacingDebugChrome'),
  });
  return { pass: checks.every((c) => c.pass), checks };
}

function main() {
  const findings = [];
  const localeViolations = scanLocales();
  if (localeViolations.length) {
    for (const v of localeViolations.slice(0, 20)) {
      findings.push({
        id: `locale_${v.rule}`,
        severity: 'P0',
        detail: `${v.file}:${v.key} → ${v.sample}`,
      });
    }
  }

  const mockIsolation = checkMockIsolation();
  if (!mockIsolation.pass) {
    findings.push({ id: 'mock_isolation', severity: 'P0', detail: JSON.stringify(mockIsolation.checks) });
  }

  let vitestOk = true;
  let vitestSummary = '';
  try {
    vitestSummary = sh(
      'npx vitest run lib/l5/l5EdgeCaseExceptionAudit.contract.test.ts lib/publicChromeHygiene.test.ts lib/travelTrustUiGuards.test.ts --reporter=dot 2>&1',
      FE
    );
    vitestOk = /Tests\s+\d+\s+passed/.test(vitestSummary) && !/Tests\s+0\s+passed/.test(vitestSummary);
  } catch (e) {
    vitestOk = false;
    vitestSummary = (e.stdout || '') + (e.stderr || '');
  }
  if (!vitestOk) {
    findings.push({ id: 'truthfulness_vitest', severity: 'P0', detail: vitestSummary.slice(-1500) });
  }

  const pass = findings.length === 0;
  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, 'truthfulness-consumer-scan-latest.json'),
    JSON.stringify(
      {
        schema: 'traveltrust.fpc_100_truthfulness_consumer_scan.v1',
        timestamp_utc: new Date().toISOString(),
        pass,
        locale_violations: localeViolations,
        mock_isolation: mockIsolation,
        vitest_ok: vitestOk,
        findings,
      },
      null,
      2
    ) + '\n'
  );

  console.log(
    `TT_FPC_TRUTHFULNESS_SCAN: ${pass ? 'OK' : 'FAIL'} locale_violations=${localeViolations.length} findings=${findings.length}`
  );
  if (!pass) {
    for (const f of findings.slice(0, 10)) console.error(`  ${f.id}: ${f.detail?.slice(0, 200)}`);
    process.exit(1);
  }
  process.exit(0);
}

main();
