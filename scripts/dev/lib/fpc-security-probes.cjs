/**
 * FPC B17 · Security live + static probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

async function fetchProbe(url, { method = 'GET', headers = {}, body } = {}) {
  const start = Date.now();
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const headerMap = {};
  res.headers.forEach((v, k) => {
    headerMap[k.toLowerCase()] = v;
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, headers: headerMap, json, ms: Date.now() - start };
}

async function probeInternalRoutes(apiBase, checklist, findings) {
  const spec = checklist.live_probes.internal_routes_deny_without_secret;
  const rows = [];
  let pass = true;
  for (const r of spec.paths) {
    const url = `${apiBase}${r.path}`;
    let row;
    try {
      row = await fetchProbe(url, { method: r.method, body: r.method === 'POST' ? {} : undefined });
    } catch (e) {
      pass = false;
      findings.push({
        id: `live_internal:${r.path}`,
        severity: 'P0',
        detail: `probe error: ${e.message}`,
      });
      rows.push({ ...r, error: e.message, pass: false });
      continue;
    }
    const ok = r.allowed_http.includes(row.status);
    if (!ok) {
      pass = false;
      findings.push({
        id: `live_internal:${r.path}`,
        severity: 'P0',
        detail: `${r.method} ${r.path} HTTP ${row.status} expected ${r.allowed_http.join('|')}`,
      });
    }
    rows.push({ ...r, http: row.status, pass: ok, ms: row.ms });
  }
  return { id: 'live_internal_routes', domain: 'permission_boundary', pass, rows };
}

async function probeAdminUnauth(apiBase, checklist, findings) {
  const spec = checklist.live_probes.admin_unauthenticated_deny;
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url);
  const ok = spec.allowed_http.includes(row.status);
  if (!ok) {
    findings.push({
      id: 'live_admin_unauth',
      severity: 'P0',
      detail: `GET ${spec.path} HTTP ${row.status} expected ${spec.allowed_http.join('|')}`,
    });
  }
  return { id: 'live_admin_unauth', domain: 'rbac', pass: ok, http: row.status };
}

async function probeSecurityHeaders(apiBase, checklist, findings) {
  const spec = checklist.live_probes.security_headers;
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url);
  const missing = spec.required.filter((h) => !row.headers[h]);
  const pass = missing.length === 0 && row.status === 200;
  if (!pass) {
    findings.push({
      id: 'live_security_headers',
      severity: 'P1',
      detail: `missing headers: ${missing.join(', ') || 'non-200'} on ${spec.path}`,
    });
  }
  return {
    id: 'live_security_headers',
    domain: 'csp',
    pass,
    http: row.status,
    headers: spec.required.reduce((o, h) => ({ ...o, [h]: row.headers[h] || null }), {}),
  };
}

async function probeRateLimitsMeta(apiBase, checklist, findings) {
  const spec = checklist.live_probes.rate_limits_meta;
  const url = `${apiBase}${spec.path}`;
  const row = await fetchProbe(url);
  const rl = row.json?.rate_limits;
  const missing = spec.required_keys.filter((k) => rl?.[k] === undefined);
  const pass = row.status === 200 && missing.length === 0;
  if (!pass) {
    findings.push({
      id: 'live_rate_limits_meta',
      severity: 'P1',
      detail: `meta rate_limits missing keys: ${missing.join(', ')}`,
    });
  }
  return {
    id: 'live_rate_limits_meta',
    domain: 'rate_limit',
    pass,
    http: row.status,
    keys_present: spec.required_keys.filter((k) => rl?.[k] !== undefined),
  };
}

async function runLiveProbes(apiBase, checklistPath, findings) {
  const checklist = loadChecklist(checklistPath);
  const internal = await probeInternalRoutes(apiBase, checklist, findings);
  const admin = await probeAdminUnauth(apiBase, checklist, findings);
  const headers = await probeSecurityHeaders(apiBase, checklist, findings);
  const rate = await probeRateLimitsMeta(apiBase, checklist, findings);
  const rows = [internal, admin, headers, rate];
  return {
    pass: rows.every((r) => r.pass),
    api_base: apiBase,
    probes: rows,
  };
}

function runStaticSsotChecks(root, findings) {
  const checks = [
    {
      id: 'ssot_session_extract',
      domain: 'session',
      path: 'crates/api/src/state.rs',
      must_contain: ['extract_user_with_session_check'],
    },
    {
      id: 'ssot_auth_public_hooks',
      domain: 'webhook_security',
      path: 'crates/api/src/middleware/auth_pause_metrics/mod.rs',
      must_contain: ['path.starts_with("/api/v1/hooks/")', 'internal_api_forbidden'],
    },
    {
      id: 'ssot_sqlx_query',
      domain: 'sql_injection',
      path: 'crates/api/src/db/users_sessions.rs',
      must_contain: ['sqlx::query'],
    },
    {
      id: 'ssot_upload_security_test',
      domain: 'file_upload',
      path: 'crates/api/src/routes/community/community_feed_like_collect_db_api_tests/upload_media_security_pg.rs',
      must_contain: ['MIME'],
    },
    {
      id: 'ssot_me_security_page',
      domain: 'authentication',
      path: 'frontend/app/me/security/meSecurityPage.contract.test.ts',
      must_contain: ['getMeSessions'],
    },
    {
      id: 'ssot_auth_audit_events',
      domain: 'audit_trail',
      path: 'frontend/app/admin/auth-audit-events/adminAuthAuditEventsL5.contract.test.ts',
      must_contain: ['admin_auth_audit_events'],
    },
    {
      id: 'ssot_next_xfo',
      domain: 'xss',
      path: 'frontend/next.config.js',
      must_contain: ['X-Frame-Options'],
    },
    {
      id: 'ssot_stripe_webhook_sig',
      domain: 'webhook_security',
      path: 'crates/api/src/stripe_onboarding/signature.rs',
      must_contain: ['verify_stripe_signature'],
    },
    {
      id: 'ssot_idempotency',
      domain: 'csrf',
      path: 'crates/api/src/db/idempotency.rs',
      must_contain: ['idempotency_key'],
    },
    {
      id: 'ssot_admin_permissions',
      domain: 'rbac',
      path: 'frontend/lib/admin/adminPermissionIds.ts',
      must_contain: ['ADMIN_PERM'],
    },
  ];

  const results = [];
  for (const c of checks) {
    const abs = path.join(root, c.path);
    let pass = fs.existsSync(abs);
    const notes = [];
    if (!pass) {
      findings.push({ id: `static_missing:${c.id}`, severity: 'P0', detail: c.path });
    } else if (c.must_contain) {
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

function classifyAuditDepsOutput(output) {
  const hasCriticalDirect =
    /Severity: critical/i.test(output) &&
    !/vitest.*dev-only|Vitest UI server/i.test(output) &&
    !/node_modules\/vitest/i.test(output);
  if (/audit-deps: all checks passed/i.test(output)) {
    return { pass: true, severity: null };
  }
  if (hasCriticalDirect) {
    return { pass: false, severity: 'P1', note: 'critical npm advisory in direct prod deps' };
  }
  return {
    pass: false,
    severity: 'P2',
    note: 'transitive npm/cargo advisories — ① documented · Production Entry Review upgrade track',
  };
}

module.exports = {
  loadChecklist,
  runLiveProbes,
  runStaticSsotChecks,
  classifyAuditDepsOutput,
};
