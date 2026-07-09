/**
 * PER Production Preparation · shared probes + owner sign-off helpers.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '../../..');
const EVID_PREP = path.join(ROOT, 'evidence/GO_production_preparation');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || process.env.WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');

const ITEMS = {
  'p0-1': {
    latest: path.join(EVID_PREP, 'per-business-closed-loop/PER-BUSINESS-CLOSED-LOOP-P0-LATEST.json'),
    stampKey: 'stamp_utc',
    passKey: 'TT_PER_BUSINESS_CLOSED_LOOP',
    signKey: 'TT_PER_P0_1_OWNER_SIGNOFF',
    dir: 'per-business-closed-loop',
    file: 'PER-BUSINESS-CLOSED-LOOP-P0.json',
    title: 'Business Closed Loop',
  },
  'p0-2': {
    latest: path.join(EVID_PREP, 'per-recovery-verified/PER-RECOVERY-VERIFIED-P0-2-LATEST.json'),
    stampKey: 'stamp_utc',
    passKey: 'TT_PER_RECOVERY_VERIFIED',
    signKey: 'TT_PER_P0_2_OWNER_SIGNOFF',
    dir: 'per-recovery-verified',
    file: 'PER-RECOVERY-VERIFIED-P0-2.json',
    title: 'Recovery Verified',
  },
  'p0-3': {
    latest: path.join(EVID_PREP, 'per-rollback-verified/PER-ROLLBACK-VERIFIED-P0-3-LATEST.json'),
    stampKey: 'stamp_utc',
    passKey: 'TT_PER_ROLLBACK_VERIFIED',
    signKey: 'TT_PER_P0_3_OWNER_SIGNOFF',
    dir: 'per-rollback-verified',
    file: 'PER-ROLLBACK-VERIFIED-P0-3.json',
    title: 'Rollback Verified',
  },
  'p0-4': {
    latest: path.join(EVID_PREP, 'per-monitoring-verified/PER-MONITORING-VERIFIED-P0-4-LATEST.json'),
    stampKey: 'stamp_utc',
    passKey: 'TT_PER_MONITORING_VERIFIED',
    signKey: 'TT_PER_P0_4_OWNER_SIGNOFF',
    dir: 'per-monitoring-verified',
    file: 'PER-MONITORING-VERIFIED-P0-4.json',
    title: 'Monitoring Verified',
  },
  'p0-5': {
    latest: path.join(EVID_PREP, 'per-production-configuration-verified/PER-PRODUCTION-CONFIGURATION-VERIFIED-P0-5-LATEST.json'),
    stampKey: 'stamp_utc',
    passKey: 'TT_PER_PRODUCTION_CONFIGURATION_VERIFIED',
    signKey: 'TT_PER_P0_5_OWNER_SIGNOFF',
    dir: 'per-production-configuration-verified',
    file: 'PER-PRODUCTION-CONFIGURATION-VERIFIED-P0-5.json',
    title: 'Production Configuration Verified',
  },
};

function arg(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}

function request(url, opts = {}) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (url.startsWith('https') ? 443 : 80),
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: opts.headers || {},
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(d);
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode || 0, json, text: d, headers: res.headers });
        });
      },
    );
    req.on('error', (e) => resolve({ status: 0, json: null, text: String(e), headers: {} }));
    req.setTimeout(opts.timeoutMs || 20000, () => {
      req.destroy();
      resolve({ status: 0, json: null, text: 'timeout', headers: {} });
    });
    req.end();
  });
}

function check(id, title, fn) {
  return fn().then((detail) => ({
    id,
    title,
    ...detail,
    loop_result: detail.blockers?.length ? 'FAIL' : 'PASS',
  }));
}

function loadItem(itemId) {
  const meta = ITEMS[itemId];
  if (!meta || !fs.existsSync(meta.latest)) return null;
  return { meta, report: JSON.parse(fs.readFileSync(meta.latest, 'utf8')) };
}

function requirePreviousSigned(prevId) {
  const loaded = loadItem(prevId);
  if (!loaded) throw new Error(`PER ${prevId} LATEST missing`);
  if (loaded.report[loaded.meta.passKey] !== 'PASS') {
    throw new Error(`PER ${prevId} not PASS`);
  }
  if (loaded.report.owner_sign_off?.status !== 'SIGNED') {
    throw new Error(`PER ${prevId} owner sign-off not SIGNED`);
  }
  return loaded.report;
}

function writeReport(meta, stamp, report) {
  const outDir = path.join(EVID_PREP, meta.dir, stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, meta.file), JSON.stringify(report, null, 2) + '\n');
  const latest = meta.latest || path.join(EVID_PREP, meta.dir, meta.file.replace('.json', '-LATEST.json'));
  fs.writeFileSync(latest, JSON.stringify(report, null, 2) + '\n');
  return outDir;
}

function signItem(itemId, signedAt) {
  const loaded = loadItem(itemId);
  if (!loaded) {
    console.error(`PER ${itemId} LATEST missing`);
    process.exit(2);
  }
  const { meta, report } = loaded;
  if (report[meta.passKey] !== 'PASS') {
    console.error(`PER ${itemId} not PASS`);
    process.exit(1);
  }
  if ((report.summary?.fail ?? 0) !== 0) {
    console.error(`PER ${itemId} has FAIL > 0`);
    process.exit(1);
  }

  const attestation =
    `Sebastian Ward · Solo maintainer · PER ${itemId.toUpperCase()} ${meta.title} · ` +
    '② Staging · not ③ Production GO';

  report.owner_sign_off = {
    status: 'SIGNED',
    attestation,
    signed_at_utc: signedAt,
    signer: 'Sebastian Ward',
    phase: `Production Preparation · PER Item ${itemId.replace('p0-', '')}`,
  };
  report[meta.signKey] = 'SIGNED';

  const stamp = report[meta.stampKey];
  writeReport(meta, stamp, report);

  const md = `# PER ${itemId.toUpperCase()} · ${meta.title} · Owner Sign-off

**UTC signed:** ${signedAt}  
**Phase:** ② Staging · Production Preparation  
**Evidence stamp:** \`${stamp}\`

## 机读结论

| 键 | 值 |
|----|-----|
| \`${meta.passKey}\` | **PASS** |
| FAIL | **0** |
| \`${meta.signKey}\` | **SIGNED** |

## Owner attestation

${attestation}

**${meta.signKey}: SIGNED**
`;
  const outDir = path.join(EVID_PREP, meta.dir, stamp);
  fs.writeFileSync(path.join(outDir, meta.file.replace('.json', '-OWNER-SIGNOFF.md')), md);
  fs.writeFileSync(
    path.join(EVID_PREP, meta.dir, meta.file.replace('.json', '-OWNER-SIGNOFF-LATEST.md')),
    md,
  );

  console.log(`${meta.signKey}: SIGNED`);
  console.log(`signed_at_utc=${signedAt}`);
  console.log(`evidence=${outDir.replace(/\\/g, '/')}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = {
  ROOT,
  EVID_PREP,
  API,
  WEB,
  ITEMS,
  arg,
  request,
  check,
  loadItem,
  requirePreviousSigned,
  writeReport,
  signItem,
  sleep,
};
