#!/usr/bin/env node
/**
 * TT_PSG_RUNTIME_CHANGE_PROPAGATION — Post-PSG Change Control
 *
 * Wave A: registry-driven community_media checks (RCP-MEDIA-01..04)
 * Wave B: API ↔ Web Runtime pair ledger (RCP-PAIR-01..05) + Dependency Registry
 *
 * Does NOT re-open Tag / Release Archive / Production Cert / TT_PRODUCTION_GO.
 * Wave C/D NOT enforced here.
 *
 *   node scripts/gates/check-psg-runtime-change-propagation.cjs
 *   STAGING_API=… STAGING_WEB=… node scripts/gates/check-psg-runtime-change-propagation.cjs
 *
 * Exit 0 = PASS · Exit 1 = FAIL/BLOCKED
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
const DEP_REG = path.join(ROOT, 'registry/runtime-dependency-registry.v1.yaml');
const DEP_DERIVED = path.join(ROOT, 'registry/runtime-dependency-registry.derived.v1.json');
const NEXT_CFG = path.join(ROOT, 'frontend/next.config.js');
const BUILD_EXAMPLE = path.join(ROOT, 'deploy/fly/tt-web-staging/build.env.example');
const UNOPT = path.join(ROOT, 'frontend/lib/communityMediaClientUrl.ts');
const PAIR_LATEST = path.join(EVID, 'API-WEB-RUNTIME-PAIR-LATEST.json');
const WAIVE_PAIR01 = path.join(EVID, 'RCP-PAIR-01-WAIVE.json');
const TIGRIS_HOST = 'traveltrust-community-media.fly.storage.tigris.dev';
const CDN_HOST = 'cdn.traveltrust.app';

function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function sha256File(p) {
  return sha256(fs.readFileSync(p));
}

function loadDerivedRegistry() {
  if (!fs.existsSync(DEP_DERIVED)) {
    return { ok: false, error: 'derived_json_missing — run: python scripts/dev/generate-rcp-registry-derived.py' };
  }
  if (!fs.existsSync(DEP_REG)) {
    return { ok: false, error: 'dependency_registry_yaml_missing' };
  }
  const derived = JSON.parse(fs.readFileSync(DEP_DERIVED, 'utf8'));
  const srcHash = sha256File(DEP_REG);
  if (derived.source_sha256 !== srcHash) {
    return {
      ok: false,
      error: 'derived_stale — regenerate: python scripts/dev/generate-rcp-registry-derived.py',
      expected: derived.source_sha256,
      actual: srcHash,
    };
  }
  if (derived.registry_status !== 'ACTIVE') {
    return { ok: false, error: 'registry_not_active', status: derived.registry_status };
  }
  const ids = new Set((derived.validation_scope || []).map((v) => v.validation_id));
  const need = [
    'RCP-MEDIA-01',
    'RCP-MEDIA-02',
    'RCP-MEDIA-03',
    'RCP-MEDIA-04',
    'RCP-PAIR-01',
    'RCP-PAIR-02',
    'RCP-PAIR-03',
    'RCP-PAIR-04',
    'RCP-REG-00',
  ];
  const missing = need.filter((id) => !ids.has(id));
  if (missing.length) {
    return { ok: false, error: 'validation_scope_incomplete', missing };
  }
  return { ok: true, derived };
}

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
  return [...hosts].sort();
}

function remotePatternHosts(cfgText) {
  const hosts = [];
  const re = /hostname:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(cfgText))) hosts.push(m[1].toLowerCase());
  return [...new Set(hosts)].sort();
}

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

(async () => {
  const failures = [];
  const passes = [];
  const blocked = [];
  const report = {
    schema: 'traveltrust.psg_runtime_change_propagation_gate.v1',
    machine_key: 'TT_PSG_RUNTIME_CHANGE_PROPAGATION',
    stamp: STAMP,
    recorded_utc: new Date().toISOString(),
    layer: 'post_psg_change_control',
    waves: { A: 'ENFORCED', B: 'ENFORCED', C: 'NOT_STARTED', D: 'NOT_STARTED' },
    api: API,
    web: WEB,
    honest_boundary:
      'PASS ≠ Production Cert refresh ≠ TT_PRODUCTION_GO · Wave C/D not claimed · sixteen dims NOT complete',
    checks: [],
    dependency_registry: path.relative(ROOT, DEP_REG).replace(/\\/g, '/'),
    derived_ssot: path.relative(ROOT, DEP_DERIVED).replace(/\\/g, '/'),
  };

  const loaded = loadDerivedRegistry();
  if (!loaded.ok) {
    failures.push(`RCP-REG-00 ${loaded.error}`);
    report.checks.push({ id: 'RCP-REG-00', verdict: 'FAIL', detail: loaded });
    report.verdict = 'FAIL';
    report.failures = failures;
    fs.mkdirSync(EVID, { recursive: true });
    fs.writeFileSync(
      path.join(EVID, 'RUNTIME-CHANGE-PROPAGATION-GATE-LATEST.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
    console.log('TT_PSG_RUNTIME_CHANGE_PROPAGATION: FAIL');
    for (const f of failures) console.error(`FAIL: ${f}`);
    process.exit(1);
  }
  const derived = loaded.derived;
  report.registry_version = derived.registry_version;
  report.source_sha256 = derived.source_sha256;
  report.probe_scope = derived.probe_scope;
  report.validation_scope_ids = (derived.validation_scope || []).map((v) => v.validation_id);
  report.compatibility_edge_n = ((derived.compatibility_matrix || {}).edges || []).length;
  report.deploy_edge_n = ((derived.deploy_dependency_graph || {}).edges || []).length;
  report.gap_matrix = derived.gap_matrix;
  passes.push('RCP-REG-00_dependency_registry_derived_fresh');
  report.checks.push({
    id: 'RCP-REG-00',
    verdict: 'PASS',
    rule_id: 'registry_active',
    source: 'derived',
  });

  const neverWaive = new Set(
    (((derived.waive_policy || {}).global || {}).never_waive) || [],
  );

  const cfg = fs.existsSync(NEXT_CFG) ? fs.readFileSync(NEXT_CFG, 'utf8') : '';
  const ex = fs.existsSync(BUILD_EXAMPLE) ? fs.readFileSync(BUILD_EXAMPLE, 'utf8') : '';
  const unopt = fs.existsSync(UNOPT) ? fs.readFileSync(UNOPT, 'utf8') : '';
  const allowed = new Set(remotePatternHosts(cfg));

  // --- Sample Staging producers (registry: community_media.producers) ---
  let sampleUrls = [];
  let apiGitSha = null;
  let mediaCapsKeys = [];
  try {
    const meta = await getJson(`${API}/meta/build`);
    apiGitSha = meta.json && meta.json.git_sha ? String(meta.json.git_sha) : null;
    const feed = await getJson(`${API}/api/v1/community/feed?limit=20`);
    const posts = (feed.json && feed.json.posts) || [];
    for (const p of posts) if (p.cover_url) sampleUrls.push(String(p.cover_url));
    const hero = await getJson(`${API}/api/v1/official/cold-start/surfaces/home_hero`);
    sampleUrls.push(...collectCoverUrls(hero.json));
    const caps = await getJson(`${API}/api/v1/community/media/capabilities`);
    if (caps.json && typeof caps.json === 'object') mediaCapsKeys = Object.keys(caps.json).sort();
  } catch (e) {
    failures.push(`sample_fetch=${String(e.message || e).slice(0, 120)}`);
  }

  sampleUrls = [...new Set(sampleUrls.filter(Boolean))];
  const abs = sampleUrls.filter((u) => /^https?:\/\//i.test(u));
  const hosts = hostsFromUrls(abs);
  report.sample_url_n = sampleUrls.length;
  report.absolute_url_n = abs.length;
  report.sampled_hosts = hosts;

  // --- Wave A / registry community_media ---
  const buildKeys = [
    'NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES',
  ];
  const missingBuild = buildKeys.filter((k) => !ex.includes(k));
  if (missingBuild.length === 0) {
    passes.push('RCP-MEDIA-04_build_env_example');
    report.checks.push({ id: 'RCP-MEDIA-04', rule: 'build_args_declared', verdict: 'PASS' });
  } else {
    failures.push(`RCP-MEDIA-04 missing=${missingBuild.join(',')}`);
    report.checks.push({ id: 'RCP-MEDIA-04', verdict: 'FAIL', missing: missingBuild });
  }

  const ephemeral = abs.filter((u) => u.includes('/api/v1/uploads/'));
  if (hosts.includes(TIGRIS_HOST) || hosts.includes(CDN_HOST)) {
    if (ephemeral.length === 0) {
      passes.push('RCP-MEDIA-03_no_ephemeral');
      report.checks.push({ id: 'RCP-MEDIA-03', rule: 'ephemeral_forbidden_when_cos_primary', verdict: 'PASS' });
    } else {
      failures.push(`RCP-MEDIA-03 ephemeral_absolute=${ephemeral.length}`);
      report.checks.push({ id: 'RCP-MEDIA-03', verdict: 'FAIL' });
    }
  } else {
    report.checks.push({ id: 'RCP-MEDIA-03', verdict: 'SKIP', reason: 'no_tigris_cdn_hosts' });
  }

  const requiredHosts = [...new Set([TIGRIS_HOST, CDN_HOST, ...hosts.filter((h) => h === TIGRIS_HOST || h === CDN_HOST || h.endsWith('.tigris.dev'))])];
  const missingHosts = requiredHosts.filter((h) => !allowed.has(h) && !(h === CDN_HOST && cfg.includes(CDN_HOST)));
  // CDN may be string-present without hostname: block; require either hostname entry or literal in file
  const miss = [];
  if (!allowed.has(TIGRIS_HOST)) miss.push(TIGRIS_HOST);
  if (!allowed.has(CDN_HOST) && !cfg.includes(CDN_HOST)) miss.push(CDN_HOST);
  for (const h of hosts) {
    if ((h === TIGRIS_HOST || h.endsWith('.tigris.dev') || h === CDN_HOST) && !allowed.has(h) && !cfg.includes(h)) {
      miss.push(h);
    }
  }
  const missUniq = [...new Set(miss)];
  if (missUniq.length === 0) {
    passes.push('RCP-MEDIA-01_remotePatterns');
    report.checks.push({ id: 'RCP-MEDIA-01', rule: 'hosts_subseteq_remotePatterns', verdict: 'PASS' });
  } else {
    failures.push(`RCP-MEDIA-01 missing_remotePatterns=${missUniq.join(',')}`);
    blocked.push('community_media.remotePatterns');
    report.checks.push({ id: 'RCP-MEDIA-01', verdict: 'BLOCKED', missing: missUniq });
  }

  const probeUrl = abs.find((u) => {
    try {
      const h = new URL(u).hostname.toLowerCase();
      return h === TIGRIS_HOST || h === CDN_HOST;
    } catch {
      return false;
    }
  });
  let nextImageHttp = null;
  if (probeUrl) {
    const enc = encodeURIComponent(probeUrl);
    const nextImg = `${WEB}/_next/image?url=${enc}&w=640&q=75`;
    nextImageHttp = await headOrGet(nextImg, 'GET');
    report.next_image_probe = { http: nextImageHttp, sample: probeUrl.slice(0, 120) };
    if (nextImageHttp === 200 || nextImageHttp === 206) {
      passes.push('RCP-MEDIA-02_next_image');
      report.checks.push({ id: 'RCP-MEDIA-02', rule: 'next_image_live', verdict: 'PASS', http: nextImageHttp });
    } else {
      failures.push(`RCP-MEDIA-02 next_image_http=${nextImageHttp}`);
      blocked.push('community_media.next_image');
      report.checks.push({ id: 'RCP-MEDIA-02', verdict: 'BLOCKED', http: nextImageHttp });
    }
  } else {
    report.checks.push({ id: 'RCP-MEDIA-02', verdict: 'SKIP', reason: 'no_tigris_cdn_sample' });
  }

  // --- Wave B fingerprints ---
  const producerFp = {
    api_git_sha: apiGitSha,
    media_hosts: hosts,
    media_hosts_hash: sha256(hosts.join('|')),
    media_caps_keys: mediaCapsKeys,
    media_caps_keys_hash: sha256(mediaCapsKeys.join('|')),
  };
  const consumerFp = {
    // NOTE: Web /api/meta/build rewrites to API — do NOT treat as web SHA.
    web_meta_build_is_api_rewrite: true,
    remotePatterns_hosts: [...allowed],
    remotePatterns_hash: sha256([...allowed].join('|')),
    build_env_example_media_hash: sha256(
      buildKeys.map((k) => `${k}=${ex.includes(k) ? '1' : '0'}`).join(';') +
        `|base=${/NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=(.+)/.exec(ex)?.[1] || ''}`,
    ),
    unoptimized_helper_hash: sha256(
      [
        unopt.includes(TIGRIS_HOST) ? 'tigris' : '',
        unopt.includes(CDN_HOST) ? 'cdn' : '',
        unopt.includes('communityMediaNextImageUnoptimized') ? 'fn' : '',
      ].join('|'),
    ),
    fly_web_image_tag: process.env.TT_WEB_STAGING_IMAGE_TAG || null,
  };
  const producerHash = sha256(JSON.stringify(producerFp));
  const consumerHash = sha256(JSON.stringify(consumerFp));

  report.api_runtime = producerFp;
  report.web_runtime = consumerFp;

  // RCP-PAIR-02 / 03 / 04 map to media rules (registry-driven)
  const pair02ok = missUniq.length === 0;
  const pair03ok = missingBuild.length === 0;
  const pair04ok = !probeUrl || nextImageHttp === 200 || nextImageHttp === 206;
  report.checks.push({
    id: 'RCP-PAIR-02',
    verdict: pair02ok ? 'PASS' : 'BLOCKED',
    binds: 'community_media.hosts_subseteq_remotePatterns',
  });
  report.checks.push({
    id: 'RCP-PAIR-03',
    verdict: pair03ok ? 'PASS' : 'BLOCKED',
    binds: 'community_media.build_args_declared',
  });
  report.checks.push({
    id: 'RCP-PAIR-04',
    verdict: pair04ok ? 'PASS' : 'BLOCKED',
    binds: 'community_media.next_image_live',
  });
  if (pair02ok) passes.push('RCP-PAIR-02');
  else {
    failures.push('RCP-PAIR-02');
    blocked.push('api_web_pair.remotePatterns');
  }
  if (pair03ok) passes.push('RCP-PAIR-03');
  else {
    failures.push('RCP-PAIR-03');
    blocked.push('api_web_pair.buildArgs');
  }
  if (pair04ok) passes.push('RCP-PAIR-04');
  else {
    failures.push('RCP-PAIR-04');
    blocked.push('api_web_pair.next_image');
  }

  // RCP-PAIR-01: producer changed, consumer fingerprint unchanged → BLOCKED
  const prev = readJsonSafe(PAIR_LATEST);
  let pair01 = { verdict: 'PASS', reason: 'no_prior_ledger_or_in_sync' };
  if (prev && prev.producer_hash && prev.consumer_hash) {
    const producerChanged = prev.producer_hash !== producerHash;
    const consumerUnchanged = prev.consumer_hash === consumerHash;
    if (producerChanged && consumerUnchanged) {
      const waive = readJsonSafe(WAIVE_PAIR01);
      if (
        waive &&
        waive.waive === true &&
        waive.owner &&
        waive.reason &&
        !neverWaive.has('RCP-PAIR-01')
      ) {
        pair01 = {
          verdict: 'PASS',
          reason: 'RCP-PAIR-01 waived by Owner',
          waive: { owner: waive.owner, reason: waive.reason, stamped_utc: waive.stamped_utc || null },
        };
        passes.push('RCP-PAIR-01_waived');
      } else {
        pair01 = {
          verdict: 'BLOCKED',
          reason: 'API/data producer fingerprint changed but Web consumer config fingerprint unchanged',
          prev_producer_hash: prev.producer_hash,
          prev_consumer_hash: prev.consumer_hash,
        };
        failures.push('RCP-PAIR-01 producer_changed_consumer_stale');
        blocked.push('api_web_pair.sync');
      }
    } else if (producerChanged && !consumerUnchanged) {
      pair01 = { verdict: 'PASS', reason: 'producer_changed_and_consumer_updated' };
      passes.push('RCP-PAIR-01');
    } else {
      pair01 = { verdict: 'PASS', reason: 'producer_unchanged' };
      passes.push('RCP-PAIR-01');
    }
  } else {
    passes.push('RCP-PAIR-01_bootstrap_ledger');
    pair01 = { verdict: 'PASS', reason: 'bootstrap_no_prior_ledger' };
  }
  report.checks.push({ id: 'RCP-PAIR-01', ...pair01 });

  const pairDoc = {
    schema: 'traveltrust.api_web_runtime_pair.v1',
    stamp: STAMP,
    recorded_utc: new Date().toISOString(),
    api: API,
    web: WEB,
    producer_hash: producerHash,
    consumer_hash: consumerHash,
    producer: producerFp,
    consumer: consumerFp,
    pair01,
    dependency_domain: 'api_web_pair',
    note: 'Web /api/meta/build rewrites to API — web identity uses config fingerprints + optional TT_WEB_STAGING_IMAGE_TAG',
  };

  const verdict = failures.length === 0 ? 'PASS' : blocked.length ? 'BLOCKED' : 'FAIL';
  report.passes = passes;
  report.failures = failures;
  report.blocked = [...new Set(blocked)];
  report.verdict = verdict;
  report.machine_keys = {
    TT_PSG_RUNTIME_CHANGE_PROPAGATION: verdict,
    TT_RUNTIME_DEPENDENCY_REGISTRY: 'ACTIVE',
    TT_RUNTIME_DEPENDENCY_REGISTRY_DERIVED: derived.source_sha256.slice(0, 12),
    TT_PRODUCTION_GO: 'UNCHANGED',
    TT_PSG_PRODUCTION_CERT: 'UNCHANGED',
  };

  fs.mkdirSync(EVID, { recursive: true });
  // Only advance pair ledger on PASS (so BLOCKED keeps prior baseline for remediation)
  if (verdict === 'PASS') {
    fs.writeFileSync(PAIR_LATEST, JSON.stringify({ ...pairDoc, ledger_status: 'PASS' }, null, 2) + '\n');
  } else {
    fs.writeFileSync(
      path.join(EVID, `API-WEB-RUNTIME-PAIR-${STAMP}.json`),
      JSON.stringify({ ...pairDoc, ledger_status: verdict }, null, 2) + '\n',
    );
  }

  const latest = path.join(EVID, 'RUNTIME-CHANGE-PROPAGATION-GATE-LATEST.json');
  const stamped = path.join(EVID, `RUNTIME-CHANGE-PROPAGATION-GATE-${STAMP}.json`);
  fs.writeFileSync(latest, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(stamped, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    path.join(EVID, 'STATUS.txt'),
    `TT_PSG_RUNTIME_CHANGE_PROPAGATION: ${verdict}\nWAVE_A: ENFORCED\nWAVE_B: ENFORCED\nWAVE_C: NOT_STARTED\nWAVE_D: NOT_STARTED\nDEPENDENCY_REGISTRY: ACTIVE\nstamp=${STAMP}\nfailures=${failures.length}\n`,
  );

  console.log(`TT_PSG_RUNTIME_CHANGE_PROPAGATION: ${verdict}`);
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.log(`evidence: ${latest}`);
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
