#!/usr/bin/env node
/**
 * Full-project payment rail deep audit — USDC Web3 Escrow SSOT vs legacy Stripe/mock-pay drift.
 *
 *   node scripts/dev/run-payment-usdc-web3-deep-audit.cjs
 *
 * Discipline: evidence + registry/docs alignment only — no business code mutation.
 * SSOT: registry/payment-architecture-classification.v1.yaml
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { request } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', 'Z');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/payment-deep-audit');
const RUN_DIR = path.join(EVID_ROOT, `audit-${STAMP.slice(0, 19)}`);
const PROD_API = (process.env.PROD_API || 'https://tt-api-prod.fly.dev').replace(/\/$/, '');

const SSOT = {
  core_rail: 'Web3 Escrow (USDC)',
  optional_rail: 'Stripe Optional Fiat Onboarding (P1)',
  prod_forbidden: ['P3_CHAIN_OFF=1 on prod', 'mock-pay on prod payment path'],
  architecture: 'registry/payment-architecture-classification.v1.yaml',
};

const SCAN_ROOTS = [
  'frontend/app/pay',
  'frontend/app/escrow',
  'frontend/components/escrow',
  'frontend/locales',
  'frontend/e2e',
  'crates/api/src/routes/orders',
  'registry',
  'docs/runbook',
  'scripts/dev',
  'deploy/fly',
];

const BLOCKERS = [];

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function addBlocker(priority, id, dimension, title, paths, fix, status = 'OPEN') {
  BLOCKERS.push({ priority, id, dimension, title, paths, fix, status });
}

function walkFiles(relDir, acc = []) {
  const abs = path.join(ROOT, relDir);
  if (!fs.existsSync(abs)) return acc;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'target'].includes(ent.name)) continue;
    const p = path.join(abs, ent.name);
    if (ent.isDirectory()) walkFiles(path.join(relDir, ent.name), acc);
    else if (/\.(tsx?|rs|yaml|md|sh|cjs|json|toml|example|local)$/.test(ent.name)) acc.push(path.relative(ROOT, p).replace(/\\/g, '/'));
  }
  return acc;
}

function grepFiles(files, pattern) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
  const hits = [];
  for (const f of files) {
    const t = readSafe(path.join(ROOT, f));
    if (!t || !re.test(t)) continue;
    const lines = t.split('\n');
    lines.forEach((line, i) => {
      if (re.test(line)) hits.push({ file: f, line: i + 1, snippet: line.trim().slice(0, 160) });
    });
  }
  return hits;
}

function checkLocaleKey(key) {
  const missing = [];
  for (const loc of ['frontend/locales/en.ts', 'frontend/locales/zh.ts']) {
    const t = readSafe(path.join(ROOT, loc));
    if (!t.includes(`${key}:`)) missing.push(loc);
  }
  return missing;
}

async function probeProdMeta() {
  const meta = await request(`${PROD_API}/meta`);
  const mockEnabled = meta.json?.orders?.order_mock_pay_enabled;
  return {
    http: meta.status,
    chain_id: meta.json?.chain?.chain_id,
    deployment_profile: meta.json?.build?.deployment_profile,
    order_mock_pay_enabled: mockEnabled,
    mock_pay_forbidden_ok: mockEnabled !== true,
  };
}

async function main() {
  mkdirp(RUN_DIR);
  const files = [];
  for (const r of SCAN_ROOTS) walkFiles(r, files);

  const dimensions = {};

  // --- Prod runtime ---
  const prodMeta = await probeProdMeta();
  dimensions.runtime_prod = prodMeta;
  if (!prodMeta.mock_pay_forbidden_ok) {
    addBlocker('P0', 'PAY-AUD-P0-001', 'config', 'Production mock-pay enabled via /meta', [PROD_API + '/meta'], 'Unset P3_CHAIN_OFF on tt-api-prod Fly secrets');
  }

  // --- Missing i18n ---
  const missingPayKey = checkLocaleKey('pay_mockPay_disabledNotice');
  dimensions.i18n = { pay_mockPay_disabledNotice_missing: missingPayKey };
  if (missingPayKey.length) {
    addBlocker(
      'P1',
      'PAY-AUD-P1-001',
      'UI/UX · 文案',
      'Missing locale key pay_mockPay_disabledNotice (broken /pay when mock-pay off)',
      ['frontend/app/pay/PayPagePrimaryCardMockPaySurfaces.tsx', ...missingPayKey],
      'Add en/zh strings directing users to escrow approve+deposit wallet flow',
    );
  }

  // --- USD vs USDC order default ---
  const enLoc = readSafe(path.join(ROOT, 'frontend/locales/en.ts'));
  const zhLoc = readSafe(path.join(ROOT, 'frontend/locales/zh.ts'));
  const usdcDefaultOk =
    /orders_defaultFiatCurrency:\s*"USDC"/.test(enLoc) && /orders_defaultFiatCurrency:\s*"USDC"/.test(zhLoc);
  dimensions.order_currency = { usdc_default_ok: usdcDefaultOk };
  if (!usdcDefaultOk) {
    addBlocker(
      'P1',
      'PAY-AUD-P1-002',
      '订单 · UI/UX',
      'New order flow defaults to USD fiat label vs USDC settlement SSOT',
      ['frontend/locales/en.ts', 'frontend/locales/zh.ts'],
      'Set orders_defaultFiatCurrency and orders_currencyPlaceholder to USDC',
    );
  }

  // --- Polygon hardcode vs Sepolia prod (primary user-facing keys) ---
  const primaryChainKeysOk =
    !/order_onChainPill:.*Polygon/.test(enLoc) &&
    !/order_onChain:.*Polygon/.test(enLoc) &&
    !/landing_payment_note:.*Polygon/.test(enLoc);
  dimensions.chain_branding = { primary_locale_keys_ok: primaryChainKeysOk };
  if (!primaryChainKeysOk) {
    addBlocker(
      'P1',
      'PAY-AUD-P1-003',
      '文案 · UI/UX',
      'Hardcoded Polygon chain branding on Sepolia production scope',
      ['frontend/locales/en.ts', 'frontend/locales/zh.ts'],
      'Drive chain label from GET /meta chain_id or neutral on-chain USDC escrow',
    );
  }

  // --- Legacy docs BLOCKER stripe ---
  const legacyDocs = grepFiles(
    files.filter((f) => f.startsWith('docs/')),
    /BLOCKER.*Stripe|Stripe live.*BLOCKER|Payment = Stripe|PI3-003.*必达|Wave 1\.4.*Stripe Live/,
  );
  dimensions.docs_drift = { legacy_stripe_as_core: legacyDocs.slice(0, 15) };
  for (const h of legacyDocs) {
    const body = readSafe(path.join(ROOT, h.file));
    if (/不阻断|P1 optional|不挡.*GO|Optional Fiat Onboarding/i.test(body)) continue;
    addBlocker(
      'P0',
      'PAY-AUD-P0-002',
      '配置 · 测试证据 · SSOT',
      'Legacy runbook/spec still lists Stripe Live as Production BLOCKER or core payment',
      [h.file],
      'Demote to P1 optional onboarding; reference payment-architecture-classification.v1.yaml',
    );
    break;
  }

  // --- Registry matrix PRM-WEB3 still PLANNED vs G3-02 PASS ---
  const matrix = readSafe(path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml'));
  const web3GapPlanned = /PRM-WEB3-PAY-B001[\s\S]{0,220}status: PLANNED/.test(matrix);
  const web3GapClosed = /PRM-WEB3-PAY-B001[\s\S]{0,220}status: CLOSED/.test(matrix);
  let g3Pass = false;
  try {
    const latest = JSON.parse(readSafe(path.join(ROOT, 'evidence/GO_production_readiness/G3-02/G3-02-EXECUTION-LATEST.json')));
    g3Pass = latest.overall_verdict === 'WEB3_PAYMENT_PRODUCTION_PASS' || latest.pay_items?.['PAY-W03'] === 'PASS';
  } catch {
    /* */
  }
  try {
    const gate = JSON.parse(readSafe(path.join(ROOT, 'evidence/GO_production_readiness/G3-02/WEB3-PAYMENT-PRODUCTION-READINESS-LATEST.json')));
    if (gate.verdict === 'WEB3_PAYMENT_PRODUCTION_PASS') g3Pass = true;
  } catch {
    /* */
  }
  dimensions.registry_sync = { PRM_WEB3_planned: web3GapPlanned, PRM_WEB3_closed: web3GapClosed, g3_02_pass_evidence: g3Pass };
  if (web3GapPlanned && !web3GapClosed && g3Pass) {
    addBlocker(
      'P1',
      'PAY-AUD-P1-004',
      '配置 · 测试证据',
      'Matrix PRM-WEB3-PAY-B001 still PLANNED while G3-02 gate evidence shows PASS',
      ['registry/production-readiness-master-matrix.v1.yaml'],
      'Close PRM-WEB3-PAY-B001 → CLOSED; sync machine keys in matrix v10',
    );
  }

  // --- PRM-STR g3_domain G3-02 ---
  if (/PRM-STR-B001[\s\S]{0,120}g3_domain: G3-02/.test(matrix)) {
    addBlocker(
      'P2',
      'PAY-AUD-P2-001',
      '配置',
      'PRM-STR-B001 tagged g3_domain G3-02 (Web3 payment domain) though Stripe is onboarding-only',
      ['registry/production-readiness-master-matrix.v1.yaml'],
      'Move to onboarding extension domain; keep blocks_production_go: false',
    );
  }

  // --- HAT matrix mock-pay as pay acceptance ---
  const hat = readSafe(path.join(ROOT, 'registry/hat-six-role-matrix.v1.yaml'));
  const hatHasSandboxLabel = /payment_rail_notes:|②.*mock-pay|sandbox|NOT prod USDC|core rail = USDC/.test(hat);
  if (/pay:.*mock-pay/.test(hat) && !hatHasSandboxLabel) {
    addBlocker(
      'P1',
      'PAY-AUD-P1-005',
      '测试证据',
      'HAT six-role matrix records trip pay acceptance via mock-pay not USDC escrow',
      ['registry/hat-six-role-matrix.v1.yaml'],
      'Split pay cell: trip=USDC escrow (②+) vs mock-pay (① only) vs onboarding=Stripe/USDC',
    );
  } else if (/pay:.*mock-pay/.test(hat)) {
    dimensions.hat_matrix = { mock_pay_annotated_sandbox: true };
  }

  // --- API IT acquisition mock-pay spine ---
  const itMock = grepFiles(
    files.filter((f) => f.includes('crates/api') && f.endsWith('.rs')),
    /mock-pay.*escrowed|accept → mock-pay/,
  );
  const itHasProdNote = itMock.every((h) => {
    const t = readSafe(path.join(ROOT, h.file));
    if (/Production 核心支付轨|G3-02|PAY-W01|P3_CHAIN_OFF=1|chain_off sandbox/.test(t)) return true;
    if (h.file.includes('orders_accept_mock_pay_itinerary_confirm_db_api_tests/')) {
      const mod = readSafe(
        path.join(ROOT, 'crates/api/src/routes/orders/tests/orders_accept_mock_pay_itinerary_confirm_db_api_tests/mod.rs'),
      );
      return /Production core payment|G3-02|PAY-W01/.test(mod);
    }
    return false;
  });
  dimensions.api_tests = { mock_pay_it_hits: itMock.length, prod_usdc_note: itHasProdNote };
  if (itMock.length && !itHasProdNote) {
    addBlocker(
      'P1',
      'PAY-AUD-P1-006',
      '托管 · 测试证据',
      'API integration tests document acquisition/order payment spine as mock-pay → escrowed',
      [...new Set(itMock.slice(0, 5).map((h) => h.file))],
      'Add parallel USDC deposit IT path; label mock-pay tests as chain_off only',
    );
  }

  // --- E2E mock-pay ---
  const e2eMock = grepFiles(
    files.filter((f) => f.startsWith('frontend/e2e/')),
    /mock-pay|mockPay/,
  );
  dimensions.e2e = { mock_pay_specs: e2eMock.length, sample: e2eMock.slice(0, 8) };
  addBlocker(
    'P2',
    'PAY-AUD-P2-002',
    '测试证据',
    `${e2eMock.length} E2E references use mock-pay as payment spine (acceptable ①/② sandbox if tagged)`,
    [...new Set(e2eMock.slice(0, 6).map((h) => h.file))],
    'Tag @e2e-chain-off-mock-pay vs @e2e-usdc-escrow; prod smoke must use wallet deposit only',
    'ACCEPTED_SANDBOX',
  );

  // --- Local dev default P3_CHAIN_OFF ---
  const devForce = grepFiles(
    ['scripts/dev/start-api-with-seed.bat', 'scripts/dev/start-api-with-seed-README.md'],
    /P3_CHAIN_OFF=1|force.*P3_CHAIN_OFF/,
  );
  dimensions.dev_defaults = { force_chain_off: devForce };
  addBlocker(
    'P2',
    'PAY-AUD-P2-003',
    '配置 · 钱包',
    'Local seed stack forces P3_CHAIN_OFF=1 — de-facto mock-pay as default dev payment rail',
    devForce.map((h) => h.file),
    'Document USDC chain-on dev path; mock-pay = debug rail only (honest-boundary banner)',
    'ACCEPTED_DEV',
  );

  // --- Onboarding Stripe (scoped OK) ---
  dimensions.onboarding_stripe = {
    classification: 'P1_FUTURE_FIAT_ONRAMP',
    note: 'MeOnboarding Stripe fallback OK when USDC env unset; admin Stripe ledger = ops Phase 01',
  };

  // --- SSOT files OK ---
  const ssotOk = [
    'registry/payment-architecture-classification.v1.yaml',
    'registry/production-payment-readiness-checklist.v1.yaml',
    'registry/production-go-four-gate-framework.v1.yaml',
    'registry/web3-payment-production-gate.v1.yaml',
  ].every((f) => fs.existsSync(path.join(ROOT, f)));
  dimensions.ssot_2026_07_08 = { files_present: ssotOk, core_rail: SSOT.core_rail };

  // Dedupe P0-002
  const seen = new Set();
  const deduped = BLOCKERS.filter((b) => {
    const k = `${b.priority}:${b.title}:${b.paths[0]}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const p0 = deduped.filter((b) => b.priority === 'P0' && b.status === 'OPEN').length;
  const p1 = deduped.filter((b) => b.priority === 'P1' && b.status === 'OPEN').length;
  const p2 = deduped.filter((b) => b.priority === 'P2' && b.status === 'OPEN').length;

  const verdict = p0 > 0 ? 'PAYMENT_RAIL_AUDIT_BLOCKERS_PRESENT' : p1 > 0 ? 'PAYMENT_RAIL_AUDIT_HIGH_DRIFT' : 'PAYMENT_RAIL_AUDIT_ACCEPTABLE_DRIFT';

  const manifest = {
    schema: 'traveltrust.payment_usdc_web3_deep_audit.v1',
    recorded_utc: new Date().toISOString(),
    stamp: STAMP,
    run_dir: path.relative(ROOT, RUN_DIR).replace(/\\/g, '/'),
    ssot: SSOT,
    prod_api: PROD_API,
    verdict,
    summary: {
      blockers_p0: p0,
      blockers_p1: p1,
      blockers_p2: p2,
      total_findings: deduped.length,
      prod_mock_pay_ok: prodMeta.mock_pay_forbidden_ok,
      g3_02_evidence_pass: g3Pass,
    },
    dimensions,
    blockers: deduped,
    scan_roots: SCAN_ROOTS,
    discipline: { business_code_modified: false, audit_only: true },
  };

  writeJson(path.join(RUN_DIR, 'PAYMENT-USDC-WEB3-DEEP-AUDIT.json'), manifest);
  writeJson(path.join(EVID_ROOT, 'PAYMENT-USDC-WEB3-DEEP-AUDIT-LATEST.json'), manifest);
  fs.writeFileSync(path.join(EVID_ROOT, 'PAYMENT-USDC-WEB3-BLOCKERS-LATEST.md'), renderMarkdown(manifest), 'utf8');
  fs.writeFileSync(path.join(RUN_DIR, 'PAYMENT-USDC-WEB3-BLOCKERS.md'), renderMarkdown(manifest), 'utf8');

  console.log(JSON.stringify({ verdict, p0, p1, p2, run_dir: manifest.run_dir }, null, 2));
}

function writeJson(p, obj) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

function renderMarkdown(m) {
  const lines = [
    '# Payment · USDC Web3 Deep Audit — Blockers & Fix Priority',
    '',
    `**Recorded:** ${m.recorded_utc}  `,
    `**Verdict:** \`${m.verdict}\`  `,
    `**SSOT:** ${m.ssot.core_rail} · Stripe = ${m.ssot.optional_rail}`,
    '',
    '## Summary',
    '',
    `| Priority | Open |`,
    `|----------|------|`,
    `| P0 | ${m.summary.blockers_p0} |`,
    `| P1 | ${m.summary.blockers_p1} |`,
    `| P2 | ${m.summary.blockers_p2} |`,
    '',
    `Prod mock-pay forbidden: **${m.summary.prod_mock_pay_ok ? 'OK' : 'FAIL'}** · G3-02 evidence pass: **${m.summary.g3_02_evidence_pass ? 'yes' : 'no'}**`,
    '',
    '## Architecture truth (2026-07-08)',
    '',
    '```text',
    'Core: Wallet → USDC approve → Escrow.deposit → Indexer → Order → Release → FeeRouter → Settlement → Ledger',
    'Optional: Stripe = onboarding fiat only (P1) · mock-pay = ① local / ② sandbox only · forbidden on prod',
    '```',
    '',
    '## Blocker list',
    '',
    '| Priority | ID | Dimension | Title | Fix |',
    '|----------|-----|-----------|-------|-----|',
  ];
  for (const b of m.blockers) {
    lines.push(`| ${b.priority} | ${b.id} | ${b.dimension} | ${b.title.replace(/\|/g, '/')} | ${b.fix.replace(/\|/g, '/')} |`);
  }
  lines.push('', '## Paths', '');
  for (const b of m.blockers) {
    lines.push(`### ${b.id} · ${b.title}`, '', `- **Priority:** ${b.priority} · **Status:** ${b.status}`, `- **Paths:** ${b.paths.map((p) => `\`${p}\``).join(', ')}`, '');
  }
  lines.push('---', '', '*Generated by scripts/dev/run-payment-usdc-web3-deep-audit.cjs*', '');
  return lines.join('\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
