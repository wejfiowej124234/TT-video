#!/usr/bin/env node
/**
 * Staging media URL audit — no *.loca.lt · probe HTTP 200 where applicable.
 * SSOT: registry/media-three-tier-architecture.v1.yaml
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.join(__dirname, '../..');
const STAGING_API = (process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const OUT = process.env.OUT || path.join(ROOT, 'evidence', 'GO_media_r2_cdn_migration', STAMP, 'media-url-audit.json');
const STRICT_CDN = /^(1|true|yes)$/i.test(process.env.STRICT_CDN || '');
const CDN_HOST = (process.env.CDN_HOST || 'cdn.traveltrust.app').replace(/^https?:\/\//, '').replace(/\/$/, '');

const endpoints = [
  { id: 'capabilities', url: `${STAGING_API}/api/v1/community/media/capabilities` },
  { id: 'community_feed', url: `${STAGING_API}/api/v1/community/feed?limit=30` },
  { id: 'guides', url: `${STAGING_API}/api/v1/guides?limit=50` },
  { id: 'provider_listings', url: `${STAGING_API}/api/v1/market/provider/listings?limit=50` },
  { id: 'acquisition_listings', url: `${STAGING_API}/api/v1/market/acquisition/listings?limit=50` },
  { id: 'market_feed', url: `${STAGING_API}/api/v1/official/cold-start/surfaces/market_feed` },
  { id: 'homepage_cold_start', url: `${STAGING_API}/api/v1/official/cold-start/surfaces/homepage` },
];

function collectUrls(obj, out = new Set()) {
  if (!obj || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) {
    obj.forEach((v) => collectUrls(v, out));
    return out;
  }
  for (const v of Object.values(obj)) {
    if (typeof v === 'string' && /^https?:\/\//.test(v)) out.add(v);
    else if (typeof v === 'object') collectUrls(v, out);
  }
  return out;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib
      .get(url, { headers: { Accept: 'application/json' } }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(body), raw: body });
          } catch {
            resolve({ status: res.statusCode, json: null, raw: body });
          }
        });
      })
      .on('error', reject);
  });
}

function headUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method: 'HEAD', timeout: 15000 }, (res) => {
      resolve({ status: res.statusCode });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, error: 'timeout' });
    });
    req.on('error', (e) => resolve({ status: 0, error: String(e.message || e) }));
    req.end();
  });
}

(async () => {
  const report = {
    schema: 'traveltrust.staging_media_url_audit.v1',
    stamp: STAMP,
    staging_api: STAGING_API,
    endpoints: [],
    media_urls: [],
    loca_lt_urls: [],
    tigris_urls: [],
    cdn_urls: [],
    strict_cdn: STRICT_CDN,
    cdn_host: CDN_HOST,
    blocking: [],
  };

  const allUrls = new Set();

  for (const ep of endpoints) {
    try {
      const r = await fetchJson(ep.url);
      const entry = { id: ep.id, http: r.status, url_count: 0 };
      if (r.json) {
        const urls = [...collectUrls(r.json)];
        entry.url_count = urls.length;
        urls.forEach((u) => allUrls.add(u));
      }
      report.endpoints.push(entry);
    } catch (e) {
      report.endpoints.push({ id: ep.id, http: 0, error: String(e.message || e) });
      report.blocking.push({ code: 'ENDPOINT_FETCH_FAIL', id: ep.id });
    }
  }

  for (const u of allUrls) {
    const loca = u.includes('loca.lt');
    const tigris = u.includes('tigris.dev') || u.includes('fly.storage.tigris');
    const cdn = u.includes(CDN_HOST);
    if (loca) report.loca_lt_urls.push(u);
    if (tigris) report.tigris_urls.push(u);
    if (cdn) report.cdn_urls.push(u);
  }

  const sample = [...allUrls].filter((u) => !u.includes('images.unsplash.com')).slice(0, 12);
  for (const u of sample) {
    const h = await headUrl(u);
    report.media_urls.push({ url: u, head_http: h.status, error: h.error || null });
    if (h.status !== 200 && h.status !== 206) {
      report.blocking.push({ code: 'MEDIA_HEAD_NOT_200', url: u, http: h.status });
    }
  }

  if (report.loca_lt_urls.length > 0) {
    report.blocking.push({ code: 'LOCA_LT_PRESENT', count: report.loca_lt_urls.length });
  }
  if (STRICT_CDN && report.tigris_urls.length > 0) {
    report.blocking.push({ code: 'TIGRIS_INTERIM_PRESENT', count: report.tigris_urls.length });
  }

  report.blocking_count = report.blocking.length;
  report.verdict = report.blocking_count === 0 ? 'PASS' : 'FAIL';

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ verdict: report.verdict, blocking_count: report.blocking_count, out: OUT }, null, 2));
  process.exit(report.blocking_count === 0 ? 0 : 1);
})();
