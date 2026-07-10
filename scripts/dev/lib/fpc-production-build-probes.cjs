/**
 * FPC B18 · Production build live HTML probes (next start · flags off)
 */
'use strict';

const fs = require('fs');
const http = require('http');

function loadChecklist(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function fetchHtml(base, route) {
  const url = `${base.replace(/\/$/, '')}${route}`;
  const res = await fetch(url, {
    headers: { Accept: 'text/html' },
    signal: AbortSignal.timeout(60000),
    redirect: 'follow',
  });
  const body = await res.text();
  return { route, url, status: res.status, body, bytes: body.length };
}

function scanProdHtml(pages, checklist, findings) {
  const patterns = checklist.prod_html_forbidden_patterns || [];
  const rows = [];
  let pass = true;
  for (const page of pages) {
    if (page.status >= 500) {
      pass = false;
      findings.push({
        id: `prod_html:${page.route}`,
        severity: 'P0',
        detail: `${page.route} HTTP ${page.status}`,
      });
    }
    const hits = [];
    for (const p of patterns) {
      if (page.body.includes(p.pattern)) {
        hits.push(p.id);
        findings.push({
          id: `prod_html:${page.route}:${p.id}`,
          severity: p.severity || 'P1',
          detail: `${page.route} contains forbidden ${p.pattern}`,
        });
        if (p.severity === 'P0' || p.severity === 'P1') pass = false;
      }
    }
    rows.push({
      route: page.route,
      status: page.status,
      bytes: page.bytes,
      forbidden_hits: hits,
      pass: hits.length === 0 && page.status < 500,
    });
  }
  return { pass, routes: rows };
}

function waitForUrl(url, timeoutMs = 120000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) resolve(true);
          else retry();
        })
        .on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) reject(new Error(`timeout ${url}`));
      else setTimeout(tick, 500);
    };
    tick();
  });
}

function runStaticHygieneSsot(root, findings) {
  const checks = [
    {
      id: 'ui_guards_mock_pay',
      path: 'frontend/lib/travelTrustUiGuards.ts',
      must_contain: ['allowChainOffMockPayUi', 'NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI'],
    },
    {
      id: 'dockerfile_mock_pay_off',
      path: 'frontend/Dockerfile.fly-staging',
      must_contain: ['NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI=0'],
    },
    {
      id: 'gateway_conditional_mock',
      path: 'frontend/components/traveltrust/cinematic/TravelTrustStablecoinGateway.tsx',
      must_contain: ['showMockSwapUi'],
    },
    {
      id: 'footer_trust_center',
      path: 'frontend/components/landing/LandingFooter.tsx',
      must_contain: ['footer_link_trust_center'],
    },
  ];
  const results = [];
  for (const c of checks) {
    const abs = `${root}/${c.path}`.replace(/\\/g, '/');
    let pass = fs.existsSync(abs);
    if (!pass) {
      findings.push({ id: `static:${c.id}`, severity: 'P0', detail: c.path });
    } else {
      const text = fs.readFileSync(abs, 'utf8');
      for (const needle of c.must_contain) {
        if (!text.includes(needle)) {
          pass = false;
          findings.push({
            id: `static:${c.id}`,
            severity: 'P1',
            detail: `${c.path} missing ${needle}`,
          });
        }
      }
    }
    results.push({ id: c.id, pass, path: c.path });
  }
  return results;
}

module.exports = {
  loadChecklist,
  fetchHtml,
  scanProdHtml,
  waitForUrl,
  runStaticHygieneSsot,
};
