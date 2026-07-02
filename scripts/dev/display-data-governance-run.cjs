#!/usr/bin/env node
/** Display Data Governance runner — invoked by run-display-data-governance.sh */
const http = require('http');
const https = require('https');

const API = (process.env.API || '').replace(/\/$/, '');
const TOK = (process.env.TOK || '').trim();
const C3_ID = (process.env.C3_ID || '').trim();
const DRY_RUN = process.env.DRY_RUN === '1';
const ENV_LABEL = process.env.ENV_LABEL || 'auto';

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
      drop = !(C3_ID && it.id === C3_ID);
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

  if (C3_ID) {
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
  } else {
    console.log('WARN: C3 guide id not resolved — skip publish');
  }

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
