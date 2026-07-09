#!/usr/bin/env node
/**
 * Compare local OCS media bytes vs staging HTTP Content-Length for sample + full scan.
 *
 *   node scripts/dev/check-ocs-staging-media-bytes-parity.cjs
 *   node scripts/dev/check-ocs-staging-media-bytes-parity.cjs --quiet
 */
const fs = require('fs');
const path = require('path');
const { loadAssetsManifest } = require('./lib/ocs-official-assets.cjs');

const ROOT = path.join(__dirname, '../..');
const MEDIA = path.join(ROOT, 'data/official-cold-start/media');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const QUIET = process.argv.includes('--quiet');
const MIN_REAL = 16 * 1024;

async function headLen(url) {
  const res = await fetch(url, { method: 'HEAD' });
  if (!res.ok) return { ok: false, status: res.status, len: 0 };
  const len = Number(res.headers.get('content-length') || 0);
  return { ok: true, status: res.status, len };
}

async function main() {
  const assetsDoc = loadAssetsManifest();
  let match = 0;
  let mismatch = 0;
  const samples = [];

  for (const a of assetsDoc.assets) {
    const localPath = path.join(MEDIA, a.filename);
    const localSize = fs.existsSync(localPath) ? fs.statSync(localPath).size : 0;
    const remote = await headLen(`${API}${a.public_url}`);
    const same = remote.ok && remote.len === localSize && localSize > MIN_REAL;
    if (same) match++;
    else {
      mismatch++;
      if (samples.length < 5) {
        samples.push({ filename: a.filename, localSize, remoteLen: remote.len, remoteOk: remote.ok });
      }
    }
  }

  const pass = mismatch === 0 && match === assetsDoc.assets.length;
  if (!QUIET) {
    console.log(`TT_OCS_STAGING_MEDIA_BYTES_PARITY: ${pass ? 'PASS' : 'FAIL'} match=${match}/${assetsDoc.assets.length}`);
    if (samples.length) console.log(JSON.stringify(samples, null, 2));
  }
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
