#!/usr/bin/env node
/**
 * PER Round 1 · Final Spot Check (① local SSOT)
 * 7-page matrix + Public Surface Parity — single exit evidence.
 *
 *   WEB_BASE=http://127.0.0.1:3012 API_BASE=http://127.0.0.1:8080 \
 *     node scripts/dev/run-per-final-spot-check.cjs
 */
'use strict';

const WEB = (process.env.WEB_BASE || 'http://127.0.0.1:3012').replace(/\/$/, '');
const API = (process.env.API_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');
const TRUST_GATE_PREFIX = 'f0e0b101-0001-4001-8001-';

const P0_P1_PATTERNS = [
  { id: 'og_localhost', re: /og:url["\s>]*(?:content=)?["']?http:\/\/127\.0\.0\.1/i, severity: 'P1' },
  { id: 'canonical_localhost', re: /canonical["\s>]*(?:href=)?["']?http:\/\/127\.0\.0\.1/i, severity: 'P1' },
  { id: 'spacing_debug_toggle', re: /间距调试|data-tt-traveltrust-spacing-debug-toggle/, severity: 'P1' },
  { id: 'footer_fee_router_selfcheck', re: /费路由自检|footer_link_governance_fee_routes/, severity: 'P1' },
  { id: 'trust_d4555_consumer', re: /D-4555-A|D-4555-B/, severity: 'P1' },
  { id: 'help_runbook_08_4', re: /08-4|Runbook §7\.1|GET \/meta/, severity: 'P1' },
  { id: 'market_local_filter_footnote', re: /① 本地已过滤测试/, severity: 'P1' },
  { id: 'phase1_public_jargon', re: /Phase ①|Phase ②|Sepolia ② runtime/i, severity: 'P1' },
];

const PAGE_MATRIX = [
  { route: '/', id: 'home', checks: ['footer', 'metadata', 'chrome'] },
  { route: '/traveltrust', id: 'traveltrust', checks: ['hero', 'spacing_debug_off', 'metadata', 'seo'] },
  { route: '/market', id: 'market', checks: ['guides', 'empty_state'] },
  { route: '/help', id: 'help', checks: ['no_engineering_jargon'] },
  { route: '/trust', id: 'trust', checks: ['no_spec_refs'] },
  { route: '/governance', id: 'governance', checks: ['public_hub', 'no_admin_leak'] },
  { route: '/traveltrust/announcements', id: 'announcements', checks: ['metadata', 'locale'] },
];

async function fetchText(url, headers = {}) {
  const res = await fetch(url, {
    headers: { Accept: 'text/html,application/json', ...headers },
    signal: AbortSignal.timeout(45000),
    redirect: 'follow',
  });
  const body = await res.text();
  return { status: res.status, body, url };
}

function extractMeta(html, prop) {
  const og = html.match(new RegExp(`property="${prop}"[^>]*content="([^"]*)"`, 'i'));
  if (og) return og[1];
  const name = html.match(new RegExp(`name="${prop}"[^>]*content="([^"]*)"`, 'i'));
  if (name) return name[1];
  return null;
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
  return m ? m[1] : null;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

function scanPatterns(html, route, allow = []) {
  const hits = [];
  for (const p of P0_P1_PATTERNS) {
    if (allow.includes(p.id)) continue;
    if (p.re.test(html)) hits.push({ ...p, route });
  }
  return hits;
}

(async () => {
  const stamp = new Date().toISOString();
  const report = {
    schema: 'traveltrust.per_final_spot_check.v1',
    phase: '① local',
    timestamp_utc: stamp,
    web_base: WEB,
    api_base: API,
    verdict: 'PASS',
    p0_p1: [],
    warns: [],
    pages: {},
    public_surface_parity: {},
    gates: {},
    pass: true,
  };

  // --- Gates (subprocess via shell hints in evidence; parity inline) ---
  try {
    const g = await fetchText(`${API}/api/v1/guides?city=${encodeURIComponent('杭州')}&limit=100`);
    const items = g.status === 200 ? JSON.parse(g.body).items || [] : [];
    const tg = items.filter((x) => String(x.id || '').startsWith(TRUST_GATE_PREFIX));
    report.public_surface_parity.guide_count_hangzhou = items.length;
    report.public_surface_parity.trust_gate_on_list = tg.length;
    if (tg.length > 0) {
      report.p0_p1.push({
        id: 'market_trust_gate_leak',
        severity: 'P1',
        detail: `Hangzhou list trust-gate count=${tg.length}`,
      });
    }
    if (items.length > 5) {
      report.p0_p1.push({
        id: 'market_hangzhou_excess',
        severity: 'P1',
        detail: `Hangzhou guide count=${items.length}`,
      });
    }
  } catch (e) {
    report.p0_p1.push({ id: 'api_guides_unreachable', severity: 'P0', detail: String(e.message) });
  }

  try {
    const ann = await fetchText(`${API}/api/v1/public/announcements/pulse?limit=5`);
    if (ann.status === 200) {
      const j = JSON.parse(ann.body);
      const rows = j.items || j.announcements || [];
      report.public_surface_parity.announcement_sample_titles = rows
        .slice(0, 3)
        .map((r) => (r.title || r.headline || '').slice(0, 80));
    }
  } catch {
    report.warns.push({ id: 'announcements_api_optional', detail: 'pulse API skip' });
  }

  // --- 7-page matrix ---
  for (const page of PAGE_MATRIX) {
    const entry = { route: page.route, status: null, title: null, canonical: null, og_url: null, pattern_hits: [] };
    try {
      const allow = [];
      if (page.id === 'governance') {
        allow.push('phase1_public_jargon'); // params zone may exist elsewhere; hub consumer copy only
      }
      const r = await fetchText(`${WEB}${page.route}`);
      entry.status = r.status;
      if (r.status !== 200) {
        report.p0_p1.push({
          id: `page_http_${page.id}`,
          severity: 'P1',
          detail: `${page.route} HTTP ${r.status}`,
        });
      } else {
        entry.title = extractTitle(r.body);
        entry.canonical = extractCanonical(r.body);
        entry.og_url = extractMeta(r.body, 'og:url');
        entry.pattern_hits = scanPatterns(r.body, page.route, allow);
        if (page.id === 'traveltrust' && /间距调试|spacing-debug-toggle/i.test(r.body)) {
          entry.pattern_hits.push({
            id: 'spacing_debug_visible',
            severity: 'P1',
            route: page.route,
          });
        }
        if (page.id === 'help') {
          const helpHits = scanPatterns(r.body, page.route, []).filter((h) =>
            ['help_runbook_08_4'].includes(h.id)
          );
          entry.pattern_hits.push(...helpHits);
        }
        if (page.id === 'trust') {
          if (/D-4555-A|D-4555-B/.test(r.body)) {
            entry.pattern_hits.push({ id: 'trust_d4555', severity: 'P1', route: page.route });
          }
        }
        if (page.id === 'governance') {
          if (/admin\/finance|FeeRouterAdmin|RegionVaultAdmin/i.test(r.body)) {
            entry.pattern_hits.push({ id: 'governance_admin_leak', severity: 'P1', route: page.route });
          }
        }
        if (entry.og_url && /127\.0\.0\.1|localhost/i.test(entry.og_url)) {
          entry.pattern_hits.push({ id: 'og_localhost', severity: 'P1', route: page.route });
        }
        if (entry.canonical && /127\.0\.0\.1|localhost/i.test(entry.canonical)) {
          entry.pattern_hits.push({ id: 'canonical_localhost', severity: 'P1', route: page.route });
        }
      }
      for (const h of entry.pattern_hits) {
        report.p0_p1.push({ ...h, page: page.id });
      }
    } catch (e) {
      report.p0_p1.push({
        id: `page_fetch_${page.id}`,
        severity: 'P1',
        detail: String(e.message),
      });
    }
    report.pages[page.id] = entry;
  }

  // --- Announcements locale headers ---
  try {
    const zh = await fetchText(`${WEB}/traveltrust/announcements`, {
      'Accept-Language': 'zh-CN,zh;q=0.9',
    });
    const en = await fetchText(`${WEB}/traveltrust/announcements`, {
      'Accept-Language': 'en-US,en;q=0.9',
    });
    report.public_surface_parity.announcements_title_zh = extractTitle(zh.body);
    report.public_surface_parity.announcements_title_en = extractTitle(en.body);
    if (zh.body === en.body && extractTitle(zh.body) === extractTitle(en.body)) {
      report.warns.push({
        id: 'announcements_locale_same_html',
        detail: 'SSR HTML identical for zh/en Accept-Language — verify client i18n if needed',
      });
    }
  } catch (e) {
    report.warns.push({ id: 'announcements_locale_check', detail: String(e.message) });
  }

  // --- Parity summary ---
  const home = report.pages.home || {};
  report.public_surface_parity.metadata = {
    home_title: home.title,
    home_canonical: home.canonical,
    home_og_url: home.og_url,
    traveltrust_og_url: report.pages.traveltrust?.og_url,
  };
  report.public_surface_parity.footer = { home_fee_router_hit: false };
  try {
    const hr = await fetchText(`${WEB}/`);
    report.public_surface_parity.footer.home_fee_router_hit = /费路由自检/.test(hr.body);
  } catch {
    report.public_surface_parity.footer.home_fee_router_hit = null;
  }

  if (report.p0_p1.length > 0) {
    report.verdict = 'FAIL';
    report.pass = false;
  } else if (report.warns.length > 0) {
    report.verdict = 'PASS_WITH_WARN';
  }

  console.log('TT_PER_FINAL_SPOT_CHECK:', report.verdict);
  console.log('p0_p1:', report.p0_p1.length, 'warns:', report.warns.length);
  console.log('hangzhou_guides:', report.public_surface_parity.guide_count_hangzhou);
  if (report.p0_p1.length) {
    for (const f of report.p0_p1) console.error('FAIL', f.id, f.detail || f.route || '');
  }

  const out = process.env.EVIDENCE_JSON;
  if (out) {
    require('fs').writeFileSync(out, JSON.stringify(report, null, 2));
  }

  process.exit(report.pass ? 0 : 1);
})().catch((e) => {
  console.error('run-per-final-spot-check: ERROR', e.message);
  process.exit(1);
});
