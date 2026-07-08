#!/usr/bin/env node
/**
 * Production Operations Enablement:
 *   ① Provision Production Admin Personas (SuperAdmin / Ops / Risk + ADM-U01 six-role matrix)
 *   ② ADM-U01 Production RBAC acceptance
 *   ③ CMS / ops publish closed loop (announcement · homepage video · campaign → consumer sync)
 *   ④ Production Operations GO evidence
 *
 * Usage:
 *   node scripts/dev/run-production-operations-enablement.cjs
 *
 * Requires scripts/dev/.env.production.local with DATABASE_URL (Fly prod Postgres).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.join(__dirname, '../..');
const PROD_API = (process.env.PROD_API || 'https://tt-api-prod.fly.dev').replace(/\/$/, '');
const PROD_WEB = (process.env.PROD_WEB || 'https://tt-web-prod.fly.dev').replace(/\/$/, '');
const STAMP = process.env.ENABLEMENT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_operations_enablement');
const EVID_DIR = path.join(EVID_ROOT, STAMP);
const ADM_PASS = process.env.ADM_U01_PASSWORD || 'Test123!';
const OCS_PASS = process.env.TT_OCS_ACCOUNT_PASSWORD || 'OcsBaseline2026!';

const PROD_PG_PROXY_PORT = process.env.PROD_PG_PROXY_PORT || process.env.FLY_PROD_MPG_PROXY_PORT || '15433';
const PROD_PG_APP = process.env.FLY_PROD_PG_APP || 'tt-traveltrust-prod';
const PROD_MPG_CLUSTER_ID = process.env.FLY_PROD_MPG_CLUSTER_ID || 'q49ypo4e98pr17ln';
let prodPgProxy = null;

function loadProdEnv() {
  const envPath = path.join(ROOT, 'scripts/dev/.env.production.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('missing scripts/dev/.env.production.local (DATABASE_URL required)');
  }
  const out = {};
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (line.startsWith('#') || !line.includes('=')) continue;
    const k = line.slice(0, line.indexOf('=')).trim();
    let v = line.slice(line.indexOf('=') + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  if (!out.DATABASE_URL) throw new Error('DATABASE_URL not found in .env.production.local');
  return out;
}

function proxyDsn(dsn, port) {
  const u = new URL(dsn);
  u.hostname = '127.0.0.1';
  u.port = String(port);
  u.searchParams.delete('sslmode');
  return u.toString();
}

async function pgQuery(dsn, sql) {
  const { Client } = require(path.join(ROOT, 'frontend/node_modules/pg'));
  const client = new Client({ connectionString: dsn, connectionTimeoutMillis: 12000 });
  await client.connect();
  try {
    const r = await client.query(sql);
    return r;
  } finally {
    await client.end();
  }
}

async function pgScalar(dsn, sql) {
  const r = await pgQuery(dsn, sql);
  if (r.rows.length === 0) return '';
  const row = r.rows[0];
  const val = row[Object.keys(row)[0]];
  return val == null ? '' : String(val);
}

async function prepareProdDatabaseUrl() {
  const env = loadProdEnv();
  const raw = env.DATABASE_URL;
  const mpgCluster = env.FLY_PROD_MPG_CLUSTER_ID || PROD_MPG_CLUSTER_ID;
  const isMpg = raw.includes('flympg.net');
  if (!isMpg && !raw.includes('flycast') && !raw.includes('.internal')) {
    return raw;
  }
  const proxied = proxyDsn(raw, PROD_PG_PROXY_PORT);
  try {
    await pgScalar(proxied, 'SELECT 1');
    console.log(`prod pg: reuse fly mpg proxy 127.0.0.1:${PROD_PG_PROXY_PORT}`);
    return proxied;
  } catch {
    /* start proxy */
  }
  console.log(`prod pg: fly mpg proxy ${mpgCluster} -p ${PROD_PG_PROXY_PORT} …`);
  prodPgProxy = spawn('fly', ['mpg', 'proxy', mpgCluster, '-p', PROD_PG_PROXY_PORT], {
    stdio: 'ignore',
    detached: false,
  });
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      await pgScalar(proxied, 'SELECT 1');
      console.log(`prod pg: mpg proxy ready on 127.0.0.1:${PROD_PG_PROXY_PORT}`);
      return proxied;
    } catch {
      /* retry */
    }
  }
  throw new Error(`fly mpg proxy probe failed on 127.0.0.1:${PROD_PG_PROXY_PORT}`);
}

