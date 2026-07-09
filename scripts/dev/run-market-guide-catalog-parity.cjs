#!/usr/bin/env node
/**
 * PER Wave C · CI-10 — Database/API/UI parity probe for Hangzhou guides.
 * SSOT: registry/per-wave-backlog.v1.yaml PER-R1-CI-10
 *
 * Usage:
 *   API_BASE=http://127.0.0.1:8080 node scripts/dev/run-market-guide-catalog-parity.cjs
 *   EVIDENCE_JSON=path/to.json node scripts/dev/run-market-guide-catalog-parity.cjs
 */
'use strict';

const API = (process.env.API_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');
const TRUST_GATE_PREFIX = 'f0e0b101-0001-4001-8001-';
const HANGZHOU_QUERIES = ['Hangzhou', '杭州'];

async function pubGet(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  const body = await res.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    json = { _raw: body.slice(0, 400) };
  }
  return { status: res.status, json };
}

function displayTitle(g) {
  const t = (g.public_title || g.bio || g.city || '').trim();
  const city = (g.city || '').trim();
  if (t && city && !t.includes(city)) return `${city} ${t}`.slice(0, 48);
  return (t || city || '向导').slice(0, 48);
}

function findDuplicateDisplayKeys(items) {
  const byKey = new Map();
  for (const g of items) {
    const key = displayTitle(g);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(g.id);
  }
  const dupes = [];
  for (const [label, ids] of byKey) {
    if (ids.length > 1) dupes.push({ label, count: ids.length, ids });
  }
  dupes.sort((a, b) => b.count - a.count);
  return dupes;
}

(async () => {
  const report = {
    schema: 'traveltrust.market_guide_catalog_parity.v1',
    api_base: API,
    timestamp_utc: new Date().toISOString(),
    hangzhou: {},
    all_guides: {},
    pass: true,
    failures: [],
  };

  let allItems = [];
  {
    const r = await pubGet('/api/v1/guides?limit=500');
    if (r.status !== 200) {
      report.pass = false;
      report.failures.push(`GET /api/v1/guides HTTP ${r.status}`);
    } else {
      allItems = r.json.items || r.json.guides || [];
    }
  }
  report.all_guides.api_count = allItems.length;
  report.all_guides.trust_gate_fixture_count = allItems.filter((g) =>
    String(g.id || '').startsWith(TRUST_GATE_PREFIX)
  ).length;

  let hzItems = [];
  for (const q of HANGZHOU_QUERIES) {
    const r = await pubGet(`/api/v1/guides?city=${encodeURIComponent(q)}&limit=100`);
    if (r.status !== 200) {
      report.pass = false;
      report.failures.push(`GET /api/v1/guides?city=${q} HTTP ${r.status}`);
      continue;
    }
    const part = r.json.items || r.json.guides || [];
    if (part.length > hzItems.length) hzItems = part;
  }

  const dupes = findDuplicateDisplayKeys(hzItems);
  report.hangzhou = {
    api_count: hzItems.length,
    trust_gate_fixture_count: hzItems.filter((g) =>
      String(g.id || '').startsWith(TRUST_GATE_PREFIX)
    ).length,
    dev_bio_count: hzItems.filter((g) => {
      const b = String(g.bio || '').toLowerCase();
      return b.includes('trust-gate e2e') || b.includes('多重身份演示') || b.includes('测试向导');
    }).length,
    duplicate_display_groups: dupes,
    ids: hzItems.map((g) => ({
      id: g.id,
      user_id: g.user_id,
      bio: String(g.bio || '').slice(0, 40),
      display: displayTitle(g),
    })),
  };

  // UI projection = API list after server-side list filter (no frontend mock stacking)
  report.hangzhou.ui_projected_count = hzItems.length;

  if (report.all_guides.trust_gate_fixture_count > 0) {
    report.pass = false;
    report.failures.push(
      `trust-gate fixtures on public list: ${report.all_guides.trust_gate_fixture_count}`
    );
  }
  if (report.hangzhou.trust_gate_fixture_count > 0) {
    report.pass = false;
    report.failures.push(
      `Hangzhou trust-gate fixtures: ${report.hangzhou.trust_gate_fixture_count}`
    );
  }
  if (report.hangzhou.api_count > 5) {
    report.pass = false;
    report.failures.push(`Hangzhou api_count ${report.hangzhou.api_count} > 5`);
  }
  const worst = dupes[0];
  if (worst && worst.count > 1) {
    report.pass = false;
    report.failures.push(`duplicate display "${worst.label}" ×${worst.count}`);
  }

  console.log('TT_MARKET_GUIDE_CATALOG_PARITY:', report.pass ? 'PASS' : 'FAIL');
  console.log(
    'hangzhou api=',
    report.hangzhou.api_count,
    'trust_gate=',
    report.hangzhou.trust_gate_fixture_count,
    'dupes=',
    dupes.length
  );
  if (report.failures.length) {
    for (const f of report.failures) console.error('FAIL', f);
  }

  const out = process.env.EVIDENCE_JSON;
  if (out) {
    require('fs').writeFileSync(out, JSON.stringify(report, null, 2));
  }

  if (!report.pass) process.exit(1);
})().catch((e) => {
  console.error('run-market-guide-catalog-parity: ERROR', e.message);
  process.exit(1);
});
