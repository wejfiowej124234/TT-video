#!/usr/bin/env node
/** Shared HTTP helpers for Production Readiness probes */
const http = require('http');
const https = require('https');

function request(url, opts = {}) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const body = opts.body ? JSON.stringify(opts.body) : null;
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (url.startsWith('https') ? 443 : 80),
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: {
          ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
          ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
          ...(opts.userId ? { 'X-User-Id': opts.userId } : {}),
          ...(opts.headers || {}),
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(d);
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode || 0, json, text: d });
        });
      },
    );
    req.on('error', (e) => resolve({ status: 0, json: null, text: String(e) }));
    req.setTimeout(opts.timeoutMs || 20000, () => {
      req.destroy();
      resolve({ status: 0, json: null, text: 'timeout' });
    });
    if (body) req.write(body);
    req.end();
  });
}

function head(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const req = lib.request(
      { hostname: u.hostname, port: u.port || 443, path: u.pathname, method: 'HEAD', timeout: 15000 },
      (res) => resolve({ status: res.statusCode || 0, ok: res.statusCode >= 200 && res.statusCode < 400 }),
    );
    req.on('error', () => resolve({ status: 0, ok: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, ok: false });
    });
    req.end();
  });
}

function absUrl(api, maybe) {
  if (!maybe || typeof maybe !== 'string') return null;
  if (maybe.startsWith('http')) return maybe;
  if (maybe.startsWith('/')) return `${api}${maybe.startsWith('/api') ? '' : ''}${maybe}`;
  return `${api}/${maybe}`;
}

module.exports = { request, head, absUrl };
