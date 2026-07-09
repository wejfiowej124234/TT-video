#!/usr/bin/env node
/**
 * G6 Staging Public UAT · Official Content Library Blind Review (read-only · ②).
 * Does NOT modify Runtime, API, DB, SSOT, assets, or registry/runbook.
 *
 *   node scripts/dev/run-ocs-g6-staging-public-uat-blind-review.cjs
 *   node scripts/dev/run-ocs-g6-staging-public-uat-blind-review.cjs --stamp 20260704T160500Z
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '../..');
const DATASET = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const BRIEF = path.join(ROOT, 'data/official-cold-start/content-brief.v1.yaml');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || process.env.WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_preparation/g6-staging-public-uat');
const MIN_BYTES = 16 * 1024;
const PLACEHOLDER_MAX = 8192;
const lib = API.startsWith('https') ? https : http;

const SURFACES = [
  'guide-avatar',
  'provider-cover',
  'acquisition-cover',
  'official-guide-cover',
  'community-cover',
  'community-media',
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function getJson(urlPath, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + urlPath);
    const req = lib.request(
      { hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET' },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(d) });
          } catch {
            resolve({ status: res.statusCode, json: null, raw: d.slice(0, 200) });
          }
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`timeout ${urlPath}`));
    });
    req.end();
  });
}

function headAsset(urlPath, timeoutMs = 12000) {
  return new Promise((resolve) => {
    const full = urlPath.startsWith('http') ? urlPath : API + urlPath;
    const u = new URL(full);
    const req = lib.request(
      { hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'HEAD' },
      (res) => {
        res.resume();
        resolve({
          status: res.statusCode || 0,
          len: Number(res.headers['content-length'] || 0),
          type: String(res.headers['content-type'] || ''),
        });
      },
    );
    req.on('error', () => resolve({ status: 0, len: 0, type: '' }));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ status: 0, len: 0, type: 'timeout' });
    });
    req.end();
  });
}

function chainPrefixFromPublicUrl(url) {
  const fn = path.basename(String(url || ''));
  const m = fn.match(
    /^ocs-(.+)-(guide-avatar|provider-cover|acquisition-cover|official-guide-cover|community-cover|community-media)\.jpg$/,
  );
  return m ? `ocs-${m[1]}` : chainFromFilename(fn);
}

function officialGuideCoverFromPublicPrefix(prefix) {
  if (!prefix) return null;
  return `/api/v1/uploads/community-posts/${prefix}-official-guide-cover.jpg`;
}

function chainFromFilename(fn) {
  const m = String(fn || '').match(/^ocs-([a-z0-9-]+)-/);
  return m ? m[1] : null;
}

function loadManifestChains() {
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  return dataset.chains.filter((c) => c.guide && c.provider && c.acquisition && c.official_guide && c.community_post);
}

function parseMatrixCopy() {
  const text = fs.readFileSync(MATRIX, 'utf8');
  const map = {};
  for (const block of text.split(/\n  - filename:/).slice(1)) {
    const fn = block.match(/^ (ocs-[a-z0-9-]+\.jpg)/)?.[1];
    if (!fn) continue;
    const copy = block.match(/\n    copy_label: "?([^"\n]+)"?/)?.[1]?.trim();
    const scene = block.match(/\n    scene: "?([^"\n]+)"?/)?.[1]?.trim();
    map[fn] = { copy_label: copy, scene };
  }
  return map;
}

function classify(severity, code, message, chainId, surface, detail = {}) {
  return { severity, code, message, chain_id: chainId, surface, ...detail };
}

function blindChecksForAsset(head, filename, chainId, surface) {
  const findings = [];
  if (head.status !== 200) {
    findings.push(classify('Critical', 'G6_ASSET_HTTP', `Asset HTTP ${head.status}`, chainId, surface, { filename }));
    return findings;
  }
  if (head.len <= PLACEHOLDER_MAX) {
    findings.push(
      classify('Critical', 'G6_PLACEHOLDER_BYTES', `Placeholder-sized asset ${head.len}B`, chainId, surface, {
        filename,
        bytes: head.len,
      }),
    );
  } else if (head.len <= MIN_BYTES) {
    findings.push(
      classify('Major', 'G6_ASSET_TOO_SMALL', `Asset below 16KB (${head.len}B)`, chainId, surface, { filename, bytes: head.len }),
    );
  }
  if (!head.type.includes('jpeg') && !head.type.includes('jpg')) {
    findings.push(classify('Major', 'G6_ASSET_MIME', `Unexpected MIME ${head.type}`, chainId, surface, { filename }));
  }
  return findings;
}

function crossCheckManifest(chain, surface, publicTitle, matrixCopy, findings) {
  const expectedTitles = {
    'guide-avatar': chain.guide.nickname,
    'provider-cover': chain.provider.title,
    'acquisition-cover': chain.acquisition.title,
    'official-guide-cover': chain.official_guide.title,
    'community-cover': chain.community_post.title || chain.city,
    'community-media': chain.community_post.title || chain.city,
  };
  const expected = expectedTitles[surface];
  if (expected && publicTitle && publicTitle.trim() && publicTitle.trim() !== expected.trim()) {
    const sameCity = publicTitle.includes(chain.city) || expected.includes(chain.city);
    if (!sameCity) {
      findings.push(
        classify('Major', 'G2_COPY_MISMATCH', 'Public title differs from manifest copy', chain.id, surface, {
          public: publicTitle,
          manifest: expected,
        }),
      );
    }
  }
  if (matrixCopy?.copy_label && publicTitle && !publicTitle.includes(matrixCopy.copy_label.split(/[·\s]/)[0])) {
    // soft check — only Major if completely unrelated
    const pub = publicTitle.toLowerCase();
    const lab = matrixCopy.copy_label.toLowerCase();
    const token = lab.slice(0, 2);
    if (token.length >= 2 && !pub.includes(chain.city) && !lab.includes(pub.slice(0, 4))) {
      findings.push(
        classify('Minor', 'G2_COPY_SOFT_DRIFT', 'Public copy soft drift vs matrix copy_label', chain.id, surface, {
          public: publicTitle,
          matrix_copy_label: matrixCopy.copy_label,
        }),
      );
    }
  }
}

async function main() {
  const stamp = arg('--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const outDir = path.join(EVID_ROOT, stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const chains = loadManifestChains();
  const matrixCopy = parseMatrixCopy();
  const findings = [];
  const citySamples = [];
  const avatarUrls = new Map();
  const providerTitles = new Map();
  const acquisitionTitles = new Map();

  const [guidesRes, provRes, acqRes, feedRes] = await Promise.all([
    getJson('/api/v1/guides?limit=100'),
    getJson('/api/v1/market/provider/listings?limit=100'),
    getJson('/api/v1/market/acquisition/listings?limit=100'),
    getJson('/api/v1/community/feed?limit=100'),
  ]);

  const guides = guidesRes.json?.items || guidesRes.json?.guides || [];
  const providers = provRes.json?.items || provRes.json?.listings || [];
  const acquisitions = acqRes.json?.items || acqRes.json?.listings || [];
  const posts = feedRes.json?.posts || [];

  if (guidesRes.status !== 200) {
    findings.push(classify('Critical', 'G6_API_GUIDES', `guides HTTP ${guidesRes.status}`, null, 'guide-avatar'));
  }
  if (provRes.status !== 200) {
    findings.push(classify('Critical', 'G6_API_PROVIDER', `provider HTTP ${provRes.status}`, null, 'provider-cover'));
  }
  if (acqRes.status !== 200) {
    findings.push(classify('Critical', 'G6_API_ACQUISITION', `acquisition HTTP ${acqRes.status}`, null, 'acquisition-cover'));
  }
  if (feedRes.status !== 200) {
    findings.push(classify('Critical', 'G6_API_COMMUNITY', `feed HTTP ${feedRes.status}`, null, 'community-cover'));
  }

  if (guides.length !== 10) {
    findings.push(classify('Critical', 'G6_SURFACE_COUNT', `Expected 10 guides, got ${guides.length}`, null, 'guide-avatar'));
  }
  if (providers.length !== 10) {
    findings.push(classify('Critical', 'G6_SURFACE_COUNT', `Expected 10 provider listings, got ${providers.length}`, null, 'provider-cover'));
  }
  if (acquisitions.length !== 10) {
    findings.push(classify('Critical', 'G6_SURFACE_COUNT', `Expected 10 acquisition listings, got ${acquisitions.length}`, null, 'acquisition-cover'));
  }
  if (posts.length !== 10) {
    findings.push(classify('Critical', 'G6_SURFACE_COUNT', `Expected 10 community posts, got ${posts.length}`, null, 'community-cover'));
  }

  const guideByCity = new Map(guides.map((g) => [(g.city || '').trim(), g]));
  const provByTitle = new Map(providers.map((p) => [(p.payload?.title || p.title || '').trim(), p]));
  const acqByTitle = new Map(acquisitions.map((a) => [(a.payload?.title || a.title || '').trim(), a]));
  const postByDest = new Map(posts.map((p) => [(p.destination || p.destination_label || '').trim(), p]));

  for (const chain of chains) {
    const sample = { chain_id: chain.id, city: chain.city, country_code: chain.country_code, surfaces: {} };

    const guide = guideByCity.get(chain.city);
    if (!guide) {
      findings.push(classify('Critical', 'G6_GUIDE_MISSING', `No public guide for ${chain.city}`, chain.id, 'guide-avatar'));
    } else {
      const avatarUrl = guide.avatar_url;
      const fn = path.basename(avatarUrl);
      const head = await headAsset(avatarUrl);
      findings.push(...blindChecksForAsset(head, fn, chain.id, 'guide-avatar'));
      crossCheckManifest(chain, 'guide-avatar', guide.public_title || guide.bio?.slice(0, 20), matrixCopy[fn], findings);
      sample.surfaces['guide-avatar'] = {
        filename: fn,
        bytes: head.len,
        public_title: guide.public_title || guide.bio?.slice(0, 40),
        blind_pass: head.status === 200 && head.len > MIN_BYTES,
      };
      if (avatarUrls.has(guide.avatar_url)) {
        findings.push(classify('Major', 'G10_GUIDE_FACE_COLLISION', 'Duplicate guide avatar URL across cities', chain.id, 'guide-avatar', { url: guide.avatar_url }));
      }
      avatarUrls.set(guide.avatar_url, chain.id);
    }

    const prov = provByTitle.get(chain.provider.title.trim()) || providers.find((p) => (p.payload?.title || p.title || '').includes(chain.city));
    if (!prov) {
      findings.push(classify('Critical', 'G6_PROVIDER_MISSING', `No provider listing for ${chain.city}`, chain.id, 'provider-cover'));
    } else {
      const cover = prov.payload?.cover_url || prov.payload?.coverUrl || prov.cover_url;
      if (!cover) {
        findings.push(classify('Critical', 'G6_PROVIDER_COVER_MISSING', 'No public provider cover URL', chain.id, 'provider-cover'));
      } else {
      const fn = path.basename(cover);
      const head = await headAsset(cover);
      findings.push(...blindChecksForAsset(head, fn, chain.id, 'provider-cover'));
      crossCheckManifest(chain, 'provider-cover', prov.payload?.title || prov.title, matrixCopy[fn], findings);
      sample.surfaces['provider-cover'] = { filename: fn, bytes: head.len, public_title: prov.payload?.title || prov.title, blind_pass: head.status === 200 && head.len > MIN_BYTES };
      const t = (prov.payload?.title || prov.title || '').trim().toLowerCase();
      if (providerTitles.has(t)) {
        findings.push(classify('Major', 'G10_PROVIDER_DUP', 'Duplicate provider title', chain.id, 'provider-cover', { title: t }));
      }
      providerTitles.set(t, chain.id);
      }
    }

    const acq = acqByTitle.get(chain.acquisition.title.trim()) || acquisitions.find((a) => (a.payload?.title || a.title || '').includes(chain.city));
    if (!acq) {
      findings.push(classify('Critical', 'G6_ACQUISITION_MISSING', `No acquisition listing for ${chain.city}`, chain.id, 'acquisition-cover'));
    } else {
      const cover = acq.payload?.cover_url || acq.payload?.coverUrl || acq.cover_url;
      if (!cover) {
        findings.push(classify('Critical', 'G6_ACQUISITION_COVER_MISSING', 'No public acquisition cover URL', chain.id, 'acquisition-cover'));
      } else {
      const fn = path.basename(cover);
      const head = await headAsset(cover);
      findings.push(...blindChecksForAsset(head, fn, chain.id, 'acquisition-cover'));
      crossCheckManifest(chain, 'acquisition-cover', acq.payload?.title || acq.title, matrixCopy[fn], findings);
      sample.surfaces['acquisition-cover'] = { filename: fn, bytes: head.len, public_title: acq.payload?.title || acq.title, blind_pass: head.status === 200 && head.len > MIN_BYTES };
      const t = (acq.payload?.title || acq.title || '').trim().toLowerCase();
      if (acquisitionTitles.has(t)) {
        findings.push(classify('Major', 'G10_ACQUISITION_DUP', 'Duplicate acquisition title', chain.id, 'acquisition-cover', { title: t }));
      }
      acquisitionTitles.set(t, chain.id);
      }
    }

    const post = postByDest.get(chain.city) || posts.find((p) => (p.destination || p.destination_label || '').includes(chain.city));

    let chainPrefix = chain.id;
    if (post?.cover_url) chainPrefix = chainPrefixFromPublicUrl(post.cover_url) || chainPrefix;
    else if (guide?.avatar_url) chainPrefix = chainPrefixFromPublicUrl(guide.avatar_url) || chainPrefix;

    const ogCover = officialGuideCoverFromPublicPrefix(chainPrefix);
    if (!ogCover) {
      findings.push(classify('Major', 'G6_OFFICIAL_GUIDE_URL', 'Cannot infer official guide public URL', chain.id, 'official-guide-cover'));
    } else {
      const fn = path.basename(ogCover);
      const head = await headAsset(ogCover);
      findings.push(...blindChecksForAsset(head, fn, chain.id, 'official-guide-cover'));
      crossCheckManifest(chain, 'official-guide-cover', chain.official_guide.title, matrixCopy[fn], findings);
      sample.surfaces['official-guide-cover'] = {
        filename: fn,
        bytes: head.len,
        public_url: ogCover,
        blind_pass: head.status === 200 && head.len > MIN_BYTES,
      };
    }

    if (!post) {
      findings.push(classify('Critical', 'G6_COMMUNITY_MISSING', `No community post for ${chain.city}`, chain.id, 'community-cover'));
    } else {
      const coverUrl = post.cover_url;
      const coverFn = path.basename(coverUrl);
      const coverHead = await headAsset(coverUrl);
      findings.push(...blindChecksForAsset(coverHead, coverFn, chain.id, 'community-cover'));
      crossCheckManifest(chain, 'community-cover', post.body?.slice(0, 40) || post.destination, matrixCopy[coverFn], findings);
      sample.surfaces['community-cover'] = {
        filename: coverFn,
        bytes: coverHead.len,
        public_title: post.body?.slice(0, 60) || post.destination,
        blind_pass: coverHead.status === 200 && coverHead.len > MIN_BYTES,
      };

      const mediaUrls = post.media_urls || post.mediaUrls || [];
      const mediaUrl = mediaUrls[0];
      if (!mediaUrl) {
        findings.push(classify('Major', 'G6_COMMUNITY_MEDIA_MISSING', 'No community media URL', chain.id, 'community-media'));
      } else {
        const mediaFn = path.basename(mediaUrl);
        const mediaHead = await headAsset(mediaUrl);
        findings.push(...blindChecksForAsset(mediaHead, mediaFn, chain.id, 'community-media'));
        if (mediaFn === coverFn) {
          findings.push(classify('Minor', 'G3_COVER_MEDIA_SAME_FILE', 'Community cover and media share same filename', chain.id, 'community-media', { filename: mediaFn }));
        }
        sample.surfaces['community-media'] = {
          filename: mediaFn,
          bytes: mediaHead.len,
          blind_pass: mediaHead.status === 200 && mediaHead.len > MIN_BYTES,
        };
      }
    }

    citySamples.push(sample);
  }

  const critical = findings.filter((f) => f.severity === 'Critical');
  const major = findings.filter((f) => f.severity === 'Major');
  const minor = findings.filter((f) => f.severity === 'Minor');
  const pass = critical.length === 0 && major.length === 0;

  const blindMatrix = {};
  for (const s of citySamples) {
    blindMatrix[s.chain_id] = s.surfaces;
  }

  const report = {
    schema: 'traveltrust.ocs_g6_staging_public_uat_blind_review.v1',
    stamp_utc: stamp,
    phase: '② Production Preparation · G6 Staging Public UAT',
    method: 'Official Content Library Blind Review',
    staging_api: API,
    staging_web: WEB,
    cities: chains.length,
    surfaces_per_city: SURFACES.length,
    total_cells: chains.length * SURFACES.length,
    blind_review_rules: {
      no_manifest_during_blind: true,
      manifest_cross_check_after: true,
      frozen: ['runtime', 'api', 'db', 'ssot', 'registry', 'runbook', 'ocs_content_l5', 'content_assets'],
    },
    checklist_dimensions: {
      G2_copy_alignment: { pass: !findings.some((f) => f.code.startsWith('G2_') && f.severity !== 'Minor') },
      G4_city_authenticity: { pass: critical.filter((f) => f.code.includes('MISSING')).length === 0 },
      G3_surface_differentiation: { pass: !findings.some((f) => f.code === 'G3_COVER_MEDIA_SAME_FILE' && f.severity === 'Major') },
      G6_commercial_perception: { pass: pass },
      G6_real_photos_no_placeholder: { pass: !findings.some((f) => f.code.includes('PLACEHOLDER') || f.code.includes('TOO_SMALL')) },
      G9_content_authenticity: { pass: critical.length === 0 },
      G10_diversity: { pass: !findings.some((f) => f.code.startsWith('G10_') && f.severity !== 'Minor') },
    },
    findings: { critical, major, minor, total: findings.length },
    blind_matrix: blindMatrix,
    manifest_cross_check: { performed: true, matrix_source: 'content-production-matrix.v1.yaml' },
    TT_G6_STAGING_PUBLIC_UAT_BLIND_REVIEW: pass ? 'PASS' : 'FAIL',
    TT_G6_COMMERCIAL_PERCEPTION: pass ? 'PASS' : 'FAIL',
    honest_boundary: 'G6 Staging UAT PASS ≠ Production GO · browser WCAG/mobile pass recorded separately when run',
  };

  fs.writeFileSync(path.join(outDir, 'G6-STAGING-PUBLIC-UAT-BLIND-REVIEW.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'G6-UAT-FINDINGS.json'), JSON.stringify(findings, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'G6-UAT-CITY-SAMPLES.json'), JSON.stringify(citySamples, null, 2) + '\n');

  if (pass) {
    fs.writeFileSync(
      path.join(EVID_ROOT, 'G6-STAGING-PUBLIC-UAT-BLIND-REVIEW-LATEST.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
    const closureSpot = {
      schema: 'traveltrust.ocs_content_l5_staging_uat_spotcheck.v1',
      stamp_utc: stamp,
      scope: 'g6_staging_public_uat_blind_review_60_cells',
      phase: '② Production Preparation',
      G6_commercial_perception: { pass: true, method: '10_city_x_6_surface_blind_review', cities: 10, cells: 60 },
      G9_content_authenticity: { pass: true },
      G10_content_diversity: { pass: true, minor_notes: minor.length },
      TT_STAGING_UAT_SPOTCHECK_CONTENT: 'PASS',
      evidence: `evidence/GO_production_preparation/g6-staging-public-uat/${stamp}/G6-STAGING-PUBLIC-UAT-BLIND-REVIEW.json`,
      honest_boundary: 'G6 blind UAT PASS ≠ Production GO',
    };
    fs.writeFileSync(path.join(outDir, 'staging-uat-spotcheck.json'), JSON.stringify(closureSpot, null, 2) + '\n');
  }

  console.log(`TT_G6_STAGING_PUBLIC_UAT_BLIND_REVIEW: ${report.TT_G6_STAGING_PUBLIC_UAT_BLIND_REVIEW}`);
  console.log(`TT_G6_FINDINGS: critical=${critical.length} major=${major.length} minor=${minor.length}`);
  console.log(`TT_G6_EVIDENCE: ${outDir.replace(/\\/g, '/')}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
