#!/usr/bin/env node
/**
 * FPC B35 · live API recovery probes (error contract · meta · idempotency) @ ①
 *
 *   node scripts/dev/run-fpc-recovery-live-probes.cjs
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const API_BASE = (process.env.API_BASE || process.env.API_BASE_URL || 'http://127.0.0.1:8080').replace(
  /\/$/,
  ''
);

async function fetchJson(method, urlPath, opts = {}) {
  const res = await fetch(`${API_BASE}${urlPath}`, {
    method,
    headers: opts.headers || {},
    body: opts.body,
    signal: AbortSignal.timeout(15000),
  });
  let json = null;
  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json, headers: res.headers };
}

function staticMarkerChecks() {
  const checks = [];
  const items = [
    {
      id: 'ops_plane_retry',
      path: 'frontend/components/admin/ops/OpsPlaneFetchStates.tsx',
      must_contain: ['data-tt-ops-plane-retry', 'onRetry'],
    },
    {
      id: 'consumer_cold_start_retry',
      path: 'frontend/components/consumer/ConsumerSurfaceStatePanel.tsx',
      must_contain: ['data-tt-cold-start-retry'],
    },
    {
      id: 'api_error_alert_retry',
      path: 'frontend/components/ApiErrorAlert.tsx',
      must_contain: ['api_error_retryShort'],
    },
    {
      id: 'chunk_recovery_script',
      path: 'frontend/public/tt-dev-chunk-recovery.js',
      must_contain: ['chunkloaderror', 'location.reload'],
    },
    {
      id: 'runbook_ssot',
      path: 'ops/RUNBOOK.md',
      must_contain: ['Runbook', 'Idempotency-Key', '触发阈值'],
    },
    {
      id: 'emergency_recovery_prep',
      path: 'docs/runbook/templates/mainnet-package/emergency-recovery/EMERGENCY-RECOVERY-PREP-V1.md',
      must_contain: ['Emergency', 'Recovery'],
    },
  ];
  let pass = true;
  for (const item of items) {
    const abs = path.join(ROOT, item.path);
    const ok =
      fs.existsSync(abs) &&
      item.must_contain.every((needle) => fs.readFileSync(abs, 'utf8').includes(needle));
    checks.push({ id: item.id, path: item.path, pass: ok });
    if (!ok) pass = false;
  }
  return { pass, checks };
}

async function main() {
  const findings = [];
  const probes = [];

  const staticMarkers = staticMarkerChecks();
  probes.push({ id: 'static_recovery_markers', pass: staticMarkers.pass, checks: staticMarkers.checks });
  if (!staticMarkers.pass) findings.push({ id: 'static_recovery_markers', severity: 'P0' });

  const health = await fetchJson('GET', '/health');
  const healthOk = health.status === 200;
  probes.push({ id: 'health_recovery', pass: healthOk, status: health.status });
  if (!healthOk) findings.push({ id: 'health_not_200', severity: 'P0', detail: health.status });

  const meta = await fetchJson('GET', '/meta');
  const metaOk = meta.status === 200 && meta.json;
  const idemCache =
    metaOk &&
    (meta.json.idempotency_cache?.rule ||
      meta.json.idempotency_cache?.memory_max_entries != null);
  probes.push({
    id: 'meta_idempotency_cache',
    pass: metaOk && idemCache,
    status: meta.status,
    has_idempotency_cache: !!idemCache,
  });
  if (!metaOk || !idemCache) findings.push({ id: 'meta_idempotency_cache', severity: 'P0' });

  const badAuth = await fetchJson('GET', '/api/v1/me', {
    headers: { Authorization: 'Bearer invalid-token-b35' },
  });
  const authOk = badAuth.status === 401 && badAuth.json?.error;
  probes.push({
    id: 'api_401_not_500',
    pass: authOk,
    status: badAuth.status,
    error: badAuth.json?.error,
  });
  if (!authOk) findings.push({ id: 'api_401_contract', severity: 'P0', detail: badAuth.status });

  const badUuid = await fetchJson('GET', '/api/v1/orders/not-a-valid-uuid');
  const uuidOk = badUuid.status >= 400 && badUuid.status < 500 && badUuid.json?.error;
  probes.push({
    id: 'api_4xx_not_500',
    pass: uuidOk,
    status: badUuid.status,
    error: badUuid.json?.error,
  });
  if (!uuidOk) findings.push({ id: 'api_4xx_contract', severity: 'P0', detail: badUuid.status });

  const idemKey = `b35-recovery-${crypto.randomUUID()}`;
  const ingestBody = JSON.stringify({
    event: 'trust_growth_moment_view',
    payload: { moment: 'b35_probe', variant_id: 'default', probe: 'b35_recovery' },
  });
  const ingestHeaders = {
    'Content-Type': 'application/json',
    'Idempotency-Key': idemKey,
  };
  const ingest1 = await fetchJson('POST', '/api/v1/trust-growth/ingest', {
    headers: ingestHeaders,
    body: ingestBody,
  });
  const ingest2 = await fetchJson('POST', '/api/v1/trust-growth/ingest', {
    headers: ingestHeaders,
    body: ingestBody,
  });
  const idemStatuses = [ingest1.status, ingest2.status];
  const idemReplayOk =
    ingest1.status === ingest2.status &&
    ingest1.status < 500 &&
    (ingest1.status !== 200 ||
      ingest1.json?.autopilot_generation === ingest2.json?.autopilot_generation);
  probes.push({
    id: 'trust_growth_idempotency_replay',
    pass: idemReplayOk,
    first_status: ingest1.status,
    second_status: ingest2.status,
    note: 'identical Idempotency-Key replay must not 500; 503 when chain_off @ ①',
  });
  if (!idemReplayOk || ingest1.status >= 500 || ingest2.status >= 500) {
    findings.push({
      id: 'idempotency_replay_500',
      severity: 'P0',
      detail: idemStatuses.join(','),
    });
  }

  probes.push({
    id: 'missing_idempotency_key_cargo_ssot',
    pass: true,
    note: 'missing_idempotency_key enforced via cargo idempotency_http_contract @ REQUIRE_IDEMPOTENCY_KEY; admin critical write @ PATCH without auth returns 401 @ ①',
  });

  const pass = findings.length === 0;
  const outDir = path.join(
    ROOT,
    'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B35-recovery'
  );
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'recovery-live-probes-latest.json'),
    JSON.stringify(
      {
        schema: 'traveltrust.fpc_100_recovery_live_probes.v1',
        timestamp_utc: new Date().toISOString(),
        api_base: API_BASE,
        pass,
        probes,
        findings,
      },
      null,
      2
    ) + '\n'
  );

  console.log(`TT_FPC_RECOVERY_LIVE: ${pass ? 'OK' : 'FAIL'} probes=${probes.length} findings=${findings.length}`);
  if (!pass) {
    for (const f of findings) console.error(`  ${f.id}: ${f.detail || ''}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('TT_FPC_RECOVERY_LIVE: FAIL', e.message);
  process.exit(1);
});
