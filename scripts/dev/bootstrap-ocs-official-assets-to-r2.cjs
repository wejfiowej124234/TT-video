#!/usr/bin/env node
/**
 * Bootstrap Official Asset Baseline V1 objects to R2 (dry-run default).
 *
 *   node scripts/dev/bootstrap-ocs-official-assets-to-r2.cjs
 *   node scripts/dev/bootstrap-ocs-official-assets-to-r2.cjs --apply
 *
 * Requires AWS SDK + env from production-media-r2-cdn.env.example
 */
const fs = require('fs');
const path = require('path');
const {
  ROOT,
  loadPolicyRegistry,
  loadAssetsManifest,
  buildR2UploadManifest,
} = require('./lib/g3-production-cdn-policy.cjs');

const apply = process.argv.includes('--apply');
const outPath =
  process.env.OUT ||
  path.join(ROOT, 'evidence/GO_production_readiness/G3-01/preparation/r2-bootstrap-result.v1.json');

const policy = loadPolicyRegistry();
const assetsDoc = loadAssetsManifest();
const manifest = buildR2UploadManifest(assetsDoc, policy);

const bucket = process.env.COMMUNITY_MEDIA_S3_BUCKET || manifest.bucket;
const endpoint = process.env.COMMUNITY_MEDIA_S3_ENDPOINT || '';
const region = process.env.COMMUNITY_MEDIA_S3_REGION || 'auto';
const accessKey = process.env.AWS_ACCESS_KEY_ID || '';
const secretKey = process.env.AWS_SECRET_ACCESS_KEY || '';

const results = [];
let ok = true;

async function uploadOne(obj) {
  const src = path.join(ROOT, obj.local_source);
  if (!fs.existsSync(src)) {
    return { key: obj.r2_key, ok: false, error: 'missing_local_source' };
  }
  if (!apply) {
    return { key: obj.r2_key, ok: true, mode: 'dry_run', bytes: fs.statSync(src).size };
  }
  if (!endpoint || !accessKey || !secretKey) {
    return { key: obj.r2_key, ok: false, error: 'missing_r2_credentials' };
  }
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: process.env.COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE === '1',
  });
  const body = fs.readFileSync(src);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: obj.r2_key,
      Body: body,
      ContentType: obj.mime,
      CacheControl: manifest.cache_control,
    })
  );
  return { key: obj.r2_key, ok: true, mode: 'applied', bytes: body.length };
}

(async () => {
  for (const obj of manifest.objects) {
    try {
      const r = await uploadOne(obj);
      results.push(r);
      if (!r.ok) ok = false;
    } catch (e) {
      ok = false;
      results.push({ key: obj.r2_key, ok: false, error: String(e.message || e) });
    }
  }

  const report = {
    schema: 'traveltrust.g3_ocs_r2_bootstrap_result.v1',
    mode: apply ? 'apply' : 'dry_run',
    bucket,
    object_count: manifest.objects.length,
    ok_count: results.filter((r) => r.ok).length,
    ok,
    results,
    honest_boundary: apply
      ? 'R2 upload ≠ G3 CDN VERIFIED until CDN DNS + cache probes pass'
      : 'Dry-run only — Owner must --apply after production secrets configured',
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`OCS_R2_BOOTSTRAP: ${ok ? 'OK' : 'FAIL'} mode=${report.mode} ${report.ok_count}/${report.object_count}`);
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