function cleanupProdProxy() {
  if (prodPgProxy && !prodPgProxy.killed) {
    prodPgProxy.kill();
    prodPgProxy = null;
  }
}
process.on('exit', cleanupProdProxy);
process.on('SIGINT', () => {
  cleanupProdProxy();
  process.exit(130);
});

function record(checks, id, label, status, detail, extra = {}) {
  checks.push({ id, label, status, detail, ...extra });
}

async function probeWeb(route) {
  try {
    const res = await fetch(`${PROD_WEB}${route}`, { redirect: 'manual' });
    return { status: res.status, ok: [200, 307, 308].includes(res.status) };
  } catch (e) {
    return { status: 0, ok: false, error: String(e.message || e) };
  }
}

async function runAdmU01(dsn) {
  const reuse = process.env.ADM_U01_EVIDENCE_REUSE || '';
  if (process.env.SKIP_ADM_U01 === '1' && reuse) {
    const admDir = path.join(EVID_ROOT, reuse);
    const reportPath = path.join(admDir, 'report.json');
    if (!fs.existsSync(reportPath)) throw new Error(`ADM_U01_EVIDENCE_REUSE missing ${reportPath}`);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const ok = report.release_gate === 'GO';
    return { ok, out: 'SKIP_ADM_U01=1 reuse', report, admDir };
  }
  const admDir = path.join(EVID_DIR, 'adm-u01');
  const env = {
    ...process.env,
    STAGING_API_BASE: PROD_API,
    STAGING_DATABASE_URL: dsn,
    ADM_U01_EMAIL_DOMAIN: '@traveltrust.prod',
    ADM_U01_STRICT: '1',
    ADM_U01_EVIDENCE_DIR: admDir,
    ADM_U01_PASSWORD: ADM_PASS,
    ADM_U01_REGISTRY: path.join(ROOT, 'registry/admin-rbac-production-probes.v1.yaml'),
    ADM_U01_PROBE_HTTP_RETRIES: '8',
    ADM_U01_PROBE_DELAY: '0.25',
  };
  const py = spawnSync('python', [path.join(ROOT, 'scripts/gates/run-admin-rbac-staging-matrix.py')], {
    cwd: ROOT,
    encoding: 'utf8',
    env,
  });
  const out = `${py.stdout || ''}${py.stderr || ''}`;
  const ok = py.status === 0 && /TT_ADMIN_RBAC_STAGING_MATRIX: OK/.test(out);
  let report = null;
  const reportPath = path.join(admDir, 'report.json');
  if (fs.existsSync(reportPath)) {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    report.environment = {
      ...(report.environment || {}),
      name: 'production',
      api_base: PROD_API,
      enablement_stamp: STAMP,
    };
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  return { ok, out: out.slice(-1200), report, admDir };
}

async function resolvePersonaEmails(dsn) {
  const r = await pgQuery(
    dsn,
    `SELECT acr.console_role, u.email
     FROM admin_console_roles acr
     JOIN users u ON u.id = acr.user_id
     WHERE u.email LIKE 'adm-u01-%@traveltrust.prod'
     ORDER BY acr.updated_at DESC NULLS LAST, u.created_at DESC
     LIMIT 20`,
  );
  const map = {};
  for (const row of r.rows) {
    if (row.console_role && row.email && !map[row.console_role]) map[row.console_role] = row.email;
  }
  return map;
}

async function loginPersona(email) {
  const client = createClient(PROD_API);
  const r = await client.req('POST', '/auth/login', { email, password: ADM_PASS });
  if (!r.json?.token) {
    throw new Error(`login failed ${email} HTTP ${r.status} ${JSON.stringify(r.json?.error || r.json).slice(0, 120)}`);
  }
  return { token: r.json.token, role: r.json.role, client };
}

async function ensureCountry(client, tok, iso, nameZh, nameEn, sort) {
  const list = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  let row = (list.json?.items || []).find((x) => x.iso3166 === iso);
  if (!row) {
    const created = await client.req(
      'POST',
      '/api/v1/admin/content/countries',
      {
        iso3166: iso,
        name_zh: nameZh,
        name_en: nameEn,
        sort_order: sort,
        open_status: 'open',
        payload: {},
      },
      tok,
    );
    if (created.status !== 200) throw new Error(`country create ${iso} ${created.status}`);
    row = created.json.item;
  }
  return row;
}

async function publishLandingAmbient(client, tok, checks) {
  const iso = 'TH';
  const imageUrl = `${PROD_API}/api/v1/uploads/community-posts/ocs-bangkok-temple-community-media.jpg`;
  let countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  let country = await ensureCountry(client, tok, iso, '泰国', 'Thailand', 3);

  const mediaList = await client.req(
    'GET',
    `/api/v1/admin/content/media-assets?asset_kind=landing_ambient&country_id=${country.id}`,
    null,
    tok,
  );
  let asset = (mediaList.json?.items || []).find((x) => x.country_id === country.id);
  if (!asset) {
    const created = await client.req(
      'POST',
      '/api/v1/admin/content/media-assets',
      {
        asset_kind: 'landing_ambient',
        source_type: 'upload',
        url: imageUrl,
        license: { holder: 'TravelTrust Production Ops', usage: 'prod_ops_enablement_landing_ambient' },
        alt_text_zh: '泰国·Destination Ambient',
        alt_text_en: 'Thailand Destination Ambient',
        country_id: country.id,
        payload: { matrix_id: 'PROD-OPS-DA-TH-HOME', enablement_stamp: STAMP },
      },
      tok,
    );
    if (created.status !== 200) throw new Error(`media asset create ${created.status}`);
    asset = created.json.item;
  }

  if (asset.publish_status === 'draft') {
    await client.req('POST', `/api/v1/admin/content/media-assets/${asset.id}/submit-review`, { version: asset.version }, tok);
    asset = (await client.req('GET', `/api/v1/admin/content/media-assets/${asset.id}`, null, tok)).json.item;
  }
  if (asset.publish_status === 'in_review') {
    await client.req('POST', `/api/v1/admin/content/media-assets/${asset.id}/publish`, { version: asset.version }, tok);
    asset = (await client.req('GET', `/api/v1/admin/content/media-assets/${asset.id}`, null, tok)).json.item;
  }

  countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  country = (countries.json?.items || []).find((x) => x.iso3166 === iso);
  const patch = await client.req(
    'PATCH',
    `/api/v1/admin/content/countries/${country.id}/landing-ambient`,
    { version: country.version, landing_ambient: { image_url: imageUrl, image_asset_id: asset.id } },
    tok,
  );
  let ok = patch.status === 200;
  if (ok) {
    countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
    country = (countries.json?.items || []).find((x) => x.iso3166 === iso);
    if (country.publish_status === 'draft') {
      await client.req('POST', `/api/v1/admin/content/countries/${country.id}/submit-review`, { version: country.version }, tok);
      countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
      country = (countries.json?.items || []).find((x) => x.iso3166 === iso);
    }
    if (country.publish_status === 'in_review') {
      await client.req('POST', `/api/v1/admin/content/countries/${country.id}/publish`, { version: country.version }, tok);
    }
    const cat = await client.req('GET', `/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=${iso}`);
    ok = cat.status === 200 && (cat.json?.count || 0) >= 1;
  }
  record(
    checks,
    'cms_landing_ambient',
    'Homepage video / landing ambient (TH)',
    ok ? 'PASS' : 'FAIL',
    ok ? `country=${country.id} asset=${asset.id}` : `HTTP ${patch.status}`,
  );
  return { country, asset, ok };
}

async function publishCampaignLoop(client, tok, checks) {
  const slug = `prod-ops-${STAMP.toLowerCase()}`;
  const email = `${slug}@traveltrust.prod`;
  let accountId;
  const accounts = await client.listOfficialAccounts(tok);
  const existing = (accounts.json?.items || []).find((a) => (a.user_email || '').toLowerCase() === email);
  if (existing) {
    accountId = existing.id;
  } else {
    const acct = await client.createOfficialAccount(tok, {
      email,
      password: OCS_PASS,
      account_kind: 'community_author',
      display_label: 'Production Ops Enablement',
      nickname: 'ProdOps',
      data_origin: 'production',
    });
    if (acct.status !== 200 || !acct.json?.item?.id) {
      throw new Error(`official account ${acct.status} ${JSON.stringify(acct.json).slice(0, 160)}`);
    }
    accountId = acct.json.item.id;
    await client.submitOfficialAccountReview(tok, accountId);
    await client.publishOfficialAccount(tok, accountId);
  }

  const guideTitle = `Production Ops Announcement · ${STAMP}`;
  const guideBody =
    'TravelTrust Production Operations Enablement — homepage announcement validated on production.';
  const guideRes = await client.createOfficialGuide(tok, {
    author_account_id: accountId,
    title: guideTitle,
    body: guideBody,
    destination: 'Bangkok, Thailand',
    tags: ['production', 'ops-enablement'],
    cover_url: `${PROD_API}/api/v1/uploads/community-posts/ocs-bangkok-temple-community-media.jpg`,
    featured: true,
  });
  if (guideRes.status !== 200 || !guideRes.json?.item?.id) {
    throw new Error(`official guide ${guideRes.status}`);
  }
  const guideId = guideRes.json.item.id;
  await client.submitOfficialGuideReview(tok, guideId);
  const pubGuide = await client.publishOfficialGuide(tok, guideId);
  if (pubGuide.status !== 200) throw new Error(`publish guide ${pubGuide.status}`);

  const camp = await client.createCampaign(tok, {
    name: `Prod Ops Homepage Announcement · ${STAMP}`,
    campaign_kind: 'homepage',
    surfaces: ['home_hero'],
  });
  if (camp.status !== 200 || !camp.json?.item?.id) {
    throw new Error(`create campaign ${camp.status} ${JSON.stringify(camp.json).slice(0, 160)}`);
  }
  const campaignId = camp.json.item.id;
  const item = await client.addCampaignItem(tok, campaignId, {
    item_type: 'guide_post',
    item_ref_id: guideId,
    sort_order: 0,
    payload: { enablement_stamp: STAMP, kind: 'announcement' },
  });
  if (item.status !== 200) throw new Error(`campaign item ${item.status}`);
  await client.submitCampaignReview(tok, campaignId);
  const dep = await client.deployCampaign(tok, campaignId);
  const deployOk = dep.status === 200;
  record(
    checks,
    'cms_campaign_deploy',
    'Homepage announcement campaign deploy',
    deployOk ? 'PASS' : 'FAIL',
    deployOk ? `campaign=${campaignId} guide=${guideId}` : `HTTP ${dep.status} ${JSON.stringify(dep.json?.error || '').slice(0, 80)}`,
    { campaign_id: campaignId, guide_id: guideId },
  );

  return { campaignId, guideId, deployOk };
}

async function verifyConsumerSync(client, checks, campaignId) {
  const surfaces = [
    ['home_hero', '/api/v1/official/cold-start/surfaces/home_hero', '/'],
    ['market_feed', '/api/v1/official/cold-start/surfaces/market_feed', '/market'],
    ['community_feed', '/api/v1/official/cold-start/surfaces/community_feed', '/community'],
  ];
  let allOk = true;
  for (const [id, route, webRoute] of surfaces) {
    const r = await client.req('GET', route);
    const hasCampaign = r.status === 200 && r.json?.status === 'ok';
    const campaignPresent = hasCampaign && r.json?.campaign != null;
    const web = await probeWeb(webRoute);
    const ok = hasCampaign && web.ok && (id !== 'home_hero' || campaignPresent);
    if (!ok) allOk = false;
    record(
      checks,
      `consumer_${id}`,
      `Consumer sync · ${route} → ${webRoute}`,
      ok ? 'PASS' : 'FAIL',
      ok
        ? `api campaign=${campaignPresent ? 'present' : 'null'} web=${web.status}`
        : `api=${r.status} campaign=${campaignPresent} web=${web.status}`,
      { api_route: route, web_route: webRoute, expected_campaign_id: id === 'home_hero' ? campaignId : undefined },
    );
  }
  return allOk;
}

async function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  const checks = [];
  const dsn = await prepareProdDatabaseUrl();

  console.log(`\n== Production Operations Enablement · ${STAMP} ==\n`);
  console.log(`api=${PROD_API} web=${PROD_WEB}\n`);

  console.log('① ADM-U01 · provision personas + production RBAC matrix…');
  const adm = await runAdmU01(dsn);
  record(
    checks,
    'adm_u01_matrix',
    'ADM-U01 Production RBAC matrix',
    adm.ok ? 'PASS' : 'FAIL',
    adm.ok
      ? `pass=${adm.report?.summary?.pass}/${adm.report?.summary?.total} gate=${adm.report?.release_gate}`
      : adm.out.slice(-400),
  );
  if (!adm.ok) {
    console.error(adm.out);
    throw new Error('ADM-U01 production matrix FAIL');
  }

  const personaMap = await resolvePersonaEmails(dsn);
  const superEmail = personaMap.SuperAdmin;
  if (!superEmail) throw new Error('SuperAdmin persona not found in production DB after ADM-U01');
  const { token: superTok, client } = await loginPersona(superEmail);

  const personas = {
    SuperAdmin: { email: personaMap.SuperAdmin, console_role: 'SuperAdmin' },
    Ops: { email: personaMap.Ops, console_role: 'Ops' },
    Risk: { email: personaMap.Risk, console_role: 'Risk' },
  };
  for (const [role, spec] of Object.entries(personas)) {
    try {
      const lg = await loginPersona(spec.email);
      record(checks, `persona_${role.toLowerCase()}`, `Production Admin Persona · ${role}`, 'PASS', `email=${spec.email}`, {
        console_role: spec.console_role,
        login_role: lg.role,
      });
    } catch (e) {
      record(checks, `persona_${role.toLowerCase()}`, `Production Admin Persona · ${role}`, 'FAIL', String(e.message));
    }
  }

  await publishLandingAmbient(client, superTok, checks);
  const camp = await publishCampaignLoop(client, superTok, checks);
  const syncOk = await verifyConsumerSync(client, checks, camp.campaignId);

  const fails = checks.filter((c) => c.status === 'FAIL');
  const admGo = adm.ok;
  const cmsGo = !checks.some((c) => c.id.startsWith('cms_') && c.status === 'FAIL');
  const syncPass = syncOk;
  const verdict = admGo && cmsGo && syncPass && fails.length === 0 ? 'GO' : 'NO_GO';

  const meta = await client.req('GET', '/meta');
  const report = {
    schema: 'traveltrust.production_operations_enablement.v1',
    stamp: STAMP,
    recorded_at_utc: new Date().toISOString(),
    environment: { api: PROD_API, web: PROD_WEB, git_sha: meta.json?.build?.git_sha },
    personas: {
      primary: ['SuperAdmin', 'Ops', 'Risk'],
      credentials: {
        password_policy: 'ADM_U01_PASSWORD (default Test123!)',
        entries: personas,
      },
      adm_u01_full_matrix: 'six roles via ADM-U01 auto-provision',
    },
    phases: {
      adm_u01: { verdict: admGo ? 'GO' : 'NO_GO', evidence_dir: path.relative(ROOT, adm.admDir) },
      cms_publish_loop: { verdict: cmsGo ? 'GO' : 'NO_GO' },
      consumer_sync: { verdict: syncPass ? 'GO' : 'NO_GO' },
    },
    checks,
    resources: {
      campaign_id: camp.campaignId,
      guide_id: camp.guideId,
      super_admin_email: superEmail,
    },
    machine_keys: {
      TT_PRODUCTION_OPERATIONS_ENABLEMENT: verdict,
      TT_PRODUCTION_OPERATIONS_GO: verdict,
      TT_ADMIN_RBAC_PRODUCTION_MATRIX: admGo ? 'OK' : 'FAIL',
      TT_PRODUCTION_INDEPENDENT_OPS: verdict === 'GO' ? 'READY' : 'NOT_READY',
    },
    summary: {
      total_checks: checks.length,
      pass: checks.filter((c) => c.status === 'PASS').length,
      fail: fails.length,
    },
  };

  const md = `# Production Operations Enablement · GO Evidence

**Stamp:** ${STAMP}  
**Verdict:** ${verdict}

## Executive
- **ADM-U01 Production RBAC:** ${admGo ? 'GO' : 'NO_GO'} (${adm.report?.summary?.pass}/${adm.report?.summary?.total} probes)
- **CMS publish loop:** ${cmsGo ? 'GO' : 'NO_GO'} (landing ambient + homepage campaign deploy)
- **Consumer sync:** ${syncPass ? 'GO' : 'NO_GO'}
- **Prod SHA:** ${meta.json?.build?.git_sha || 'unknown'}

## Production Admin Personas
| Role | Email |
|------|-------|
| SuperAdmin | ${personas.SuperAdmin.email} |
| Ops | ${personas.Ops.email} |
| Risk | ${personas.Risk.email} |

Password: \`ADM_U01_PASSWORD\` (default \`Test123!\`)

## Checks
${checks.map((c) => `- **${c.id}** [${c.status}]: ${c.label} — ${c.detail}`).join('\n')}

## Machine keys
- \`TT_PRODUCTION_OPERATIONS_GO\`: **${verdict}**
- \`TT_PRODUCTION_INDEPENDENT_OPS\`: **${report.machine_keys.TT_PRODUCTION_INDEPENDENT_OPS}**
`;

  fs.writeFileSync(path.join(EVID_DIR, 'PRODUCTION-OPERATIONS-ENABLEMENT.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(EVID_DIR, 'PRODUCTION-OPERATIONS-ENABLEMENT.md'), md);
  fs.writeFileSync(path.join(EVID_ROOT, 'PRODUCTION-OPERATIONS-GO-LATEST.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(EVID_ROOT, 'PRODUCTION-OPERATIONS-GO-LATEST.md'), md);

  console.log('\n--- Summary ---');
  for (const c of checks) console.log(`[${c.status}] ${c.id}: ${c.detail}`);
  console.log(`\nTT_PRODUCTION_OPERATIONS_GO: ${verdict}`);
  console.log(`Evidence: ${EVID_DIR}\n`);
  if (verdict !== 'GO') process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
