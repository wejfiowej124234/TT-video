/**
 * FPC Runtime Preflight — lightweight batch-start checks (not governance schema change).
 *
 *   node scripts/dev/check-fpc-runtime-preflight.cjs [--batch B13] [--expect-env KEY=VAL]
 */
'use strict';

const { execSync } = require('child_process');
const { ROOT } = require('./fpc-batch-sequence.cjs');

const API_BASE = (process.env.API_BASE || process.env.BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');

async function fetchStatus(path) {
  const res = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(15000) });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

function evaluateRuntimePreflight({ expectEnv = [], allowDirty = false } = {}) {
  const items = {};
  const findings = [];
  const blockers = [];

  // Working tree
  try {
    const porcelain = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' });
    items.working_tree_clean = porcelain.length === 0;
    if (!items.working_tree_clean && !allowDirty) {
      blockers.push('working_tree_not_clean');
      findings.push({
        type: 'Runtime Event',
        blocking: true,
        id: 'preflight_dirty_tree',
        detail: 'git status --porcelain non-empty — commit or stash before batch start',
      });
    }
  } catch (e) {
    items.working_tree_clean = false;
    blockers.push('git_status_failed');
    findings.push({ type: 'Runtime Event', blocking: true, id: 'preflight_git', detail: String(e.message) });
  }

  return (async () => {
    const health = await fetchStatus('/health');
    items.api_health = health.status;
    if (health.status !== 200) {
      blockers.push('api_health');
      findings.push({
        type: 'Runtime Event',
        blocking: true,
        id: 'preflight_health',
        detail: `/health HTTP ${health.status}`,
      });
    }

    const meta = await fetchStatus('/meta');
    items.api_meta = meta.status;
    if (meta.status !== 200) {
      blockers.push('api_meta');
      findings.push({
        type: 'Runtime Event',
        blocking: true,
        id: 'preflight_meta',
        detail: `/meta HTTP ${meta.status}`,
      });
    } else {
      const dbOk =
        meta.json?.database?.status === 'ok' ||
        meta.json?.database?.connected === true ||
        !!meta.json?.order_messages?.chain_off_mounted;
      items.db_reachable = dbOk;
      if (!dbOk) {
        blockers.push('db_unreachable');
        findings.push({
          type: 'Runtime Event',
          blocking: true,
          id: 'preflight_db',
          detail: 'meta missing database ok / chain_off_mounted signal',
        });
      }
    }

    items.expected_feature_flags = {};
    for (const spec of expectEnv) {
      const [key, val] = spec.includes('=') ? spec.split('=') : [spec, '1'];
      const actual = process.env[key];
      const ok = val === '' ? actual != null && actual !== '' : String(actual) === String(val);
      items.expected_feature_flags[key] = { expected: val, actual: actual ?? null, ok };
      if (!ok) {
        blockers.push(`env:${key}`);
        findings.push({
          type: 'Runtime Event',
          blocking: true,
          id: `preflight_env_${key}`,
          detail: `expected ${key}=${val} got ${actual ?? '(unset)'}`,
        });
      }
    }

    const pass = blockers.length === 0;
    return {
      pass,
      api_base: API_BASE,
      items,
      findings,
      blockers,
      timestamp_utc: new Date().toISOString(),
    };
  })();
}

module.exports = { evaluateRuntimePreflight, API_BASE };
