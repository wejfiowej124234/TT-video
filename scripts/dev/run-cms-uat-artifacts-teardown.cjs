#!/usr/bin/env node
/**
 * Archive published CMS UAT artifacts (cms-uat-* announcements · roadmap-uat-* milestones).
 *
 *   API=http://127.0.0.1:8080 node scripts/dev/run-cms-uat-artifacts-teardown.cjs
 */
'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { teardownCmsUatArtifacts } = require('./lib/cms-uat-artifact-teardown.cjs');

const ROOT = path.join(__dirname, '../..');
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const k = line.slice(0, line.indexOf('=')).trim();
    let v = line.slice(line.indexOf('=') + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const API = (process.env.API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const PASSWORD = process.env.ADMIN_PASS || 'Test123!';
const SUPER_EMAIL = process.env.SUPER_EMAIL || 'tourist@test.com';
const lib = API.startsWith('https') ? https : http;

function req(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + urlPath);
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const r = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers,
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          let json;
          try {
            json = JSON.parse(d);
          } catch {
            json = { _raw: d.slice(0, 500) };
          }
          resolve({ status: res.statusCode, json, raw: d });
        });
      },
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

async function login(email, password, promote) {
  if (promote) {
    await req('POST', '/auth/seed-test-accounts', { promote_admin_email: email });
  }
  const r = await req('POST', '/auth/login', { email, password });
  if (r.status !== 200 || !r.json.token) return null;
  return r.json.token;
}

async function main() {
  const token = await login(SUPER_EMAIL, PASSWORD, true);
  if (!token) {
    console.error('CMS_UAT_TEARDOWN: login failed');
    process.exit(2);
  }
  const result = await teardownCmsUatArtifacts(req, token);
  console.log(
    `CMS_UAT_TEARDOWN: archived announcements=${result.announcements.archived} milestones=${result.milestones.archived}`,
  );
  if (result.announcements.slugs?.length) {
    console.log(`  announcements: ${result.announcements.slugs.join(', ')}`);
  }
  if (result.milestones.slugs?.length) {
    console.log(`  milestones: ${result.milestones.slugs.join(', ')}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('CMS_UAT_TEARDOWN: fatal', e);
  process.exit(2);
});
