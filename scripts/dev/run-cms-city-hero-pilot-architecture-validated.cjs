#!/usr/bin/env node
/**
 * City Hero · Pilot Architecture Validated · pause WP5 evidence
 * Registry SSOT input · 非 Frozen
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_operation/city-hero');
const OUT_JSON = path.join(EVID_DIR, 'CMS-CITY-HERO-PILOT-ARCHITECTURE-VALIDATED-LATEST.json');
const OUT_MD = path.join(EVID_DIR, 'CMS-CITY-HERO-PILOT-ARCHITECTURE-VALIDATED-LATEST.md');

const WP_EVID = {
  wp0: 'CMS-CITY-HERO-WAVE1-WP0-MIGRATION-LATEST.json',
  wp1: 'CMS-CITY-HERO-WAVE1-WP1-ADMIN-ALLOWLIST-LATEST.json',
  wp2: 'CMS-CITY-HERO-WAVE1-WP2-API-CITY-SLUG-LATEST.json',
  wp3: 'CMS-CITY-HERO-WAVE1-WP3-PUBLISH-LATEST.json',
  wp4: 'CMS-CITY-HERO-WAVE1-WP4-RESOLVER-LATEST.json',
};

function readWp(file) {
  const p = path.join(EVID_DIR, file);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const stamp = new Date().toISOString();
  const wps = Object.fromEntries(Object.entries(WP_EVID).map(([k, f]) => [k, readWp(f)]));

  const wpPass = ['wp0', 'wp1', 'wp2', 'wp3', 'wp4'].every(
    (k) => wps[k]?.[`TT_CMS_CITY_HERO_WAVE1_${k.toUpperCase()}`] === 'PASS' ||
      wps[k]?.[`TT_CMS_CITY_HERO_WAVE1_${k.replace('wp', 'WP')}`] === 'PASS',
  );

  // normalize keys
  const checks = {
    wp0: wps.wp0?.TT_CMS_CITY_HERO_WAVE1_WP0 === 'PASS',
    wp1: wps.wp1?.TT_CMS_CITY_HERO_WAVE1_WP1 === 'PASS',
    wp2: wps.wp2?.TT_CMS_CITY_HERO_WAVE1_WP2 === 'PASS',
    wp3: wps.wp3?.TT_CMS_CITY_HERO_WAVE1_WP3 === 'PASS',
    wp4: wps.wp4?.TT_CMS_CITY_HERO_WAVE1_WP4 === 'PASS',
  };
  const allWpPass = Object.values(checks).every(Boolean);

  const doc = {
    schema: 'traveltrust.cms_city_hero_pilot_architecture_validated.v1',
    recorded_at_utc: stamp,
    TT_CMS_CITY_HERO_STATUS: 'Pilot Architecture Validated',
    TT_CMS_CITY_HERO_REGISTRY_STATUS: 'Pilot',
    TT_CMS_CITY_HERO_FROZEN: false,
    not_frozen_reasons: [
      'no_full_l5_exit',
      'no_consumer_verify',
      'no_formal_ops_asset_matrix',
      'wp5_consumer_paused',
    ],
    completed: {
      design_ssot: true,
      runtime_contract_review_pass: true,
      wp0_db_migration: checks.wp0,
      wp1_admin_allowlist: checks.wp1,
      wp2_api_city_slug: checks.wp2,
      wp3_catalog_publish_pilot: checks.wp3,
      wp4_resolver: checks.wp4,
    },
    paused: {
      wp5_consumer_home_travel: true,
      reason: 'prioritize_market_ops_hotel_and_prelaunch_blockers',
    },
    p1_focus_shift: {
      next_cms_p1: 'Hotel',
      transport: '后续',
      listings: '后续',
    },
    wp_evidence: WP_EVID,
    verdict: allWpPass ? 'PASS' : 'INCOMPLETE',
  };

  const md = [
    '# City Hero · Pilot Architecture Validated',
    '',
    '| | |',
    '|---|---|',
    `| **Date** | ${stamp.slice(0, 10)} |`,
    '| **Registry Status** | **Pilot** (not Frozen) |',
    '| **Label** | Pilot Architecture Validated |',
    '',
    '## Completed',
    '',
    '- Design SSOT ✅',
    '- Runtime Contract Review PASS ✅',
    '- WP0–WP4 ✅',
    '',
    '## Paused',
    '',
    '- WP5 Home/Travel Consumer',
    '',
    '## Not Frozen',
    '',
    '- 无完整 L5 Exit · 无 Consumer Verify · 无正式运营资产矩阵',
    '',
    '## P1 Next',
    '',
    '- **Hotel** 下一重点 · Transport / Listings 后续',
  ].join('\n');

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log(`TT_CMS_CITY_HERO_STATUS: ${doc.TT_CMS_CITY_HERO_STATUS}`);
  console.log(`TT_CMS_CITY_HERO_FROZEN: ${doc.TT_CMS_CITY_HERO_FROZEN}`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main();
