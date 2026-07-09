#!/usr/bin/env node
/** Display Data Governance runner — invoked by run-display-data-governance.sh */
const http = require('http');
const https = require('https');

const API = (process.env.API || '').replace(/\/$/, '');
const TOK = (process.env.TOK || '').trim();
const C3_ID = (process.env.C3_ID || '').trim();
const DRY_RUN = process.env.DRY_RUN === '1';
const ENV_LABEL = process.env.ENV_LABEL || 'auto';
const POST_OCS_BASELINE = process.env.POST_OCS_BASELINE !== '0';

if (!API || !TOK) {
  console.error('display-data-governance: missing API or TOK');
  process.exit(1);
}

const CANONICAL_EXACT = new Set([
  '00000000-0000-4000-8000-000000000311',
  '00000000-0000-4000-8000-000000000312',
  '00000000-0000-4000-8000-000000000313',
  '00000000-0000-4000-8000-000000000314',
]);
const PREFIXES = ['f0e0b101-'];

function isCanonicalProduction(id) {
  if (!id) return false;
  if (CANONICAL_EXACT.has(id)) return true;
  return PREFIXES.some((p) => id.startsWith(p));
}

const {
  isSmokeContent: isSmokeMarketListing,
  isNonProductionOrigin,
  isTestEmail,
} = require('./lib/smoke-data-heuristics.cjs');

function client(url) {
  return url.startsWith('https') ? https : http;
}

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + path);
    const payload = body ? JSON.stringify(body) : null;
    const lib = client(API);
    const r = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: {
          Authorization: 'Bearer ' + TOK,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      }
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function pubGet(path) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + path);
    const lib = client(API);
    lib
      .get(
        {
          hostname: u.hostname,
          port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + u.search,
        },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => resolve(JSON.parse(d)));
        }
      )
      .on('error', reject);
  });
}

