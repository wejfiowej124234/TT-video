/**
 * Platform Capability Registry loader.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const REG_JSON = path.join(ROOT, 'registry/platform-capability-registry.v1.json');

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REG_JSON, 'utf8'));
}

function expandModulePaths(paths) {
  return [...new Set((paths || []).map((p) => p.replace(/\\/g, '/')))];
}

module.exports = {
  ROOT,
  REG_JSON,
  loadRegistry,
  expandModulePaths,
};
