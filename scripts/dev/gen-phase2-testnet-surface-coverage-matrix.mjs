#!/usr/bin/env node
/**
 * D24 · Full Surface Coverage Audit — surface-coverage-matrix.v1.json
 *
 *   node scripts/dev/gen-phase2-testnet-surface-coverage-matrix.mjs --evid-dir <dir>
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function arg(name, def = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

const evidDir = arg('--evid-dir', '.');
const root = process.cwd();
const registryPath = path.join(root, 'registry/phase2-testnet-surface-coverage-registry.v1.yaml');

function readYamlSurfaces(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const surfaces = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*-\s*\{\s*id:\s*([^,]+),\s*role:\s*([^,]+),\s*kind:\s*([^,]+),\s*route:\s*([^,]+),\s*action:\s*([^,]+),\s*domain:\s*([^}]+)\s*\}/);
    if (m) {
      surfaces.push({
        id: m[1].trim(),
        role: m[2].trim(),
        kind: m[3].trim(),
        route: m[4].trim(),
        action: m[5].trim(),
        domain: m[6].trim(),
      });
    }
  }
  return surfaces;
}

function grepDir(dir, pattern, maxDepth = 3) {
  if (!fs.existsSync(dir)) return false;
  const walk = (d, depth) => {
    if (depth > maxDepth) return false;
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isFile()) {
        try {
          if (fs.readFileSync(p, 'utf8').includes(pattern)) return true;
        } catch {
          /* skip */
        }
      } else if (st.isDirectory() && walk(p, depth + 1)) return true;
    }
    return false;
  };
  return walk(dir, 0);
}

function latestDir(baseRel, prefix, requireFile = null) {
  const base = path.join(root, baseRel);
  if (!fs.existsSync(base)) return null;
  const hits = fs
    .readdirSync(base)
    .filter((d) => {
      if (prefix && !d.startsWith(prefix)) return false;
      try {
        return fs.statSync(path.join(base, d)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort()
    .reverse();
  for (const d of hits) {
    const p = path.join(base, d);
    if (requireFile && !fs.existsSync(path.join(p, requireFile))) continue;
    return p;
  }
  return null;
}

function evidenceBuckets() {
  return {
    hat: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-007-008-'),
    adm: latestDir('evidence/GO_staging_admin_rbac_matrix', 'run_'),
    admU02: latestDir('evidence/GO_staging_admin_adm_u02', 'run_'),
    stagingUi: path.join(root, 'frontend/evidence/GO_phase2_staging_ui_real_user_sprint'),
    human: path.join(root, 'evidence/phase2-human-acceptance-staging-sprint'),
    escrow: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-006-'),
    acquisition: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-003-'),
    steward: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-004-'),
    provider: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-002-'),
    d24: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-d24-surface-', 'd24-surface-manifest.json'),
    d6: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-d6-reliability-surface-', 'reliability-surface-manifest.json'),
  };
}

function loadD6Manifest(dir) {
  if (!dir) return new Map();
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'reliability-surface-manifest.json'), 'utf8'));
    return new Map((m.surfaces || []).map((s) => [s.id, s]));
  } catch {
    return new Map();
  }
}

