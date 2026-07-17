#!/usr/bin/env node
/**
 * TT_PSG_RUNTIME_CHANGE_PROPAGATION — Post-PSG Change Control (incremental)
 *
 * Does NOT re-open Tag / Release Archive / Production Cert / TT_PRODUCTION_GO.
 * Catches Runtime ↔ Config ↔ Probe drift (class: MEDIA_ALIGNMENT RCA).
 *
 *   node scripts/gates/check-psg-runtime-change-propagation.cjs
 *   STAGING_API=… STAGING_WEB=… node scripts/gates/check-psg-runtime-change-propagation.cjs
 *
 * Exit 0 = PASS · Exit 1 = FAIL
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.STAGING_API || process.env.API || 'https://tt-api-staging.fly.dev').replace(
  /\/$/,
  '',
);
const WEB = (process.env.STAGING_WEB || process.env.WEB || 'https://tt-web-staging.fly.dev').replace(
  /\/$/,
  '',
);
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID = path.join(ROOT, 'evidence/GO_psg_governance/RUNTIME_CHANGE_PROPAGATION');
const NEXT_CFG = path.join(ROOT, 'frontend/next.config.js');
const BUILD_EXAMPLE = path.join(ROOT, 'deploy/fly/tt-web-staging/build.env.example');
const TIGRIS_HOST = 'traveltrust-community-media.fly.storage.tigris.dev';
const CDN_HOST = 'cdn.traveltrust.app';

function getJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { Accept: 'application/json' }, timeout: 25000 }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, json: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode || 0, json: null });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function headOrGet(url, method = 'GET') {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        timeout: 25000,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode || 0);
      },
    );
    req.on('error', () => resolve(0));
    req.on('timeout', () => {
      req.destroy();
      resolve(0);
    });
    req.end();
  });
}

function collectCoverUrls(obj, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) {
    obj.forEach((v) => collectCoverUrls(v, out));
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && /cover|image|media|avatar|thumb/i.test(k) && /^https?:\/\//i.test(v)) {
      out.push(v);
    } else if (typeof v === 'object') {
      collectCoverUrls(v, out);
    }
  }
  return out;
}

function hostsFromUrls(urls) {
  const hosts = new Set();
  for (const u of urls) {
    try {
      hosts.add(new URL(u).hostname.toLowerCase());
    } catch {
      /* ignore */
    }
  }
  return [...hosts];
}

function remotePatternHosts(cfgText) {
  const hosts = [];
  const re = /hostname:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(cfgText))) hosts.push(m[1].toLowerCase());
  return hosts;
}

