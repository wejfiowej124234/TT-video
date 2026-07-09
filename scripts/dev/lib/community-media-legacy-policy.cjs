#!/usr/bin/env node
/**
 * Community Media Runtime Readiness · legacy / demo / showcase URL policy (PRM-MEDIA-B001)
 * Shared by audit + runtime validators — not PCP architecture.
 */
const LEGACY_DEMO_HOSTS = [
  'unsplash.com',
  'images.unsplash.com',
  'w3schools.com',
  'samplelib.com',
  'filesamples.com',
];

const STALE_TEST_CDN_HOSTS = ['cdn.example.test'];

function norm(url) {
  return String(url || '').trim();
}

function lower(url) {
  return norm(url).toLowerCase();
}

function isLegacyDemoHost(url) {
  const s = lower(url);
  return LEGACY_DEMO_HOSTS.some((h) => s.includes(h));
}

function isLegacyUploadCommunityPath(url) {
  const s = lower(url);
  return s.includes('/uploads/community-posts/') || s.includes('/api/v1/uploads/community-posts/');
}

function isLegacyUploadVideo(url) {
  if (!isLegacyUploadCommunityPath(url)) return false;
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

function isStaleTestCdnPlayback(url) {
  const s = lower(url);
  return STALE_TEST_CDN_HOSTS.some((h) => s.includes(h));
}

/** Non-governed media URL for Production Profile public surfaces */
function isNonGovernedCommunityMediaUrl(url) {
  if (!norm(url)) return false;
  return (
    isLegacyDemoHost(url) ||
    isLegacyUploadVideo(url) ||
    isStaleTestCdnPlayback(url)
  );
}

function classifyCommunityMediaUrl(url) {
  if (!norm(url)) return 'empty';
  if (isLegacyDemoHost(url)) return 'legacy_demo_host';
  if (isLegacyUploadVideo(url)) return 'legacy_upload_video';
  if (isStaleTestCdnPlayback(url)) return 'stale_test_cdn';
  if (isLegacyUploadCommunityPath(url)) return 'local_upload_image';
  if (/^https?:\/\//i.test(url)) return 'remote_http';
  if (url.startsWith('/')) return 'api_relative';
  return 'other';
}

function collectPostMediaUrls(post) {
  const out = [];
  const push = (u) => {
    const x = norm(u);
    if (x) out.push(x);
  };
  push(post?.media_url);
  push(post?.cover_url);
  for (const u of post?.media_urls || []) push(u);
  return out;
}

function mediaViolationsFromPosts(posts, context) {
  const v = [];
  for (const p of posts || []) {
    const id = String(p.id || p.post_id || '');
    for (const u of collectPostMediaUrls(p)) {
      if (isNonGovernedCommunityMediaUrl(u)) {
        v.push({
          context,
          post_id: id,
          url: u,
          class: classifyCommunityMediaUrl(u),
        });
      }
    }
  }
  return v;
}

function resolveMediaUrlForFetch(raw, apiBase) {
  const u = norm(raw);
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('/')) return `${apiBase.replace(/\/$/, '')}${u}`;
  return u;
}

module.exports = {
  LEGACY_DEMO_HOSTS,
  STALE_TEST_CDN_HOSTS,
  isLegacyDemoHost,
  isLegacyUploadCommunityPath,
  isLegacyUploadVideo,
  isStaleTestCdnPlayback,
  isNonGovernedCommunityMediaUrl,
  classifyCommunityMediaUrl,
  collectPostMediaUrls,
  mediaViolationsFromPosts,
  resolveMediaUrlForFetch,
};
