#!/usr/bin/env node
/**
 * TN-P1-010 graduation gate: post-soak report @ freeze SHA (historical-only ≠ PASS).
 * Usage: node scripts/dev/lib/tn-p1-010-graduation-gate.mjs [--root PATH] [--freeze-sha SHA] [--soak-dir PATH]
 * Exit 0 + JSON stdout when pass; exit 1 when fail.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function arg(name, def = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

const root = path.resolve(arg('--root', process.cwd()));
const soakDir = path.resolve(
  arg('--soak-dir', path.join(root, 'evidence/P2FC_SOAK_72H_STAGING')),
);
let freezeSha = arg('--freeze-sha', '').toLowerCase();
if (!freezeSha) {
  const active = path.join(root, 'evidence/TESTNET_STAGING_FREEZE/ACTIVE.json');
  try {
    freezeSha = String(JSON.parse(fs.readFileSync(active, 'utf8')).git_sha || '').toLowerCase();
  } catch {
    freezeSha = '8dcd304afae1bafe5a4de738175e171256a9501e';
  }
}

function stampToMs(stamp) {
  if (!stamp) return 0;
  if (/^\d{8}T\d{6}Z$/.test(stamp)) {
    const iso = `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(9, 11)}:${stamp.slice(11, 13)}:${stamp.slice(13, 15)}Z`;
    return Date.parse(iso) || 0;
  }
  return Date.parse(stamp) || 0;
}

export function evalTnP010GraduationGate(opts = {}) {
  const r = path.resolve(opts.root || process.cwd());
  const sd = path.resolve(opts.soakDir || path.join(r, 'evidence/P2FC_SOAK_72H_STAGING'));
  let fsha = (opts.freezeSha || '').toLowerCase();
  if (!fsha) {
    try {
      fsha = String(
        JSON.parse(fs.readFileSync(path.join(r, 'evidence/TESTNET_STAGING_FREEZE/ACTIVE.json'), 'utf8')).git_sha || '',
      ).toLowerCase();
    } catch {
      fsha = '8dcd304afae1bafe5a4de738175e171256a9501e';
    }
  }
  const out = { pass: false, state: 'no', note: 'no post-soak reconcile at freeze SHA', freeze_sha: fsha };
  const soakCompleted = path.join(sd, 'COMPLETED.json');
  if (!fs.existsSync(soakCompleted)) {
    out.note = 'soak COMPLETED.json missing';
    return out;
  }
  let soak;
  try {
    soak = JSON.parse(fs.readFileSync(soakCompleted, 'utf8'));
  } catch {
    out.note = 'soak COMPLETED.json unreadable';
    return out;
  }
  const soakMs = Date.parse(soak.completed_at || '') || 0;
  if (!soakMs) {
    out.note = 'soak COMPLETED.json missing completed_at';
    return out;
  }
  const base = path.join(r, 'evidence/GO_phase2_testnet_perfect_validation');
  let best = null;
  if (fs.existsSync(base)) {
    for (const ent of fs.readdirSync(base, { withFileTypes: true })) {
      if (!ent.isDirectory() || !ent.name.startsWith('tn-p1-010-indexer-reconcile-')) continue;
      const reportPath = path.join(base, ent.name, 'report.json');
      if (!fs.existsSync(reportPath)) continue;
      let rep;
      try {
        rep = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      } catch {
        continue;
      }
      if (rep.release_gate !== 'GO') continue;
      const stamp = rep.stamp || ent.name.replace(/^tn-p1-010-indexer-reconcile-/, '');
      const stampMs = stampToMs(stamp);
      if (!stampMs || stampMs < soakMs) continue;
      const sha = String(rep.freeze_git_sha || rep.git_sha || '').toLowerCase();
      if (!sha || sha !== fsha) continue;
      if (!best || stampMs > best.stampMs) {
        best = { dir: ent.name, stampMs, stamp, sha };
      }
    }
  }
  if (best) {
    out.pass = true;
    out.state = 'yes';
    out.note = `${best.dir} stamp=${best.stamp} after_soak=1 freeze_sha=${best.sha}`;
    out.report_dir = best.dir;
  } else {
    out.note = `need post-soak TN-P1-010 @ freeze ${fsha.slice(0, 8)} (historical-only reports excluded)`;
  }
  return out;
}

const result = evalTnP010GraduationGate({ root, soakDir, freezeSha });
console.log(JSON.stringify(result));
if (process.argv.includes('--status-only')) {
  process.exit(0);
}
process.exit(result.pass ? 0 : 1);
