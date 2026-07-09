/**
 * POI City Ops · backward-compat wrapper over unified CMS ops hierarchy
 */
const {
  buildCmsOpsHierarchy,
  buildPoiCityOpsFromHierarchy,
  writeHierarchyLatest,
  readHierarchyLatest,
  formatFamilyTreeConsole,
  HIERARCHY_LATEST,
} = require('./cms-ops-hierarchy.cjs');

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const CITY_OPS_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-OPS-LATEST.json');
const CITY_STATUS_ENUM = ['NOT_STARTED', 'ACTIVE', 'CLOSED'];

function buildPoiCityOps(options = {}) {
  const hierarchy =
    options.hierarchy ||
    readHierarchyLatest() ||
    buildCmsOpsHierarchy({ cms_items: options.cms_items, scope: options.scope });
  const poi = buildPoiCityOpsFromHierarchy(hierarchy);
  return poi ? { ...poi, countries: poi.countries } : null;
}

function formatCityOpsConsole(ops) {
  if (!ops) return '';
  const hierarchy = readHierarchyLatest() || { families: [] };
  const poi = hierarchy.families?.find((f) => f.id === 'poi') || { label: 'POI', countries: ops.countries, status: 'ACTIVE' };
  return formatFamilyTreeConsole(poi);
}

function writeCityOpsLatest(ops, stampUtc) {
  const out = { ...ops, stamp_utc: stampUtc || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z') };
  fs.mkdirSync(path.dirname(CITY_OPS_LATEST), { recursive: true });
  fs.writeFileSync(CITY_OPS_LATEST, JSON.stringify(out, null, 2) + '\n');
  return out;
}

function readCityOpsLatest() {
  try {
    if (!fs.existsSync(CITY_OPS_LATEST)) return null;
    return JSON.parse(fs.readFileSync(CITY_OPS_LATEST, 'utf8'));
  } catch {
    return null;
  }
}

function cityKey(countryIso, cityZh) {
  return `${countryIso}-${cityZh}`;
}

module.exports = {
  CITY_OPS_LATEST,
  CITY_STATUS_ENUM,
  buildPoiCityOps,
  formatCityOpsConsole,
  writeCityOpsLatest,
  readCityOpsLatest,
  cityKey,
  HIERARCHY_LATEST,
};
