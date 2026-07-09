#!/usr/bin/env node
/** PI3 Owner Live wave ledger */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.ROOT || path.resolve(__dirname, '../..');
const STAMP = process.env.STAMP || new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
const OUT = process.env.EVIDENCE_DIR || path.join(ROOT, 'evidence/GO_phase2_testnet_20260526/phase3-production-prep', `pi3-owner-live-${STAMP}`);

function latestExec(prefix) {
  const base = path.join(ROOT, 'evidence/GO_phase2_testnet_20260526/phase3-production-prep');
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).filter((d) => d.startsWith(prefix)).sort();
  if (!dirs.length) return null;
  const p = path.join(base, dirs[dirs.length - 1], 'summary.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

const items = ['PI3-002', 'PI3-001', 'PI3-003', 'PI3-004'].map((id) => {
  const prefix = `pi3-0${id.slice(-1)}-exec-`.replace('pi3-010', 'pi3-010'); // noop
  const map = {
    'PI3-002': 'pi3-002-exec-',
    'PI3-001': 'pi3-001-exec-',
    'PI3-003': 'pi3-003-exec-',
    'PI3-004': 'pi3-004-exec-',
  };
  const s = latestExec(map[id]);
  return {
    id,
    verdict: s?.verdict || 'UNKNOWN',
    owner_live: s?.verdict?.endsWith('_GO') ? 'CLOSED' : 'OPEN',
  };
});

const ledger = {
  schema: 'traveltrust.pi3_owner_live_wave_ledger.v1',
  stamp: STAMP,
  generated_at_utc: new Date().toISOString(),
  items,
  machine_keys: {
    TT_PI3_PRODUCTION_INFRA_PREP: items.every((i) => i.verdict.endsWith('_GO')) ? 'CLOSED' : 'ACTIVE',
    TT_RELEASE_DECISION: 'NO_GO',
  },
  blockers_remaining: [
    'Brand domain if PROD_WEB_BASE uses *.fly.dev (P3-PROD-DOMAIN)',
    'Stripe Live keys if PI3-003 HOLD',
    'R-003 prod + six-domain UAT if PI3-004 HOLD',
    'PI3-005 scope · PI3-006 go-live',
  ],
};

fs.writeFileSync(path.join(OUT, 'pi3-owner-live-ledger.json'), JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify(ledger, null, 2));
