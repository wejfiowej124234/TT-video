/**
 * TT_STAGING_RC_BASELINE · unified Public Surface SSOT (② only).
 *
 * POLICY (write dead · registry/staging-rc-baseline.v1.yaml):
 *   - 47/47 PASS is an outcome, not the standard.
 *   - Every current and future Public Surface MUST use this single chain:
 *     one Baseline · one SSOT · one Gate · one Audit · one Evidence · one Enforcement.
 *   - New surfaces: register here + audit checklist BEFORE UI/deploy — not Release Candidate until PASS.
 *
 * Domains: market (provider/acquisition) · guides · itinerary · official_guide ·
 *          community · campaign · baseline pointer.
 */
const fs = require('fs');
const path = require('path');
const { loadOcsEntityIds } = require('./smoke-data-heuristics.cjs');

const ROOT_DEFAULT = path.join(__dirname, '../../..');

const CANONICAL_ADMISSION_POLICY =
  '任何新增 Public Surface、业务模块或公开展示能力，必须先完成 Baseline 注册、SSOT 建模、' +
  '统一 Gate、统一 Audit、统一 Evidence，并通过 TT_STAGING_RC_BASELINE 验证后，才允许进入 Staging；' +
  '任何未纳入 Baseline 的模块不得部署、不得公开展示、不得视为 Release Candidate。';

/** @type {Record<string, number>} */
const EXPECTED_PUBLIC_SURFACE = {
  community_feed: 10,
  public_guides: 10,
  market_provider: 10,
  market_acquisition: 10,
  official_guides_published: 10,
  campaigns_deployed: 10,
  corridor_smoke: 0,
  official_assets: 60,
};

const CAMPAIGN_SURFACES = [
  'home_hero',
  'home_feed',
  'market_feed',
  'community_feed',
  'community_featured',
  'campaign_banner',
  'landing_promo',
];

const CAMPAIGN_SURFACE_PATHS = {
  home_hero: '/api/v1/official/cold-start/surfaces/home_hero',
  home_feed: '/api/v1/official/cold-start/surfaces/home_feed',
  market_feed: '/api/v1/official/cold-start/surfaces/market_feed',
  community_feed: '/api/v1/official/cold-start/surfaces/community_feed',
  community_featured: '/api/v1/official/cold-start/surfaces/community_featured',
  campaign_banner: '/api/v1/official/cold-start/surfaces/campaign_banner',
  landing_promo: '/api/v1/official/cold-start/surfaces/landing_promo',
};

const PUBLIC_DOMAINS = [
  'baseline',
  'market',
  'guides',
  'itinerary',
  'official_guide',
  'community',
  'campaign',
  'admin',
  'asset',
  'api',
];

function loadDataset(root) {
  const p = path.join(root, 'data/official-cold-start/dataset.v1.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function isPublishedOfficialGuide(row) {
  const st = String(row.status || row.publish_status || '').toLowerCase();
  return st === 'published';
}

function isDeployedCampaign(row) {
  return String(row.status || '').toLowerCase() === 'deployed';
}

/**
 * Load full unified baseline: OCS entity ID sets + expected counts + campaign surface map.
 */
function loadUnifiedBaseline(root = ROOT_DEFAULT) {
  const ids = loadOcsEntityIds(root);
  const dataset = loadDataset(root);
  const ocsOfficialGuideIds = new Set(ids.ocsOfficialGuideIds || []);
  const ocsCampaignIds = new Set(ids.ocsCampaignIds || []);
  /** @type {Map<string, string>} slug → uuid */
  const ocsCampaignBySlug = new Map();

  if (ids.ocs_state && fs.existsSync(ids.ocs_state)) {
    try {
      const state = JSON.parse(fs.readFileSync(ids.ocs_state, 'utf8'));
      for (const v of Object.values(state.official_guides || {})) {
        if (v?.id) ocsOfficialGuideIds.add(String(v.id));
      }
      for (const [slug, v] of Object.entries(state.campaigns || {})) {
        if (v?.id) {
          ocsCampaignIds.add(String(v.id));
          ocsCampaignBySlug.set(slug, String(v.id));
        }
      }
    } catch {
      /* ignore */
    }
  }

  const datasetCampaignCount = (dataset?.campaigns || []).length || 10;

  return {
    root,
    ocs_state: ids.ocs_state,
    ocsGuideIds: ids.ocsGuideIds,
    ocsListingIds: ids.ocsListingIds,
    ocsCommunityPostIds: ids.ocsCommunityPostIds,
    ocsOfficialGuideIds,
    ocsCampaignIds,
    ocsCampaignBySlug,
    expected: { ...EXPECTED_PUBLIC_SURFACE },
    campaignSurfaces: CAMPAIGN_SURFACES,
    campaignSurfacePaths: CAMPAIGN_SURFACE_PATHS,
    publicDomains: PUBLIC_DOMAINS,
    datasetCampaignCount,
    registry: 'registry/staging-rc-baseline.v1.yaml',
    ssotChain: [
      'RELEASE-CANDIDATE',
      'data/official-cold-start/dataset.v1.json',
      'data/official-cold-start/assets.v1.json',
      'OCS state.json',
      'governed public views',
    ],
  };
}

module.exports = {
  CANONICAL_ADMISSION_POLICY,
  EXPECTED_PUBLIC_SURFACE,
  CAMPAIGN_SURFACES,
  CAMPAIGN_SURFACE_PATHS,
  PUBLIC_DOMAINS,
  loadDataset,
  loadUnifiedBaseline,
  isPublishedOfficialGuide,
  isDeployedCampaign,
};
