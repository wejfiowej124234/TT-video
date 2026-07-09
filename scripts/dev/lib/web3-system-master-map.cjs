/**
 * Load registry/web3-system-master-map.v1.yaml and resolve deployment addresses.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { request } = require('./production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../../..');
const MASTER_MAP_PATH = path.join(ROOT, 'registry/web3-system-master-map.v1.yaml');
const DEPLOY_REGISTRY_PATH = path.join(ROOT, 'registry/protocol-convergence-deployments.v1.yaml');

const EXTERNAL_ADDRESS_FALLBACK = {
  guide_staking_pool: '0x5bdACF35292bDd681103BBb50865d8D2Fd49653f',
  provider_staking_pool: '0xa90cA23767C1DdcA1Eb8AB292185e9af1106b075',
  region_vault_address: '0x2Ea061d50393c09af2f607Ee9f89679642A3a65B',
  reserve_vault_address: '0xbC541FAf26e139eF1f0AC22b52c4b4F85FFF7855',
};

const META_KEY_ALIASES = {
  treasury_p4_cap_address: 'treasury_address',
  region_steward_stake_pool_proxy_address: 'region_steward_stake_pool_address',
  guide_staking_pool: 'guide_staking_address',
  provider_staking_pool: 'staking_provider_address',
};

function runPythonYamlToJson(yamlPath) {
  const code = `
import json, yaml, sys
from pathlib import Path
p = Path(${JSON.stringify(yamlPath)})
print(json.dumps(yaml.safe_load(p.read_text(encoding='utf-8'))))
`;
  const r = spawnSync('python', ['-c', code], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`yaml_load_failed: ${(r.stderr || r.stdout || '').trim()}`);
  }
  return JSON.parse(r.stdout);
}

function loadMasterMap() {
  if (!fs.existsSync(MASTER_MAP_PATH)) {
    throw new Error(`missing master map: ${MASTER_MAP_PATH}`);
  }
  return runPythonYamlToJson(MASTER_MAP_PATH);
}

function loadDeployRegistry() {
  if (!fs.existsSync(DEPLOY_REGISTRY_PATH)) {
    throw new Error(`missing deploy registry: ${DEPLOY_REGISTRY_PATH}`);
  }
  return runPythonYamlToJson(DEPLOY_REGISTRY_PATH);
}

function normAddr(a) {
  return (a || '').toLowerCase();
}

function isAddress(v) {
  return typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v);
}

function resolveRegistryAddress(deployReg, key, ssotBlock, contract = {}) {
  if (contract.external_address && isAddress(contract.external_address)) {
    return contract.external_address;
  }
  if (ssotBlock === 'external' && EXTERNAL_ADDRESS_FALLBACK[key]) {
    return EXTERNAL_ADDRESS_FALLBACK[key];
  }
  const env = deployReg.environments || {};
  const block = ssotBlock && env[ssotBlock] ? env[ssotBlock] : null;
  if (block?.addresses?.[key] && isAddress(block.addresses[key])) {
    return block.addresses[key];
  }
  if (ssotBlock === 'sepolia' && env.sepolia?.addresses?.[key]) {
    return env.sepolia.addresses[key];
  }
  if (env.gov_freeze_v2_clean_baseline?.addresses?.[key]) {
    return env.gov_freeze_v2_clean_baseline.addresses[key];
  }
  return null;
}

function globExists(root, pattern) {
  if (!pattern) return false;
  const parts = pattern.split('/');
  const baseIdx = parts.findIndex((p) => p.includes('*') || p.includes('?'));
  if (baseIdx === -1) {
    return fs.existsSync(path.join(root, pattern));
  }
  const base = path.join(root, ...parts.slice(0, baseIdx));
  const tail = parts.slice(baseIdx).join('/');
  if (!fs.existsSync(base)) return false;
  const re = new RegExp(
    `^${tail.replace(/\./g, '\\.').replace(/\*\*/g, '§§').replace(/\*/g, '[^/]*').replace(/§§/g, '.*')}$`,
  );
  const stack = [base];
  while (stack.length) {
    const cur = stack.pop();
    const st = fs.statSync(cur);
    if (st.isFile()) {
      const rel = path.relative(base, cur).replace(/\\/g, '/');
      if (re.test(tail.startsWith('**/') ? `**/${rel}` : rel)) return true;
      continue;
    }
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      stack.push(path.join(cur, ent.name));
    }
  }
  return false;
}

function findGlobMatches(root, pattern) {
  if (!pattern || !pattern.includes('*')) {
    const p = path.join(root, pattern);
    return fs.existsSync(p) ? [path.relative(root, p).replace(/\\/g, '/')] : [];
  }
  const parts = pattern.split('/');
  const starIdx = parts.findIndex((p) => p.includes('*'));
  const base = path.join(root, ...parts.slice(0, starIdx));
  const tail = parts.slice(starIdx).join('/');
  const re = new RegExp(
    `^${tail.replace(/\./g, '\\.').replace(/\*\*/g, '§§').replace(/\*/g, '[^/]*').replace(/§§/g, '.*')}$`,
  );
  const matches = [];
  if (!fs.existsSync(base)) return matches;
  const stack = [base];
  while (stack.length) {
    const cur = stack.pop();
    const st = fs.statSync(cur);
    if (st.isFile()) {
      const rel = path.relative(base, cur).replace(/\\/g, '/');
      const candidate = tail.startsWith('**/') ? `**/${rel}` : rel;
      if (re.test(candidate)) matches.push(path.relative(root, cur).replace(/\\/g, '/'));
      continue;
    }
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      stack.push(path.join(cur, ent.name));
    }
  }
  return matches;
}

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

async function probeProdMeta(prodApi) {
  const meta = await request(`${prodApi.replace(/\/$/, '')}/meta`);
  return meta.json?.chain?.contracts || {};
}

function buildAddressIndex(deployReg) {
  const idx = {};
  for (const [envName, block] of Object.entries(deployReg.environments || {})) {
    if (!block?.addresses) continue;
    for (const [k, v] of Object.entries(block.addresses)) {
      if (isAddress(v)) idx[`${envName}.${k}`] = v;
      if (isAddress(v) && !idx[k]) idx[k] = v;
    }
  }
  for (const [k, v] of Object.entries(EXTERNAL_ADDRESS_FALLBACK)) {
    if (!idx[k]) idx[k] = v;
  }
  return idx;
}

module.exports = {
  ROOT,
  MASTER_MAP_PATH,
  DEPLOY_REGISTRY_PATH,
  META_KEY_ALIASES,
  loadMasterMap,
  loadDeployRegistry,
  resolveRegistryAddress,
  buildAddressIndex,
  globExists,
  findGlobMatches,
  readJsonSafe,
  probeProdMeta,
  normAddr,
  isAddress,
};
