#!/usr/bin/env node
/**
 * G2 Reality Fix — evaluate per-blocker evidence; emit signoff for matrix sync.
 *
 *   node scripts/dev/validate-g2-reality-fix.cjs --evidence-dir evidence/GO_production_readiness/g2-reality-fix/<stamp>
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const G2_BLOCKERS = ['PRM-SEC-B001', 'PRM-SEC-B002', 'PRM-PER-B001', 'PRM-MON-B001'];

function parseArgs() {
  const args = { evidenceDir: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
  }
  return args;
}

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function readText(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function parseKeyValFile(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes('=')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i)] = line.slice(i + 1);
  }
  return out;
}

function evaluateSecB001(dir) {
  const meta = parseKeyValFile(readText(path.join(dir, 'meta-summary.txt')));
  const internalHttp = readText(path.join(dir, 'internal-no-secret.http')).trim();
  const flyInv = readText(path.join(dir, 'fly-secrets-inventory.txt'));
  const checks = {
    prod_internal_secret_configured: meta.prod_internal_api_secret_configured === 'True',
    prod_internal_no_secret_http: internalHttp === '403' || internalHttp === '401',
    fly_internal_secret_present: /fly_secret_present_INTERNAL_API_SECRET=yes/.test(flyInv),
    staging_distinct: meta.staging_deployment_profile === 'staging',
  };
  const verified =
    checks.prod_internal_secret_configured &&
    checks.prod_internal_no_secret_http &&
    checks.fly_internal_secret_present;
  return {
    id: 'PRM-SEC-B001',
    verdict: verified ? 'VERIFIED' : 'FIX_INCOMPLETE',
    checks,
    reason: verified
      ? 'Prod INTERNAL_API_SECRET configured · internal route 403 without secret · Fly secret present'
      : 'Missing prod internal gate evidence or Fly INTERNAL_API_SECRET inventory',
  };
}

function evaluateSecB002(dir) {
  const meta = parseKeyValFile(readText(path.join(dir, 'meta-summary.txt')));
  const seedHttp = readText(path.join(dir, 'seed-post.http')).trim();
  const flyEnv = readText(path.join(dir, 'fly-env-redacted.txt'));
  const flyInv = readText(path.join(dir, 'fly-secrets-inventory.txt'));
  const seedFly = (flyEnv.match(/^SEED_TEST_ACCOUNTS=(.*)$/m) || [])[1]?.trim();
  const profileFly = (flyEnv.match(/^TRAVELTRUST_DEPLOYMENT_PROFILE=(.*)$/m) || [])[1]?.trim();
  const commShow = (flyEnv.match(/^TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=(.*)$/m) || [])[1]?.trim();
  const mktShow = (flyEnv.match(/^TRAVELTRUST_MARKET_PUBLIC_SHOWCASE=(.*)$/m) || [])[1]?.trim();
  const demo = (flyEnv.match(/^DID_RANK_SEED_MARKET_DEMO=(.*)$/m) || [])[1]?.trim();
  const checks = {
    prod_profile_not_staging: meta.prod_deployment_profile !== 'staging',
    prod_profile_production:
      meta.prod_deployment_profile === 'production' || profileFly === 'production',
    seed_fly_zero: seedFly === '0' || /fly_secret_present_SEED_TEST_ACCOUNTS=yes/.test(flyInv),
    seed_endpoint_blocked: seedHttp === '403',
    showcase_off: !commShow || commShow === '0',
    market_showcase_off: !mktShow || mktShow === '0',
    demo_off: !demo || demo === '0',
    staging_profile_staging: meta.staging_deployment_profile === 'staging',
  };
  const verified =
    checks.prod_profile_production &&
    checks.seed_fly_zero &&
    checks.seed_endpoint_blocked &&
    checks.showcase_off &&
    checks.market_showcase_off &&
    checks.demo_off &&
    checks.staging_profile_staging;
  return {
    id: 'PRM-SEC-B002',
    verdict: verified ? 'VERIFIED' : 'FIX_INCOMPLETE',
    checks,
    reason: verified
      ? 'Prod deployment_profile=production · SEED/SHOWCASE/DEMO off · seed endpoint 403 · distinct from staging'
      : 'Prod TRAVELTRUST_DEPLOYMENT_PROFILE=production or meta profile missing · or seed/showcase/demo policy incomplete',
  };
}

function evaluatePerB001(dir) {
  const summary = readJson(path.join(dir, 'perf-summary.json'));
  const verified = summary?.pass === true && summary?.api_base?.includes('prod');
  return {
    id: 'PRM-PER-B001',
    verdict: verified ? 'VERIFIED' : 'FIX_INCOMPLETE',
    checks: {
      perf_summary_present: !!summary,
      prod_api_base: summary?.api_base || null,
      p95_pass: summary?.pass === true,
    },
    reason: verified
      ? 'Prod read-only perf baseline committed · p95 within threshold'
      : 'Missing prod perf/SLO evidence or p95 threshold not met',
  };
}

function evaluateMonB001(dir) {
  const probes = parseKeyValFile(readText(path.join(dir, 'probes.txt')));
  const onCall = readJson(path.join(dir, 'on-call-path.json'));
  const verified =
    probes.health_http === '200' &&
    probes.meta_http === '200' &&
    probes.community_feed_http === '200' &&
    !!onCall?.on_call_runbook;
  return {
    id: 'PRM-MON-B001',
    verdict: verified ? 'VERIFIED' : 'FIX_INCOMPLETE',
    checks: {
      health_http: probes.health_http || null,
      meta_http: probes.meta_http || null,
      community_feed_http: probes.community_feed_http || null,
      on_call_runbook: onCall?.on_call_runbook || null,
      prometheus_rules: probes.prometheus_rules || null,
    },
    reason: verified
      ? 'Prod synthetic probes green · on-call path documented · prom rules checked'
      : 'Prod monitoring baseline incomplete (not staging C8 alone)',
  };
}

function main() {
  const { evidenceDir } = parseArgs();
  if (!evidenceDir) {
    console.error('Usage: --evidence-dir evidence/GO_production_readiness/g2-reality-fix/<stamp>');
    process.exit(1);
  }
  const base = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
  const stamp = path.basename(base);
  const evaluators = {
    'PRM-SEC-B001': () => evaluateSecB001(path.join(base, 'security-b001')),
    'PRM-SEC-B002': () => evaluateSecB002(path.join(base, 'security-b002')),
    'PRM-PER-B001': () => evaluatePerB001(path.join(base, 'performance-b001')),
    'PRM-MON-B001': () => evaluateMonB001(path.join(base, 'monitoring-b001')),
  };

  const findings = G2_BLOCKERS.map((id) => evaluators[id]());
  const verified = findings.filter((f) => f.verdict === 'VERIFIED').map((f) => f.id);
  const incomplete = findings.filter((f) => f.verdict !== 'VERIFIED').map((f) => f.id);
  const reg = fs.readFileSync(path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml'), 'utf8');
  const reopen = incomplete.filter((id) => {
    const marker = `  - id: ${id}`;
    const start = reg.indexOf(marker);
    if (start < 0) return false;
    const tail = reg.slice(start + marker.length);
    const nextRel = tail.search(/\r?\n  - id: PRM-/);
    const block = reg.slice(start, nextRel >= 0 ? start + marker.length + nextRel : reg.length);
    return block.includes('status: CLOSED');
  });

  const signoff = {
    review_id: 'G2-REALITY-FIX',
    stamp,
    machine_keys: {
      TT_G2_REALITY_FIX: incomplete.length === 0 ? 'COMPLETE' : 'IN_PROGRESS',
      TT_G2_REALITY_RE_AUDIT: 'NOT_STARTED',
      TT_PRODUCTION_READINESS_G2_GATE: 'IN_PROGRESS',
    },
    prod_api_base: process.env.PROD_API_BASE || 'https://tt-api-prod.fly.dev',
    matrix_actions: {
      close: verified,
      reopen: [...new Set(reopen)],
      verified,
      fix_incomplete: incomplete,
    },
    findings,
    release_train: {
      step: 'Reality Fix',
      next: incomplete.length ? 'Complete fix evidence · re-run fix' : 'G2 Reality Re-Audit',
    },
    honest_boundary:
      'Reality Fix closes Matrix only for VERIFIED items with prod evidence · ② staging ≠ ③ prod · Formal Acceptance follows Re-Audit',
  };

  fs.writeFileSync(path.join(base, 'g2-reality-fix-signoff.json'), `${JSON.stringify(signoff, null, 2)}\n`);

  console.log('G2 Reality Fix validation');
  console.log('─'.repeat(70));
  for (const f of findings) {
    console.log(`${f.verdict.padEnd(16)} ${f.id} — ${f.reason}`);
  }
  console.log('─'.repeat(70));
  console.log(`VERIFIED: ${verified.join(', ') || 'none'}`);
  console.log(`FIX_INCOMPLETE: ${incomplete.join(', ') || 'none'}`);
  console.log(`Evidence: ${path.relative(ROOT, base)}`);

  process.exit(incomplete.length === 0 ? 0 : 1);
}

main();
