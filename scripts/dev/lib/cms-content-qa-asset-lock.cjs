/**
 * Content QA Asset Lock · OPEN | LOCKED · 一张图只换一次
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const REGISTRY = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json');
const STANDARD = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-QA-STANDARD-FROZEN.v1.json');

function readRegistry() {
  try {
    if (!fs.existsSync(REGISTRY)) return { schema: 'traveltrust.cms_content_qa_asset_lock.v1', assets: {} };
    return JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  } catch {
    return { schema: 'traveltrust.cms_content_qa_asset_lock.v1', assets: {} };
  }
}

function writeRegistry(reg) {
  fs.mkdirSync(path.dirname(REGISTRY), { recursive: true });
  reg.stamp_utc = new Date().toISOString();
  reg.standard_ssot = 'evidence/GO_cms_operation/CMS-CONTENT-QA-STANDARD-FROZEN.v1.json';
  fs.writeFileSync(REGISTRY, JSON.stringify(reg, null, 2) + '\n');
}

function getAsset(matrixId) {
  const reg = readRegistry();
  return reg.assets?.[matrixId] || { matrix_id: matrixId, state: 'OPEN', replace_count: 0 };
}

function assertCanReplace(matrixId, { unlockReason = null } = {}) {
  const asset = getAsset(matrixId);
  if (asset.state === 'LOCKED' && !unlockReason) {
    throw new Error(`LOCKED: ${matrixId} · 禁止替换 · 仅真实错误可 --unlock-real-error`);
  }
  if (asset.replace_count >= 1 && !unlockReason) {
    throw new Error(`ONE_REPLACE: ${matrixId} 已 Replace 一次 · 禁止第二次替换`);
  }
  return asset;
}

function recordReplace(matrixId, { hero_file, city_zh, poi, unlockReason = null }) {
  const reg = readRegistry();
  if (!reg.assets) reg.assets = {};
  const prev = reg.assets[matrixId] || { matrix_id: matrixId, state: 'OPEN', replace_count: 0 };
  reg.assets[matrixId] = {
    ...prev,
    matrix_id: matrixId,
    city_zh,
    poi,
    state: 'OPEN',
    replace_count: unlockReason ? 1 : prev.replace_count + 1,
    hero_file,
    replaced_at_utc: new Date().toISOString(),
    unlock_reason: unlockReason || null,
  };
  writeRegistry(reg);
  return reg.assets[matrixId];
}

function lockAsset(matrixId, qaSnapshot) {
  const reg = readRegistry();
  const prev = reg.assets?.[matrixId];
  if (!prev) throw new Error(`lock without replace record: ${matrixId}`);
  reg.assets[matrixId] = {
    ...prev,
    state: 'LOCKED',
    locked_at_utc: new Date().toISOString(),
    content_qa: qaSnapshot,
    TT_CMS_CONTENT_QA_ASSET: 'LOCKED',
  };
  writeRegistry(reg);
  return reg.assets[matrixId];
}

function countLockedForCity(matrixIds) {
  let locked = 0;
  for (const id of matrixIds) {
    if (getAsset(id).state === 'LOCKED') locked += 1;
  }
  return locked;
}

function loadStandard() {
  return JSON.parse(fs.readFileSync(STANDARD, 'utf8'));
}

module.exports = {
  REGISTRY,
  STANDARD,
  readRegistry,
  writeRegistry,
  getAsset,
  assertCanReplace,
  recordReplace,
  lockAsset,
  countLockedForCity,
  loadStandard,
};
