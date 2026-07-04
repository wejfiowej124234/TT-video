#!/usr/bin/env node
/**
 * Shell-facing RuntimeIdentity helpers — use instead of ad-hoc deployment_profile checks.
 *
 *   node scripts/dev/lib/runtime-identity-cli.cjs assert-meta-profile <api-base-or-meta-build-url> <expected>
 *   node scripts/dev/lib/runtime-identity-cli.cjs assert-local-env-profile <expected>
 */
const http = require('http');
const https = require('https');
const { RuntimeIdentity } = require('./runtime-identity.cjs');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.get(url, { timeout: 45000 }, (res) => {
      let body = '';
      res.on('data', (c) => {
        body += c;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`invalid JSON from ${url}: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`timeout ${url}`));
    });
  });
}

function metaBuildUrl(input) {
  const s = input.replace(/\/$/, '');
  if (s.endsWith('/meta/build')) return s;
  return `${s}/meta/build`;
}

async function assertMetaProfile(urlInput, expected) {
  const url = metaBuildUrl(urlInput);
  const data = await fetchJson(url);
  const id = RuntimeIdentity.current({
    meta: { deployment_profile_meta: data.deployment_profile },
  });
  const got = id.deployment_profile_meta || data.deployment_profile || 'null';
  const normExpected = String(expected).trim().toLowerCase();
  const normGot = String(got).trim().toLowerCase();
  if (normGot !== normExpected) {
    console.error(`FAIL RuntimeIdentity meta deployment_profile=${got} expected=${expected}`);
    process.exit(1);
  }
  console.log(`OK   RuntimeIdentity meta/build deployment_profile=${got}`);
}

function assertLocalEnvProfile(expected) {
  const id = RuntimeIdentity.current();
  const normExpected = String(expected).trim().toLowerCase();
  const raw = (id.deployment_profile_raw || '').toLowerCase();
  const profile = String(id.profile).toLowerCase();
  if (raw !== normExpected && profile !== normExpected) {
    console.error(
      `FAIL RuntimeIdentity env deployment_profile=${id.deployment_profile_raw || id.profile} expected=${expected}`
    );
    process.exit(1);
  }
  console.log(`OK   RuntimeIdentity env deployment_profile=${id.deployment_profile_raw || id.profile}`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'assert-meta-profile') {
    const [url, expected] = rest;
    if (!url || !expected) {
      console.error('Usage: assert-meta-profile <url> <expected_profile>');
      process.exit(2);
    }
    await assertMetaProfile(url, expected);
    return;
  }
  if (cmd === 'assert-local-env-profile') {
    const [expected] = rest;
    if (!expected) {
      console.error('Usage: assert-local-env-profile <expected_profile>');
      process.exit(2);
    }
    assertLocalEnvProfile(expected);
    return;
  }
  console.error('Commands: assert-meta-profile | assert-local-env-profile');
  process.exit(2);
}

main().catch((e) => {
  console.error(`FAIL RuntimeIdentity CLI: ${e.message}`);
  process.exit(1);
});
