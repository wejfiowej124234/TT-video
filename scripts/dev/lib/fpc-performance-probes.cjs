/**
 * FPC-100 B16 · performance probes (① local budgets)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const DEFAULT_BUDGETS = path.join(
  __dirname,
  '../../../docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B16-performance/FPC-100-PERFORMANCE-BUDGETS-BASELINE.v1.json'
);

function readJson(p, fb = null) {
  if (!fs.existsSync(p)) return fb;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadBudgets(customPath) {
  const doc = readJson(customPath || DEFAULT_BUDGETS, {});
  return doc.thresholds || doc;
}

function walkFiles(dir, ext, acc = { total: 0, max: 0, count: 0, maxPath: null }) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walkFiles(p, ext, acc);
    else if (name.name.endsWith(ext)) {
      const size = fs.statSync(p).size;
      acc.total += size;
      acc.count += 1;
      if (size > acc.max) {
        acc.max = size;
        acc.maxPath = p;
      }
    }
  }
  return acc;
}

function measureBuildArtifacts(feRoot) {
  const nextDir = path.join(feRoot, '.next');
  const js = walkFiles(path.join(nextDir, 'static', 'chunks'), '.js');
  const css = walkFiles(path.join(nextDir, 'static', 'css'), '.css');
  return {
    js_total_bytes: js.total,
    js_file_count: js.count,
    largest_js_chunk_bytes: js.max,
    largest_js_chunk_path: js.maxPath,
    css_total_bytes: css.total,
    css_file_count: css.count,
    build_present: fs.existsSync(path.join(nextDir, 'BUILD_ID')),
  };
}

function httpGetMs(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const start = Date.now();
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      res.on('end', () => resolve({ ms: Date.now() - start, status: res.statusCode }));
    });
    req.on('timeout', () => req.destroy(new Error(`timeout:${url}`)));
    req.on('error', reject);
  });
}

async function probeApiLatencies(apiBase, budgets, findings) {
  const b = budgets.api || {};
  const rows = [];
  const paths = [
    { key: 'health', path: '/health', max: b.health_ms_max },
    { key: 'meta', path: '/meta', max: b.meta_ms_max },
    { key: 'discover', path: '/api/v1/discover/orders?limit=1', max: b.discover_ms_max },
  ];
  for (const item of paths) {
    let pass = true;
    let ms = null;
    let status = null;
    try {
      const r = await httpGetMs(`${apiBase.replace(/\/$/, '')}${item.path}`);
      ms = r.ms;
      status = r.status;
      if (status !== 200) {
        pass = false;
        findings.push({
          id: `api_status:${item.key}`,
          severity: 'P0',
          detail: `${item.path} status=${status}`,
        });
      } else if (item.max && ms > item.max) {
        pass = false;
        findings.push({
          id: `api_latency:${item.key}`,
          severity: 'P1',
          detail: `${item.path} ${ms}ms > budget ${item.max}ms`,
        });
      }
    } catch (e) {
      pass = false;
      findings.push({
        id: `api_error:${item.key}`,
        severity: 'P0',
        detail: String(e.message || e),
      });
    }
    rows.push({ ...item, ms, status, pass, budget_ms_max: item.max });
  }

  if (b.meta_db_must_be_connected) {
    try {
      const metaUrl = `${apiBase.replace(/\/$/, '')}/meta`;
      const body = await new Promise((resolve, reject) => {
        http
          .get(metaUrl, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => resolve(data));
          })
          .on('error', reject);
      });
      const meta = JSON.parse(body);
      const dbOk = meta.database_connected === true || meta.database?.connected === true;
      rows.push({
        key: 'meta_db',
        path: '/meta.database_connected',
        pass: dbOk,
        connected: dbOk,
      });
      if (!dbOk) {
        findings.push({
          id: 'api_db_not_connected',
          severity: 'P0',
          detail: 'GET /meta database not connected',
        });
      }
    } catch (e) {
      findings.push({
        id: 'api_meta_db_parse',
        severity: 'P0',
        detail: String(e.message || e),
      });
    }
  }

  return rows;
}

function evaluateBundleBudgets(artifacts, budgets, findings) {
  const b = budgets.bundle_disk || {};
  const rows = [];
  const checks = [
    ['css_total_bytes', artifacts.css_total_bytes, b.css_total_bytes_max],
    ['js_total_disk_bytes', artifacts.js_total_bytes, b.js_total_disk_bytes_max],
    ['largest_js_chunk_bytes', artifacts.largest_js_chunk_bytes, b.largest_js_chunk_bytes_max],
  ];
  for (const [key, val, max] of checks) {
    let pass = true;
    if (max != null && val != null && val > max) {
      pass = false;
      findings.push({
        id: `bundle_budget:${key}`,
        severity: 'P1',
        detail: `${key}=${val} > ${max}`,
      });
    }
    rows.push({ key, value: val, budget_max: max, pass });
  }
  rows.push({ key: 'build_present', value: artifacts.build_present, pass: !!artifacts.build_present });
  if (!artifacts.build_present) {
    findings.push({ id: 'bundle_no_build', severity: 'P0', detail: 'frontend/.next/BUILD_ID missing' });
  }
  return rows;
}

function evaluateLiveScanEvidence(scanSummaryPath, scanJsonlPath, budgets, findings) {
  const b = budgets.routes_five_main || {};
  let pass = fs.existsSync(scanSummaryPath) && fs.existsSync(scanJsonlPath);
  const notes = [];
  if (!pass) {
    findings.push({
      id: 'perf_live_scan_missing',
      severity: 'P0',
      detail: 'l5-performance-five-main-live-scan evidence missing',
    });
    return { pass: false, routes: [], notes };
  }
  const summary = JSON.parse(fs.readFileSync(scanSummaryPath, 'utf8'));
  const lines = fs.readFileSync(scanJsonlPath, 'utf8').trim().split('\n').filter(Boolean);
  const routes = lines.map((l) => JSON.parse(l));
  if ((summary.routesScanned || 0) < 5) {
    pass = false;
    findings.push({
      id: 'perf_routes_insufficient',
      severity: 'P0',
      detail: `routesScanned=${summary.routesScanned} need >=5`,
    });
  }
  for (const row of routes) {
    if (row.navigation_ms > b.navigation_ms_max) {
      pass = false;
      findings.push({
        id: `perf_navigation:${row.route}`,
        severity: 'P1',
        detail: `${row.route} navigation_ms=${row.navigation_ms} > ${b.navigation_ms_max}`,
      });
    }
    if (row.initial_js_bytes > b.initial_js_transfer_bytes_max) {
      pass = false;
      findings.push({
        id: `perf_initial_js:${row.route}`,
        severity: 'P1',
        detail: `${row.route} initial_js_bytes=${row.initial_js_bytes} > ${b.initial_js_transfer_bytes_max}`,
      });
    }
    if (row.duplicate_requests > b.duplicate_request_max) {
      pass = false;
      findings.push({
        id: `perf_duplicate:${row.route}`,
        severity: 'P1',
        detail: `${row.route} duplicate_requests=${row.duplicate_requests} > ${b.duplicate_request_max}`,
      });
    }
    if (row.cls != null && row.cls > b.cls_max) {
      pass = false;
      findings.push({
        id: `perf_cls:${row.route}`,
        severity: 'P1',
        detail: `${row.route} cls=${row.cls} > ${b.cls_max}`,
      });
    }
  }
  return { pass, summary, routes, notes };
}

function evaluateRegression(current, baselinePath, budgets, findings) {
  if (!baselinePath || !fs.existsSync(baselinePath)) {
    return { pass: true, skipped: true, reason: 'no_baseline_yet' };
  }
  const baseline = readJson(baselinePath);
  const reg = budgets.regression || {};
  let pass = true;
  const rows = [];

  const jsBase = baseline.bundle_disk?.js_total_disk_bytes;
  const jsNow = current.bundle_disk?.js_total_bytes;
  if (jsBase && jsNow) {
    const pct = (jsNow - jsBase) / jsBase;
    const ok = pct <= (reg.js_total_disk_pct_increase_max ?? 0.08);
    if (!ok) {
      pass = false;
      findings.push({
        id: 'perf_regression:js_total',
        severity: 'P1',
        detail: `js disk +${(pct * 100).toFixed(1)}% vs baseline`,
      });
    }
    rows.push({ metric: 'js_total_disk_bytes', pct_increase: pct, pass: ok });
  }

  const navBase = baseline.routes?.avg_navigation_ms;
  const navNow = current.routes?.avg_navigation_ms;
  if (navBase && navNow) {
    const pct = (navNow - navBase) / navBase;
    const ok = pct <= (reg.avg_navigation_ms_pct_increase_max ?? 0.12);
    if (!ok) {
      pass = false;
      findings.push({
        id: 'perf_regression:navigation',
        severity: 'P1',
        detail: `avg navigation +${(pct * 100).toFixed(1)}% vs baseline`,
      });
    }
    rows.push({ metric: 'avg_navigation_ms', pct_increase: pct, pass: ok });
  }

  return { pass, rows, skipped: false };
}

function buildBaselineSnapshot({ artifacts, apiRows, liveScan, bundleRows }) {
  const navs = (liveScan.routes || []).map((r) => r.navigation_ms).filter((n) => typeof n === 'number');
  const avgNav = navs.length ? navs.reduce((a, b) => a + b, 0) / navs.length : null;
  return {
    schema: 'traveltrust.fpc_100_performance_baseline.v1',
    captured_at_utc: new Date().toISOString(),
    bundle_disk: {
      js_total_disk_bytes: artifacts.js_total_bytes,
      css_total_bytes: artifacts.css_total_bytes,
      largest_js_chunk_bytes: artifacts.largest_js_chunk_bytes,
    },
    api: apiRows,
    routes: {
      avg_navigation_ms: avgNav,
      per_route: liveScan.routes || [],
    },
    bundle_checks: bundleRows,
  };
}

module.exports = {
  DEFAULT_BUDGETS,
  loadBudgets,
  measureBuildArtifacts,
  probeApiLatencies,
  evaluateBundleBudgets,
  evaluateLiveScanEvidence,
  evaluateRegression,
  buildBaselineSnapshot,
};