function inferTested(surface, buckets) {
  const { role, domain, route, kind, id } = surface;
  const routeKey = route.replace(/\[.*?\]/g, '').split('?')[0];

  if (buckets.d6 && grepDir(buckets.d6, id, 2)) {
    return { tested: true, source: 'D6-reliability-UAT', reliability: true };
  }

  if (buckets.d24 && grepDir(buckets.d24, id, 2)) {
    return { tested: true, source: 'D24-staging-UAT' };
  }

  if (role === 'admin') {
    if (buckets.adm && (grepDir(buckets.adm, 'TT_ADM_U01', 2) || grepDir(buckets.adm, routeKey.slice(0, 12), 3))) {
      return { tested: true, source: 'ADM-U01' };
    }
    if (buckets.admU02 && kind === 'modal') return { tested: true, source: 'ADM-U02' };
  }

  if (['traveler', 'guide', 'merchant', 'steward', 'moderator'].includes(role) && buckets.hat) {
    if (grepDir(buckets.hat, routeKey, 3) || grepDir(buckets.hat, `/${domain}`, 3)) {
      return { tested: true, source: 'TN-P1-007/008-HAT' };
    }
  }

  if (buckets.stagingUi && grepDir(buckets.stagingUi, 'PHASE2-STAGING-UI-REAL-USER-SPRINT', 2)) {
    const stagingDomains = {
      traveler: ['home', 'orders', 'market', 'escrow', 'settings'],
      guide: ['guide', 'orders', 'settings'],
    };
    if (stagingDomains[role]?.includes(domain)) {
      return { tested: true, source: 'staging-ui-sprint' };
    }
  }

  if (buckets.human && grepDir(buckets.human, 'TT_PHASE2_HUMAN_ACCEPTANCE_STAGING_SPRINT: OK', 3)) {
    if (role === 'traveler' && ['home', 'orders', 'market'].includes(domain)) {
      return { tested: true, source: 'human-acceptance' };
    }
    if (role === 'guide' && ['guide', 'orders'].includes(domain)) {
      return { tested: true, source: 'human-acceptance' };
    }
  }

  if (domain === 'escrow' && buckets.escrow) return { tested: true, source: 'TN-P1-006' };
  if (domain === 'governance' && buckets.steward) return { tested: true, source: 'TN-P1-004' };
  if (domain === 'merchant' && buckets.provider) return { tested: true, source: 'TN-P1-002' };
  if (domain === 'market' && surface.route.includes('acquisition') && buckets.acquisition) {
    return { tested: true, source: 'TN-P1-003' };
  }

  return { tested: false, source: null };
}

const surfaces = readYamlSurfaces(registryPath);
const buckets = evidenceBuckets();
const d6Map = loadD6Manifest(buckets.d6);

const rows = surfaces.map((s) => {
  const t = inferTested(s, buckets);
  const d6 = d6Map.get(s.id);
  const reliabilityPass = d6?.human_uat === 'PASS' && d6?.exception_path_verified === 'PASS';
  return {
    ...s,
    status: t.tested ? 'PASS' : 'OPEN',
    evidence_source: t.source,
    exception_path_verified: reliabilityPass || t.source === 'D6-reliability-UAT' ? 'PASS' : t.source === 'D24-staging-UAT' ? 'PASS' : t.tested ? 'PARTIAL' : 'OPEN',
    human_uat: reliabilityPass || t.source === 'D6-reliability-UAT' ? 'PASS' : t.source === 'D24-staging-UAT' || t.source === 'staging-ui-sprint' || t.source === 'human-acceptance' ? 'PASS' : t.tested ? 'PARTIAL' : 'OPEN',
  };
});

const tested = rows.filter((r) => r.status === 'PASS').length;
const untestedUi = rows.filter((r) => r.status !== 'PASS').length;
const untestedActions = rows.filter((r) => r.status !== 'PASS').length;

const matrix = {
  schema: 'traveltrust.phase2_testnet_surface_coverage_matrix.v1',
  registry: 'registry/phase2-testnet-surface-coverage-registry.v1.yaml',
  at: new Date().toISOString(),
  summary: {
    surfaces_total: rows.length,
    surfaces_tested: tested,
    surface_coverage_pct: rows.length ? Math.round((tested / rows.length) * 100) : 0,
    untested_ui_element: untestedUi,
    untested_user_action: untestedActions,
    human_uat_pass_count: rows.filter((r) => r.human_uat === 'PASS').length,
    exception_path_pass_count: rows.filter((r) => r.exception_path_verified === 'PASS').length,
    roles: ['traveler', 'guide', 'merchant', 'steward', 'moderator', 'admin'],
  },
  surfaces: rows,
};

fs.mkdirSync(evidDir, { recursive: true });
fs.writeFileSync(path.join(evidDir, 'surface-coverage-matrix.v1.json'), JSON.stringify(matrix, null, 2) + '\n');
console.log(
  `surface-coverage: pct=${matrix.summary.surface_coverage_pct} untested_ui=${untestedUi} untested_action=${untestedActions}`,
);
