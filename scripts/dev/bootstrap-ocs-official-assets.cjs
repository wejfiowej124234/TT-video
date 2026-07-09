#!/usr/bin/env node
/**
 * Official Asset Baseline V1 · Bootstrap Upload (local + Staging/Production via Fly SSH or HTTP probe).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  loadAssetsManifest,
  bootstrapLocalAssets,
  verifyAssetDelivery,
  COMMUNITY_MEDIA_DIR,
  ROOT,
} = require('./lib/ocs-official-assets.cjs');

const API = (process.env.API || process.env.API_BASE || '').replace(/\/$/, '');
const FLY_APP = process.env.FLY_APP || (API.includes('tt-api-staging') ? 'tt-api-staging' : '');
const OUT = process.env.OUT || '';
const SKIP_FLY = process.env.OCS_ASSETS_SKIP_FLY === '1' || process.env.OCS_ASSETS_LOCAL_ONLY === '1';

(async () => {
  const assetsDoc = loadAssetsManifest();
  const copied = bootstrapLocalAssets(assetsDoc);
  console.log(`OCS_ASSETS_BOOTSTRAP: local copied ${copied.length} → ${COMMUNITY_MEDIA_DIR}`);

  let remoteOk = 0;
  let remoteFail = 0;
  const remoteLog = [];
  let remoteMethod = 'none';

  if (FLY_APP && !SKIP_FLY) {
    console.log(`OCS_ASSETS_BOOTSTRAP: fly ssh (b64 file + extract) → ${FLY_APP}`);
    try {
      const tarRel = 'data/.tmp-ocs-asset-baseline.tar.gz';
      execFileSync('tar', ['-czf', tarRel, '-C', 'data/official-cold-start/media', '.'], {
        cwd: ROOT,
        stdio: 'pipe',
      });
      const b64 = fs.readFileSync(path.join(ROOT, tarRel)).toString('base64');
      execFileSync('fly', ['ssh', 'console', '-a', FLY_APP, '-C', 'rm -f /tmp/ocs-asset-b64.txt'], {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      execFileSync('fly', ['ssh', 'console', '-a', FLY_APP, '-C', `printf '%s' '${b64}' > /tmp/ocs-asset-b64.txt`], {
        stdio: 'pipe',
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      });
      execFileSync(
        'fly',
        [
          'ssh',
          'console',
          '-a',
          FLY_APP,
          '-C',
          'mkdir -p data/community_post_media && base64 -d /tmp/ocs-asset-b64.txt | tar -xzf - -C data/community_post_media && rm -f /tmp/ocs-asset-b64.txt',
        ],
        { stdio: 'pipe', encoding: 'utf8' }
      );
      try {
        fs.unlinkSync(path.join(ROOT, tarRel));
      } catch {
        /* ignore */
      }
      remoteOk = assetsDoc.assets.length;
      remoteMethod = 'fly_ssh';
      console.log(`  fly ssh OK ${remoteOk} files`);
    } catch (e) {
      remoteFail = assetsDoc.assets.length;
      remoteLog.push({ ok: false, error: String(e.stderr || e.message || e).slice(0, 500) });
      console.error(`  fly ssh FAIL — will HTTP probe if API set`);
    }
  }

  if (remoteOk === 0 && API && assetsDoc.assets.length) {
    const probe = await verifyAssetDelivery(API, assetsDoc.assets[0]);
    if (probe.ok) {
      remoteOk = assetsDoc.assets.length;
      remoteFail = 0;
      remoteMethod = 'http_probe_existing';
      console.log(`OCS_ASSETS_BOOTSTRAP: remote OK via HTTP probe (${assetsDoc.assets[0].filename})`);
    }
  }

  const report = {
    schema: 'traveltrust.ocs_official_asset_bootstrap.v1',
    recorded_at: new Date().toISOString(),
    api: API || null,
    fly_app: FLY_APP || null,
    remote_method: remoteMethod,
    local_dir: COMMUNITY_MEDIA_DIR.replace(/\\/g, '/'),
    local_count: copied.length,
    remote_ok: remoteOk,
    remote_fail: remoteFail,
    remote_log: remoteLog,
    asset_count: assetsDoc.assets.length,
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  if (remoteOk < assetsDoc.assets.length && remoteFail > 0) {
    console.error(`OCS_ASSETS_BOOTSTRAP: FAIL remote ${remoteFail}/${assetsDoc.assets.length}`);
    process.exit(1);
  }
  console.log(`OCS_ASSETS_BOOTSTRAP: OK local=${copied.length} remote_ok=${remoteOk} method=${remoteMethod}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