(async () => {
  const report = {
    env: ENV_LABEL,
    api: API,
    c3_id: C3_ID,
    unpublish: [],
    publish: [],
    market: {},
    stats: null,
    pass: true,
  };

  const statsR = await req('GET', '/api/v1/admin/official/public-operations/stats');
  report.stats = JSON.parse(statsR.body);

  const pq = JSON.parse(
    (await req('GET', '/api/v1/admin/official/public-operations/publish-queue?entity_type=guides&limit=300')).body
  );
  const items = pq.items || [];

  for (const it of items) {
    if (it.display_status !== 'published') continue;
    const origin = it.data_origin || '';
    let drop = false;
    if (origin === 'test') {
      drop = true;
    } else if (origin === 'production') {
      drop = !isCanonicalProduction(it.id);
    } else if (origin === 'demo' || origin === 'smoke') {
      drop = true;
    }
    if (drop) report.unpublish.push({ id: it.id, origin, label: it.label });
  }

  console.log('display-data-governance: unpublish candidates:', report.unpublish.length);
  for (const row of report.unpublish) {
    if (DRY_RUN) {
      console.log('DRY unpublish', row.id, row.origin);
      continue;
    }
    const r = await req(
      'POST',
      `/api/v1/admin/official/public-operations/entities/guides/${row.id}/unpublish`,
      {}
    );
    if (r.status < 200 || r.status >= 300) {
      console.log('WARN unpublish', row.id, r.status, r.body.slice(0, 120));
    }
  }

  const pqListings = JSON.parse(
    (await req('GET', '/api/v1/admin/official/public-operations/publish-queue?entity_type=market_listings&limit=500')).body
  );
  const listingItems = pqListings.items || [];
  for (const it of listingItems) {
    if (it.display_status !== 'published') continue;
    const origin = it.data_origin || '';
    if (origin === 'demo' || origin === 'smoke' || origin === 'test' || isSmokeMarketListing(it)) {
      report.unpublish.push({ id: it.id, origin, label: it.label, entity: 'market_listings' });
    }
  }
  console.log(
    'display-data-governance: market_listings unpublish candidates:',
    report.unpublish.filter((r) => r.entity === 'market_listings').length
  );
  for (const row of report.unpublish.filter((r) => r.entity === 'market_listings')) {
    if (DRY_RUN) {
      console.log('DRY unpublish listing', row.id, row.origin);
      continue;
    }
    const r = await req(
      'POST',
      `/api/v1/admin/official/public-operations/entities/market_listings/${row.id}/unpublish`,
      {}
    );
    if (r.status < 200 || r.status >= 300) {
      console.log('WARN unpublish listing', row.id, r.status, r.body.slice(0, 120));
    }
  }

  async function sweepPublishQueue(entityType, predicate) {
    const pq = JSON.parse(
      (await req('GET', `/api/v1/admin/official/public-operations/publish-queue?entity_type=${entityType}&limit=500`)).body
    );
    const rows = (pq.items || []).filter((it) => it.display_status === 'published' && predicate(it));
    console.log(`display-data-governance: ${entityType} unpublish candidates:`, rows.length);
    for (const it of rows) {
      report.unpublish.push({ id: it.id, origin: it.data_origin, label: it.label, entity: entityType });
      if (DRY_RUN) {
        console.log('DRY unpublish', entityType, it.id);
        continue;
      }
      const r = await req(
        'POST',
        `/api/v1/admin/official/public-operations/entities/${entityType}/${it.id}/unpublish`,
        {}
      );
      if (r.status < 200 || r.status >= 300) {
        console.log('WARN unpublish', entityType, it.id, r.status, r.body.slice(0, 120));
      }
    }
  }

  await sweepPublishQueue('orders', (it) => isNonProductionOrigin(it.data_origin) || isSmokeMarketListing(it));
  await sweepPublishQueue('community_posts', (it) => isNonProductionOrigin(it.data_origin) || isSmokeMarketListing(it));

  // Discover / community public leak verification
  const disc = await pubGet('/api/v1/discover/orders?limit=100');
  const discRows = disc.items || [];
  const discBad = discRows.filter((o) => isNonProductionOrigin(o.data_origin) || isSmokeMarketListing(o));
  report.discover_public_leaks = discBad.length;
  if (discBad.length) {
    console.error('FAIL discover public leaks', discBad.length);
    report.pass = false;
  }

  const feed = await pubGet('/api/v1/community/feed?limit=100');
  const feedRows = feed.posts || feed.items || [];
  const feedBad = feedRows.filter((p) => isNonProductionOrigin(p.data_origin) || isSmokeMarketListing(p));
  report.community_public_leaks = feedBad.length;
  if (feedBad.length) {
    console.error('FAIL community feed public leaks', feedBad.length);
    report.pass = false;
  }

  const guidesPub = await pubGet('/api/v1/guides?limit=500');
  const guideItems = guidesPub.items || guidesPub.guides || [];
  if (C3_ID && guideItems.some((g) => g.id === C3_ID)) {
    console.error('FAIL TEST_DATA_LEAKAGE: C3 guide@test.com on public GET /guides');
    report.c3_public_leak = true;
    report.pass = false;
  }
  for (const g of guideItems) {
    if (isNonProductionOrigin(g.data_origin) || isTestEmail(g.owner_email || g.email)) {
      console.error('FAIL TEST_DATA_LEAKAGE: test/non-prod guide on public catalog', g.id);
      report.pass = false;
    }
  }

  if (!POST_OCS_BASELINE && C3_ID) {
    const c3Row = items.find((i) => i.id === C3_ID);
    if (!c3Row || c3Row.display_status !== 'published') {
      report.publish.push(C3_ID);
      if (!DRY_RUN) {
        const pr = await req(
          'POST',
          `/api/v1/admin/official/public-operations/entities/guides/${C3_ID}/publish`,
          {}
        );
        if (pr.status < 200 || pr.status >= 300) {
          console.error('FAIL publish C3', pr.status, pr.body);
          report.pass = false;
        } else {
          console.log('OK publish C3 guide@test.com', C3_ID);
        }
      }
    }
  } else if (!POST_OCS_BASELINE) {
    console.log('WARN: C3 guide id not resolved — skip legacy publish');
  }

  if (!POST_OCS_BASELINE) {
  const cityChecks = [
    { queries: ['Hangzhou', '杭州'], minProd: 1, maxProd: 3, needC3: true },
    { queries: ['Beijing', '北京'], minProd: 1, maxProd: 1, needC3: false },
    { queries: ['Shanghai', '上海'], minProd: 1, maxProd: 1, needC3: false },
    { queries: ['Kyoto', '京都'], minProd: 1, maxProd: 1, needC3: false },
  ];

  for (const c of cityChecks) {
    let rows = [];
    for (const q of c.queries) {
      const g = await pubGet('/api/v1/guides?city=' + encodeURIComponent(q) + '&limit=50');
      const part = g.items || g.guides || [];
      if (part.length > rows.length) rows = part;
    }
    const label = c.queries[0];
    const prod = rows.filter((x) => x.data_origin === 'production');
    const tests = rows.filter((x) => x.data_origin === 'test');
    const c3Visible = C3_ID ? rows.some((x) => x.id === C3_ID) : false;
    report.market[label] = {
      total: rows.length,
      production: prod.length,
      test: tests.length,
      c3_visible: c3Visible,
      ids: rows.map((x) => ({ id: x.id, origin: x.data_origin, bio: (x.bio || '').slice(0, 40) })),
    };
    console.log(
      'MARKET',
      label,
      'total=' + rows.length,
      'prod=' + prod.length,
      'test=' + tests.length,
      c3Visible ? 'C3=YES' : 'C3=no'
    );
    if (prod.length < c.minProd || prod.length > c.maxProd) {
      console.error('FAIL production count', label, prod.length, 'expected', c.minProd + '-' + c.maxProd);
      report.pass = false;
    }
    if (c.needC3 && C3_ID && !c3Visible) {
      console.error('FAIL C3 not visible in', label);
      report.pass = false;
    }
    const badProd = prod.filter((x) => !isCanonicalProduction(x.id));
    if (badProd.length) {
      console.error('FAIL non-canonical production in market', label, badProd.map((x) => x.id).join(','));
      report.pass = false;
    }
  }
  } else {
    console.log('POST_OCS_BASELINE: skip legacy C3 publish + canonical city matrix (SOPCP/OCS owns Public Catalog)');
  }

  const outPath = process.env.EVIDENCE_JSON;
  if (outPath) {
    require('fs').writeFileSync(outPath, JSON.stringify(report, null, 2));
  }

  if (!report.pass) process.exit(1);
  console.log('display-data-governance: PASS');
})().catch((e) => {
  console.error('display-data-governance: ERROR', e.message);
  process.exit(1);
});
