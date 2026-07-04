/**
 * Runtime Truth · Call Graph anchors (shared by Runtime Truth Audit + Reality Verification).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');

/** @type {Array<{id:string,label:string,checks:Array<{file:string,must?:string[],mustNot?:string[],fn?:string}>}>} */
const ANCHORS = [
  {
    id: 'RT-COMM-FEED',
    label: 'Community Feed → feed_builder → governed view + content filter',
    checks: [
      {
        file: 'crates/api/src/routes/community/posts.rs',
        must: ['feed_builder::list_feed', 'filter_feed_posts_content_readiness'],
      },
      {
        file: 'crates/api/src/pcp/feed_builder.rs',
        must: ['pub use crate::db', 'GOVERNED_VIEW'],
      },
      {
        file: 'crates/api/src/db/community.rs',
        must: ['governed_community_posts_v1'],
      },
    ],
  },
  {
    id: 'RT-COMM-DETAIL',
    label: 'Community Detail → public_post_json_for_content_readiness',
    checks: [
      {
        file: 'crates/api/src/routes/community/posts.rs',
        fn: 'get_post_detail',
        must: ['get_governed_public_post_by_id', 'public_post_json_for_content_readiness'],
      },
      {
        file: 'crates/api/src/chain_off/community_public_surface.rs',
        must: ['pub fn public_post_json_for_content_readiness'],
      },
    ],
  },
  {
    id: 'RT-COMM-PROFILE',
    label: 'Community public profile → filter_feed_posts_content_readiness when public_only',
    checks: [
      {
        file: 'crates/api/src/db/community.rs',
        must: ['governed_community_posts_v1', 'list_posts_by_user'],
      },
      {
        file: 'crates/api/src/routes/community/posts.rs',
        fn: 'get_user_posts',
        must: ['public_only', 'filter_feed_posts_content_readiness'],
      },
    ],
  },
  {
    id: 'RT-MKT-DISCOVER',
    label: 'Discover list intersects governed_discover_orders_v1 in production profile',
    checks: [
      {
        file: 'crates/api/src/chain_off/discover.rs',
        must: ['filter_order_ids_in_governed_discover_view', 'public_catalog_surface_filter_enabled'],
      },
      {
        file: 'crates/api/src/db/market_catalog.rs',
        must: ['filter_order_ids_in_governed_discover_view', 'GOVERNED_DISCOVER_ORDERS_VIEW'],
      },
    ],
  },
  {
    id: 'RT-MKT-GUIDES-OK',
    label: 'Guides catalog → list_governed_market_guides',
    checks: [
      {
        file: 'crates/api/src/chain_off/guides.rs',
        must: ['list_governed_market_guides'],
      },
      {
        file: 'crates/api/src/db/market_catalog.rs',
        must: ['GOVERNED_MARKET_GUIDES_VIEW'],
      },
    ],
  },
  {
    id: 'RT-MKT-LISTINGS-OK',
    label: 'Market listings production path → governed_market_listings_v1',
    checks: [
      {
        file: 'crates/api/src/db/market_listings.rs',
        must: ['list_governed_market_listings_by_variant', 'public_catalog_only'],
      },
      {
        file: 'crates/api/src/routes/market_subsite.rs',
        must: ['public_catalog_surface_filter_enabled'],
      },
      {
        file: 'crates/api/src/db/market_catalog.rs',
        must: ['GOVERNED_MARKET_LISTINGS_VIEW'],
      },
    ],
  },
  {
    id: 'RT-CAMP-OK',
    label: 'Official cold-start consumer → governed campaign adapter chain',
    checks: [
      {
        file: 'crates/api/src/routes/official/handlers.rs',
        must: ['get_deployed_campaign_for_surface'],
      },
      {
        file: 'crates/api/src/db/ops_cold_start_campaigns_consumer.rs',
        must: ['get_deployed_campaign_for_surface', 'get_governed_campaign_for_surface'],
      },
    ],
  },
  {
    id: 'RT-FEED-BUILDER-REEXPORT',
    label: 'feed_builder re-exports db (Builder contract via re-export)',
    checks: [
      {
        file: 'crates/api/src/pcp/feed_builder.rs',
        must: ['pub use crate::db', 'BUILDER_ID', 'feed_builder'],
      },
    ],
  },
];

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function checkText(text, check, rel) {
  const scope = check.fn
    ? (() => {
        const markers = [`pub(super) async fn ${check.fn}`, `async fn ${check.fn}`];
        for (const m of markers) {
          const idx = text.indexOf(m);
          if (idx >= 0) return text.slice(idx, idx + 12000);
        }
        return '';
      })()
    : text;

  if (check.fn && !scope) {
    return { ok: false, detail: `${rel} missing fn ${check.fn}` };
  }

  for (const m of check.must || []) {
    if (!scope.includes(m)) {
      return { ok: false, detail: `${rel} missing "${m}"` };
    }
  }
  for (const n of check.mustNot || []) {
    if (scope.includes(n)) {
      return { ok: false, detail: `${rel} unexpectedly contains "${n}"` };
    }
  }
  return { ok: true, detail: 'ok' };
}

/**
 * @param {{ anchorFilter?: string[] | 'all' }} [opts]
 */
function runCallGraphAudit(opts = {}) {
  const filter = opts.anchorFilter;
  const selected =
    filter === 'all' || !filter
      ? ANCHORS
      : ANCHORS.filter((a) => filter.includes(a.id));

  const results = [];
  for (const a of selected) {
    let ok = true;
    let detail = '';
    for (const c of a.checks) {
      const text = read(c.file);
      if (!text) {
        ok = false;
        detail = `missing ${c.file}`;
        break;
      }
      const r = checkText(text, c, c.file);
      if (!r.ok) {
        ok = false;
        detail = r.detail;
        break;
      }
    }
    if (ok) detail = 'anchors OK';
    results.push({ id: a.id, label: a.label, status: ok ? 'PASS' : 'FAIL', detail });
  }

  const pass = results.every((r) => r.status === 'PASS');
  return { pass, results, anchors_total: results.length, anchors_fail: results.filter((r) => r.status === 'FAIL').length };
}

function writeCallGraphEvidence(outPath, audit, meta = {}) {
  const payload = {
    review_id: 'CALL-GRAPH-TRUTH',
    ...meta,
    pass: audit.pass,
    anchors_total: audit.anchors_total,
    anchors_fail: audit.anchors_fail,
    anchors: audit.results,
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

module.exports = {
  ANCHORS,
  ROOT,
  runCallGraphAudit,
  writeCallGraphEvidence,
};
