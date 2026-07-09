#!/usr/bin/env node
/**
 * Master Map parity — Master Map → Registry → Contracts → /meta → Evidence
 *
 *   node scripts/dev/check-web3-system-master-map-parity.cjs
 *
 * Exit 0 when parity PASS for all strict-check modules (non TARGET/DEFER).
 */
const fs = require('fs');
const path = require('path');
const {
  ROOT,
  MASTER_MAP_PATH,
  loadMasterMap,
  loadDeployRegistry,
  resolveRegistryAddress,
  findGlobMatches,
  readJsonSafe,
  probeProdMeta,
  normAddr,
  isAddress,
} = require('./lib/web3-system-master-map.cjs');

const PROD_API = (process.env.PROD_API || 'https://tt-api-prod.fly.dev').replace(/\/$/, '');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit');
const SKIP = new Set(['TARGET', 'DEFER']);

function isPendingRegistry(key, rules, contract) {
  const pending = rules.pending_registry_keys || [];
  const list = pending.map((p) => (typeof p === 'string' ? p : p.key || p.id));
  if (contract?.parity_registry === 'pending_sepolia_broadcast') return true;
  return list.includes(key);
}

function checkModule(mod, deployReg, prodMeta, rules) {
  const status = mod.readiness?.status || 'UNKNOWN';
  const strict = !SKIP.has(status);
  const row = {
    id: mod.id,
    name: mod.name,
    readiness_status: status,
    readiness_note: mod.readiness?.note || null,
    deployment_wave: mod.deployment_wave || [],
    checks: [],
    ok: true,
  };

  const add = (kind, name, ok, detail = null) => {
    row.checks.push({ kind, name, ok, detail });
    if (!ok && strict) row.ok = false;
  };

  for (const src of mod.contract_sources || []) {
    const full = path.join(ROOT, src);
    add('contract_source', src, fs.existsSync(full), fs.existsSync(full) ? 'exists' : 'missing');
  }

  for (const c of mod.contracts || []) {
    if (c.source) {
      add('contract', c.name || c.source, fs.existsSync(path.join(ROOT, c.source)), c.source);
    }
    if (strict && c.registry_key && rules.require_registry_address_when_pass) {
      if (isPendingRegistry(c.registry_key, rules, c)) {
        add('registry_address', c.registry_key, true, {
          status: 'pending_sepolia_broadcast',
          note: rules.pending_registry_note || 'V2 address after Sepolia broadcast',
        });
      } else {
        const addr = resolveRegistryAddress(deployReg, c.registry_key, c.ssot_block, c);
        add('registry_address', c.registry_key, isAddress(addr), addr || 'missing_in_registry');
      }
    }
    if (strict && c.prod_meta_key && rules.require_prod_meta_when_pass_and_key_set) {
      if (isPendingRegistry(c.prod_meta_key, rules, c)) {
        add('prod_meta', c.prod_meta_key, true, {
          status: 'pending_sepolia_broadcast',
          note: '/meta after V2 broadcast',
        });
      } else {
        const metaVal = prodMeta[c.prod_meta_key];
        add('prod_meta', c.prod_meta_key, isAddress(metaVal), metaVal || 'null_on_prod');
        const addr = resolveRegistryAddress(deployReg, c.registry_key, c.ssot_block, c);
        if (isAddress(addr) && isAddress(metaVal)) {
          add(
            'meta_registry_match',
            `${c.prod_meta_key}<->${c.registry_key}`,
            normAddr(addr) === normAddr(metaVal),
            { registry: addr, meta: metaVal },
          );
        }
      }
    }
  }

  for (const key of mod.registry_keys || []) {
    if (!strict || !rules.require_registry_address_when_pass) continue;
    if (isPendingRegistry(key, rules)) {
      add('registry_key', key, true, { status: 'pending_sepolia_broadcast' });
      continue;
    }
    const addr =
      resolveRegistryAddress(deployReg, key, 'gov_freeze_v2_clean_baseline') ||
      resolveRegistryAddress(deployReg, key, 'sepolia');
    add('registry_key', key, isAddress(addr), addr || 'missing');
  }

  for (const key of mod.prod_meta_keys || []) {
    if (!strict || !rules.require_prod_meta_when_pass_and_key_set) continue;
    if (isPendingRegistry(key, rules)) {
      add('prod_meta_key', key, true, { status: 'pending_sepolia_broadcast' });
      continue;
    }
    add('prod_meta_key', key, isAddress(prodMeta[key]), prodMeta[key] || 'null_on_prod');
  }

  for (const ev of mod.evidence || []) {
    if (!ev.path) continue;
    const root = path.join(ROOT, ev.path);
    let ok = false;
    let matches = [];
    if (ev.glob) {
      matches = findGlobMatches(root, ev.glob);
      ok = matches.length > 0;
    } else {
      ok = fs.existsSync(root);
      if (ok) matches = [ev.path];
    }
    const evidenceStrict = strict && status === 'PASS';
    const required = evidenceStrict && ev.required_for_pass && rules.require_evidence_when_pass;
    add('evidence', ev.id || ev.path, required ? ok : true, {
      required: !!required,
      found: ok,
      matches: matches.slice(0, 5),
      path: ev.path,
      glob: ev.glob || null,
    });
    if (required && ok && ev.expect_json_verdict && matches[0]) {
      const doc = readJsonSafe(path.join(ROOT, matches[0]));
      const verdict = doc?.verdict || doc?.overall_verdict;
      add('evidence_verdict', ev.id, verdict === ev.expect_json_verdict, {
        expected: ev.expect_json_verdict,
        actual: verdict || null,
      });
    }
  }

  row.check_mode = strict ? 'strict' : 'registered_only';
  if (!strict) row.ok = true;
  return row;
}

