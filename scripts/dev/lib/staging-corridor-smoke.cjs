/**
 * Phase ② staging corridor smoke body prefixes (c3/c10/c12/c4/c5).
 * SSOT shared by purge · align · feed filter · Rust community_public_surface.
 */

function isStagingCorridorSmokeBody(body) {
  const b = String(body || '').trim();
  if (!b) return false;
  const low = b.toLowerCase();
  return (
    low.startsWith('c3-moderation-staging') ||
    low.startsWith('c10-') ||
    low.startsWith('c12-') ||
    low.startsWith('c4-staging') ||
    low.startsWith('c5-staging') ||
    low.startsWith('c4_') ||
    low.startsWith('c5_')
  );
}

module.exports = { isStagingCorridorSmokeBody };
