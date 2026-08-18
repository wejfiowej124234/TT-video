'use strict';

/**
 * Official Mainnet Reality lens (FTB_MAINNET_LENS).
 *
 * When enabled, audit/gate tooling must read living Official Mainnet truth from
 * TT-FINAL-TRUTH-BASELINE-LATEST.json — not Candidate/Sepolia defaults.
 *
 * Hard honesty:
 *   RUNTIME_VERIFIED ≠ OWNER_VALIDATED ≠ CLOSED ≠ Production GO
 *   TT_PRODUCTION_GO remains NO_GO under this lens.
 *
 * Enable: FTB_MAINNET_LENS=1 (or true / yes / on)
 */

const fs = require('fs');
const path = require('path');

const FTB_REL = 'docs/runbook/TT-FINAL-TRUTH-BASELINE-LATEST.json';

function isLensEnabled(env = process.env) {
  const v = String(env.FTB_MAINNET_LENS || '')
    .trim()
    .toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function loadFtb(root, opts = {}) {
  const ftbPath = path.join(root, FTB_REL);
  if (!fs.existsSync(ftbPath)) {
    if (opts.required) {
      throw new Error(`FTB missing: ${FTB_REL}`);
    }
    return null;
  }
  return JSON.parse(fs.readFileSync(ftbPath, 'utf8'));
}

function normalizeAddr(a) {
  const s = String(a || '').trim();
  return s ? s.toLowerCase() : '';
}

/**
 * @returns {null | {
 *   enabled: true,
 *   ftb_path: string,
 *   status: string,
 *   tt_production_go: string,
 *   chain_id: number|string,
 *   money_path: string,
 *   api_base: string,
 *   web_base: string,
 *   addresses: Record<string,string>,
 *   address_lc: Record<string,string>,
 *   honesty: object,
 *   annotation_stale_tooling: string,
 * }}
 */
function getMainnetLens(root, env = process.env) {
  if (!isLensEnabled(env)) return null;
  const ftb = loadFtb(root, { required: true });
  const web3 = ftb.web3 || {};
  const pr = ftb.product_runtime || {};
  const addresses = { ...(web3.addresses || {}) };
  const address_lc = {};
  for (const [k, v] of Object.entries(addresses)) {
    address_lc[k] = normalizeAddr(v);
  }
  return {
    enabled: true,
    ftb_path: FTB_REL,
    status: ftb.status || '',
    tt_production_go: String(ftb.tt_production_go || 'NO_GO'),
    chain_id: web3.chain_id != null ? web3.chain_id : 1,
    money_path: String(web3.money_path || ''),
    api_base: String(pr.api_base || 'https://api.web3-ttg.com').replace(/\/$/, ''),
    web_base: String(pr.web_base || 'https://www.web3-ttg.com').replace(/\/$/, ''),
    addresses,
    address_lc,
    honesty: {
      RUNTIME_VERIFIED: true,
      OWNER_VALIDATED: false,
      CLOSED: false,
      Production_GO: false,
      note: 'RUNTIME_VERIFIED ≠ OWNER_VALIDATED ≠ CLOSED ≠ Production GO',
    },
    annotation_stale_tooling:
      'STALE_TOOLING — Candidate/Sepolia FAIL must not be read as Track1 money-path FAIL under Official Mainnet Reality (FTB)',
  };
}

function classifyFinding(lens, finding = {}) {
  if (!lens) return { ...finding, classification: finding.classification || 'DEFAULT' };
  const id = String(finding.id || '');
  const title = String(finding.title || finding.detail || finding.note || '');
  const domain = String(finding.domain || '');
  const fix = String(finding.fix || '');
  const blob = `${id} ${title} ${domain} ${fix}`.toLowerCase();
  const sepoliaScoped =
    /sepolia|11155111|candidate|fg-15|psg-rel-20260720|demoed_testnet|demoted_testnet/.test(blob);
  const undeployedAssumption =
    /not_started|not selected|no mainnet|undeployed|gap-99-07|gap-99-01|r-01|third-party contract audit|owner_input.*all|mainnet cutover unauthorized|env matrix not populated|deployment env matrix|shadow launch|shadow_launch|mainnet-address-registry\.v2|registry\.v2\.yaml|lineage_only|lineage factory|governancestack mainnet broadcast|fundstack under timelock/.test(
      blob,
    );
  const lineageNotOfficial =
    /escrow_factory_v2(?!_wired)|escrowfactoryv2(?!wired)|gap-escrow-v2-002|production factory env \+ ui default path pending/.test(
      blob,
    );
  if (sepoliaScoped || undeployedAssumption || lineageNotOfficial) {
    return {
      ...finding,
      classification: 'STALE_TOOLING',
      blocks_track1_finalize: false,
      blocks_production_go: Boolean(finding.blocks_production_go),
      annotation: lens.annotation_stale_tooling,
    };
  }
  return {
    ...finding,
    classification: finding.classification || 'PRE_GO_OR_REAL',
    blocks_track1_finalize: Boolean(finding.blocks_track1_finalize),
  };
}

module.exports = {
  FTB_REL,
  isLensEnabled,
  loadFtb,
  getMainnetLens,
  classifyFinding,
  normalizeAddr,
};