async function main() {
  const map = loadMasterMap();
  const deployReg = loadDeployRegistry();
  const rules = map.parity_rules || {};
  const prodMeta = await probeProdMeta(PROD_API);

  const moduleRows = (map.modules || []).map((m) => checkModule(m, deployReg, prodMeta, rules));
  const strictModules = moduleRows.filter((r) => r.check_mode === 'strict');
  const failed = strictModules.filter((r) => !r.ok);
  const passCount = strictModules.filter((r) => r.ok).length;

  const manifest = {
    schema: 'traveltrust.web3_system_master_map_parity.v1',
    recorded_utc: new Date().toISOString(),
    master_map: path.relative(ROOT, MASTER_MAP_PATH).replace(/\\/g, '/'),
    prod_api: PROD_API,
    summary: {
      modules_total: moduleRows.length,
      strict_modules: strictModules.length,
      registered_only: moduleRows.length - strictModules.length,
      strict_pass: passCount,
      strict_fail: failed.length,
    },
    chain: map.closure_path || [],
    verdict: failed.length === 0 ? 'WEB3_MASTER_MAP_PARITY_PASS' : 'WEB3_MASTER_MAP_PARITY_FAIL',
    failed_modules: failed.map((r) => ({ id: r.id, name: r.name, readiness: r.readiness_status })),
    modules: moduleRows,
    discipline: { business_code_modified: false, audit_only: true },
  };

  fs.mkdirSync(EVID_ROOT, { recursive: true });
  const out = path.join(EVID_ROOT, 'WEB3-MASTER-MAP-PARITY-LATEST.json');
  fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        verdict: manifest.verdict,
        strict_pass: `${passCount}/${strictModules.length}`,
        failed: manifest.failed_modules,
        evidence: path.relative(ROOT, out).replace(/\\/g, '/'),
      },
      null,
      2,
    ),
  );
  process.exit(manifest.verdict === 'WEB3_MASTER_MAP_PARITY_PASS' ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