(async () => {
  const failures = [];
  const passes = [];
  const report = {
    schema: 'traveltrust.psg_runtime_change_propagation_gate.v1',
    machine_key: 'TT_PSG_RUNTIME_CHANGE_PROPAGATION',
    stamp: STAMP,
    recorded_utc: new Date().toISOString(),
    layer: 'post_psg_change_control',
    api: API,
    web: WEB,
    honest_boundary:
      'PASS ≠ Production Cert refresh ≠ TT_PRODUCTION_GO · does not mutate Tag/Archive',
    checks: [],
  };

  // --- RCP-MEDIA-04 source: build.env.example ---
  const ex = fs.existsSync(BUILD_EXAMPLE) ? fs.readFileSync(BUILD_EXAMPLE, 'utf8') : '';
  if (ex.includes('NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL')) {
    passes.push('RCP-MEDIA-04_build_env_example');
    report.checks.push({ id: 'RCP-MEDIA-04', verdict: 'PASS' });
  } else {
    failures.push('RCP-MEDIA-04 missing NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL in build.env.example');
    report.checks.push({ id: 'RCP-MEDIA-04', verdict: 'FAIL' });
  }

  // --- Sample Staging media ---
  let sampleUrls = [];
  try {
    const feed = await getJson(`${API}/api/v1/community/feed?limit=20`);
    const posts = (feed.json && feed.json.posts) || [];
    for (const p of posts) {
      if (p.cover_url) sampleUrls.push(String(p.cover_url));
    }
    const hero = await getJson(`${API}/api/v1/official/cold-start/surfaces/home_hero`);
    sampleUrls.push(...collectCoverUrls(hero.json));
  } catch (e) {
    failures.push(`sample_fetch=${String(e.message || e).slice(0, 120)}`);
  }

  sampleUrls = [...new Set(sampleUrls.filter(Boolean))];
  const abs = sampleUrls.filter((u) => /^https?:\/\//i.test(u));
  const hosts = hostsFromUrls(abs);
  report.sample_url_n = sampleUrls.length;
  report.absolute_url_n = abs.length;
  report.sampled_hosts = hosts;

  // --- RCP-MEDIA-03 ephemeral ban when absolute hosts present ---
  const ephemeral = abs.filter((u) => u.includes('/api/v1/uploads/'));
  if (hosts.includes(TIGRIS_HOST) || hosts.includes(CDN_HOST)) {
    if (ephemeral.length === 0) {
      passes.push('RCP-MEDIA-03_no_ephemeral_among_absolute_samples');
      report.checks.push({ id: 'RCP-MEDIA-03', verdict: 'PASS' });
    } else {
      failures.push(`RCP-MEDIA-03 ephemeral_absolute=${ephemeral.length}`);
      report.checks.push({ id: 'RCP-MEDIA-03', verdict: 'FAIL', ephemeral_n: ephemeral.length });
    }
  } else if (abs.length === 0) {
    // Relative-only world — not a fail for this gate wave
    passes.push('RCP-MEDIA-03_skipped_no_absolute_hosts');
    report.checks.push({ id: 'RCP-MEDIA-03', verdict: 'SKIP', reason: 'no_absolute_hosts' });
  } else {
    report.checks.push({
      id: 'RCP-MEDIA-03',
      verdict: 'INFO',
      note: 'absolute hosts present but not Tigris/CDN — review manually',
      hosts,
    });
  }

  // --- RCP-MEDIA-01 next.config remotePatterns ---
  const cfg = fs.existsSync(NEXT_CFG) ? fs.readFileSync(NEXT_CFG, 'utf8') : '';
  const allowed = new Set(remotePatternHosts(cfg));
  report.next_config_hosts = [...allowed];
  const requiredMediaHosts = hosts.filter((h) => h === TIGRIS_HOST || h === CDN_HOST || h.endsWith('.tigris.dev'));
  const missing = requiredMediaHosts.filter((h) => !allowed.has(h));
  // Always require Tigris host in config when staging_primary is fly_tigris (source gate)
  if (!allowed.has(TIGRIS_HOST)) missing.push(TIGRIS_HOST);
  if (!allowed.has(CDN_HOST)) {
    // CDN is future cutover — warn via check but require string present (MED-01)
    if (!cfg.includes(CDN_HOST)) missing.push(CDN_HOST);
  }
  const missUniq = [...new Set(missing)];
  if (missUniq.length === 0) {
    passes.push('RCP-MEDIA-01_remotePatterns');
    report.checks.push({ id: 'RCP-MEDIA-01', verdict: 'PASS' });
  } else {
    failures.push(`RCP-MEDIA-01 missing_remotePatterns=${missUniq.join(',')}`);
    report.checks.push({ id: 'RCP-MEDIA-01', verdict: 'FAIL', missing: missUniq });
  }

  // --- RCP-MEDIA-02 /_next/image tripwire ---
  const probeUrl = abs.find((u) => {
    try {
      const h = new URL(u).hostname.toLowerCase();
      return h === TIGRIS_HOST || h === CDN_HOST;
    } catch {
      return false;
    }
  });
  if (probeUrl) {
    const enc = encodeURIComponent(probeUrl);
    const nextImg = `${WEB}/_next/image?url=${enc}&w=640&q=75`;
    const code = await headOrGet(nextImg, 'GET');
    report.next_image_probe = { url: nextImg.slice(0, 200), http: code };
    if (code === 200 || code === 206) {
      passes.push('RCP-MEDIA-02_next_image');
      report.checks.push({ id: 'RCP-MEDIA-02', verdict: 'PASS', http: code });
    } else {
      failures.push(`RCP-MEDIA-02 next_image_http=${code}`);
      report.checks.push({ id: 'RCP-MEDIA-02', verdict: 'FAIL', http: code });
    }
  } else {
    passes.push('RCP-MEDIA-02_skipped_no_tigris_sample');
    report.checks.push({ id: 'RCP-MEDIA-02', verdict: 'SKIP', reason: 'no_tigris_cdn_sample' });
  }

  report.passes = passes;
  report.failures = failures;
  report.verdict = failures.length === 0 ? 'PASS' : 'FAIL';
  report.machine_keys = {
    TT_PSG_RUNTIME_CHANGE_PROPAGATION: report.verdict,
    TT_PRODUCTION_GO: 'UNCHANGED',
    TT_PSG_PRODUCTION_CERT: 'UNCHANGED',
  };

  fs.mkdirSync(EVID, { recursive: true });
  const latest = path.join(EVID, 'RUNTIME-CHANGE-PROPAGATION-GATE-LATEST.json');
  const stamped = path.join(EVID, `RUNTIME-CHANGE-PROPAGATION-GATE-${STAMP}.json`);
  fs.writeFileSync(latest, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(stamped, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    path.join(EVID, 'STATUS.txt'),
    `TT_PSG_RUNTIME_CHANGE_PROPAGATION: ${report.verdict}\nstamp=${STAMP}\nfailures=${failures.length}\n`,
  );

  console.log(`TT_PSG_RUNTIME_CHANGE_PROPAGATION: ${report.verdict}`);
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.log(`evidence: ${latest}`);
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
