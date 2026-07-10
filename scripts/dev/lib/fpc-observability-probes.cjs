/**
 * FPC B19 · Observability live + static probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

async function fetchProbe(url, { method = 'GET', headers = {}, body, rawText = false } = {}) {
  const start = Date.now();
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(25000),
  });
  const headerMap = {};
  res.headers.forEach((v, k) => {
    headerMap[k.toLowerCase()] = v;
  });
  let json = null;
  let text = null;
  if (rawText) {
    text = await res.text();
  } else {
    try {
      json = await res.json();
    } catch {
      json = null;
    }
  }
  return { status: res.status, headers: headerMap, json, text, ms: Date.now() - start };
}

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(s || '').trim()
  );
}

async function probeHealthLiveness(apiBase, spec, findings) {
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url, { rawText: true });
  const ok =
    spec.allowed_http.includes(row.status) &&
    (!spec.body_contains || (row.text || '').includes(spec.body_contains));
  if (!ok) {
    findings.push({
      id: 'live_health_liveness',
      severity: 'P0',
      detail: `GET ${spec.path} HTTP ${row.status} body missing ${spec.body_contains || 'ok'}`,
    });
  }
  return { id: 'live_health_liveness', domain: 'api_health', pass: ok, http: row.status, ms: row.ms };
}

async function probeHealthReadiness(apiBase, spec, findings) {
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url);
  const db = row.json?.database;
  const keysOk = (spec.required_json_keys || []).every((k) => row.json?.[k] !== undefined);
  const dbOk = spec.database_allowed.includes(db);
  const ok = spec.allowed_http.includes(row.status) && keysOk && dbOk;
  if (!ok) {
    findings.push({
      id: 'live_health_readiness',
      severity: 'P0',
      detail: `GET ${spec.path} HTTP ${row.status} database=${db} keysOk=${keysOk}`,
    });
  }
  return {
    id: 'live_health_readiness',
    domain: 'readiness_probe',
    pass: ok,
    http: row.status,
    database: db,
    ms: row.ms,
  };
}

async function probeMetaSnapshot(apiBase, spec, findings) {
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url);
  const missing = spec.required_keys.filter((k) => row.json?.[k] === undefined);
  const svcOk = row.json?.service === spec.service_value;
  const idxSrc = row.json?.indexer?.checkpoint?.source;
  const idxOk = idxSrc === 'runtime' || idxSrc === 'startup_snapshot';
  const pass = row.status === 200 && missing.length === 0 && svcOk && idxOk;
  if (!pass) {
    findings.push({
      id: 'live_meta_snapshot',
      severity: 'P0',
      detail: `meta missing=${missing.join(',')} service=${row.json?.service} indexer.source=${idxSrc}`,
    });
  }
  return {
    id: 'live_meta_snapshot',
    domain: 'meta_dependency_snapshot',
    pass,
    http: row.status,
    database_connected: row.json?.database_connected,
    indexer_checkpoint_source: idxSrc,
    chain_id: row.json?.chain?.chain_id,
    authority_degraded: row.json?.authority?.degraded_mode,
  };
}

async function probeMetrics(apiBase, spec, findings) {
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url, { rawText: true });
  const body = row.text || '';
  const missing = spec.required_lines.filter((line) => !body.includes(line));
  const pass = row.status === 200 && missing.length === 0;
  if (!pass) {
    findings.push({
      id: 'live_metrics_prometheus',
      severity: 'P0',
      detail: `metrics missing lines: ${missing.join(', ')}`,
    });
  }
  return {
    id: 'live_metrics_prometheus',
    domain: 'prometheus_metrics',
    pass,
    http: row.status,
    missing_lines: missing,
  };
}

async function probeCorrelationId(apiBase, spec, findings) {
  const clientId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url, {
    rawText: true,
    headers: { [spec.request_header]: clientId },
  });
  const echoed = row.headers[spec.response_header];
  const ok =
    row.status === 200 &&
    (!spec.echo_client_value || echoed === clientId) &&
    Boolean(echoed);
  if (!ok) {
    findings.push({
      id: 'live_correlation_id',
      severity: 'P1',
      detail: `x-request-id echo expected ${clientId} got ${echoed || 'missing'}`,
    });
  }
  return {
    id: 'live_correlation_id',
    domain: 'trace_correlation_id',
    pass: ok,
    sent: clientId,
    received: echoed || null,
  };
}

async function probeMessageId(apiBase, spec, findings) {
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url, { rawText: true });
  const mid = row.headers[spec.response_header];
  const ok = row.status === 200 && (!spec.must_be_uuid || isUuid(mid));
  if (!ok) {
    findings.push({
      id: 'live_message_id',
      severity: 'P1',
      detail: `x-message-id missing or not UUID: ${mid || 'missing'}`,
    });
  }
  return { id: 'live_message_id', domain: 'message_id', pass: ok, message_id: mid || null };
}

async function probeErrorPiiSafe(apiBase, spec, findings) {
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url, { rawText: true });
  const body = (row.text || '').toLowerCase();
  const hits = spec.forbidden_body_patterns.filter((p) => body.includes(p.toLowerCase()));
  const httpOk = spec.allowed_http.includes(row.status);
  const pass = httpOk && hits.length === 0;
  if (!pass) {
    findings.push({
      id: 'live_error_pii_safe',
      severity: 'P0',
      detail: `401/403 path leaked patterns: ${hits.join(', ') || `HTTP ${row.status}`}`,
    });
  }
  return {
    id: 'live_error_pii_safe',
    domain: 'pii_safe_error_paths',
    pass,
    http: row.status,
    forbidden_hits: hits,
  };
}

async function probeInternalAlertsDeny(apiBase, spec, findings) {
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url, { method: spec.method || 'POST', body: {} });
  const ok = spec.allowed_http.includes(row.status);
  if (!ok) {
    findings.push({
      id: 'live_internal_alerts_deny',
      severity: 'P1',
      detail: `${spec.method} ${spec.path} HTTP ${row.status} expected ${spec.allowed_http.join('|')}`,
    });
  }
  return { id: 'live_internal_alerts_deny', domain: 'alert_routes', pass: ok, http: row.status };
}

async function runLiveProbes(apiBase, checklistPath, findings) {
  const checklist = loadChecklist(checklistPath);
  const lp = checklist.live_probes;
  const rows = [
    await probeHealthLiveness(apiBase, lp.health_liveness, findings),
    await probeHealthReadiness(apiBase, lp.health_readiness, findings),
    await probeMetaSnapshot(apiBase, lp.meta_snapshot, findings),
    await probeMetrics(apiBase, lp.metrics_prometheus, findings),
    await probeCorrelationId(apiBase, lp.correlation_id, findings),
    await probeMessageId(apiBase, lp.message_id, findings),
    await probeErrorPiiSafe(apiBase, lp.error_pii_safe, findings),
    await probeInternalAlertsDeny(apiBase, lp.internal_alerts_deny, findings),
  ];
  return { pass: rows.every((r) => r.pass), api_base: apiBase, probes: rows };
}

function runStaticSsotChecks(root, findings) {
  const checks = [
    {
      id: 'ssot_trace_request_id',
      domain: 'trace_correlation_id',
      path: 'crates/api/src/middleware/trace.rs',
      must_contain: ['request_id_layer', 'x-request-id', '[req]'],
    },
    {
      id: 'ssot_health_ready_handler',
      domain: 'readiness_probe',
      path: 'crates/api/src/routes/health_meta/handlers.rs',
      must_contain: ['health_ready', 'ping_pool'],
    },
    {
      id: 'ssot_health_ready_route',
      domain: 'readiness_probe',
      path: 'crates/api/src/routes/health_meta/router.rs',
      must_contain: ['/health/ready', 'health_ready'],
    },
    {
      id: 'ssot_metrics_handler',
      domain: 'prometheus_metrics',
      path: 'crates/api/src/routes/health_meta/handlers.rs',
      must_contain: [
        'traveltrust_indexer_lag_blocks',
        'traveltrust_database_connected',
        'traveltrust_chain_config_loaded',
      ],
    },
    {
      id: 'ssot_db_pool_obs',
      domain: 'database_dependency',
      path: 'crates/api/src/db_pool_obs.rs',
      must_contain: ['acquire_timeout_total', 'DATABASE_POOL_ALERT_UTILIZATION'],
    },
    {
      id: 'ssot_production_matrix',
      domain: 'meta_dependency_snapshot',
      path: 'registry/production-readiness-master-matrix.v1.yaml',
      must_contain: ['observability', 'health'],
    },
  ];
  const results = [];
  for (const c of checks) {
    const abs = path.join(root, c.path);
    let pass = fs.existsSync(abs);
    const notes = [];
    if (!pass) {
      findings.push({ id: `static_missing:${c.id}`, severity: 'P1', detail: c.path });
    } else {
      const text = fs.readFileSync(abs, 'utf8');
      for (const needle of c.must_contain) {
        if (!text.includes(needle)) {
          pass = false;
          notes.push(`missing:${needle}`);
          findings.push({
            id: `static_ssot:${c.id}`,
            severity: 'P1',
            detail: `${c.path} missing ${needle}`,
          });
        }
      }
    }
    results.push({ id: c.id, domain: c.domain, pass, path: c.path, notes });
  }
  return results;
}

module.exports = {
  loadChecklist,
  runLiveProbes,
  runStaticSsotChecks,
  isUuid,
};
