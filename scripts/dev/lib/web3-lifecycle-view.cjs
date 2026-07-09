/**
 * Web3 protocol lifecycle node view — status per step (no percentages)
 */
const { STATUS } = require('./dashboard-common.cjs');

function buildWeb3LifecycleView(ctx) {
  const cert = ctx.readCert();
  const signed = cert?.signed_count ?? 0;
  const lifecycle = ctx.readLifecycle();
  const layerB = ctx.readJson('evidence/GO_production_readiness/escrow-bilateral-layer-b/ESCROW-BILATERAL-LAYER-B-EVIDENCE-LATEST.json');
  const dom = (id) => lifecycle?.domains?.find((d) => d.id === id);

  function certStep(minSigned, blockedAfterQueue = false) {
    if (signed >= minSigned) return STATUS.PASS;
    if (signed === minSigned - 1 && blockedAfterQueue) return STATUS.BLOCKED;
    if (signed >= minSigned - 1) return STATUS.IN_PROGRESS;
    return STATUS.NOT_STARTED;
  }

  const nodes = [
    { id: 'ttg', label: 'TTG', status: signed >= 1 ? STATUS.PASS : STATUS.IN_PROGRESS },
    { id: 'mint', label: 'Mint', status: signed >= 2 ? STATUS.PASS : signed >= 1 ? STATUS.IN_PROGRESS : STATUS.NOT_STARTED },
    { id: 'primary_market', label: 'Primary Market', status: dom('DOM-TTG-GOV')?.validation_pass ? STATUS.PASS : STATUS.IN_PROGRESS },
    { id: 'holder', label: 'Holder', status: signed >= 3 ? STATUS.PASS : STATUS.IN_PROGRESS },
    { id: 'delegate', label: 'Delegate', status: certStep(4) },
    { id: 'vote', label: 'Vote', status: certStep(5) },
    { id: 'queue', label: 'Queue', status: certStep(7) },
    { id: 'execute', label: 'Execute', status: certStep(8) },
    { id: 'treasury_spend', label: 'Treasury Spend', status: signed >= 8 ? STATUS.PASS : signed >= 7 ? STATUS.BLOCKED : STATUS.IN_PROGRESS },
    { id: 'region_steward', label: 'Region Steward', status: dom('DOM-SEAT-JURISDICTION')?.validation_pass ? STATUS.PASS : STATUS.IN_PROGRESS },
    { id: 'stake', label: 'Stake', status: dom('DOM-IDENTITY-STAKE')?.validation_pass ? STATUS.PASS : STATUS.IN_PROGRESS },
    { id: 'country_pool', label: 'CountryPool', status: dom('DOM-FUND-FLOWS')?.validation_pass ? STATUS.PASS : STATUS.IN_PROGRESS },
    { id: 'profit', label: 'Profit', status: dom('DOM-FUND-FLOWS')?.validation_pass ? STATUS.PASS : STATUS.IN_PROGRESS },
    { id: 'claim', label: 'Claim', status: layerB?.verdict === 'LAYER_B_EVIDENCE_PASS' ? STATUS.IN_PROGRESS : STATUS.NOT_STARTED },
    { id: 'archive', label: 'Archive', status: signed >= 12 ? STATUS.PASS : STATUS.NOT_STARTED },
  ];

  const current = nodes.find((n) => n.status === STATUS.BLOCKED)
    || nodes.find((n) => n.status === STATUS.IN_PROGRESS)
    || nodes.find((n) => n.status === STATUS.NOT_STARTED);

  return { nodes, current_node: current?.label || 'Complete' };
}

module.exports = { buildWeb3LifecycleView };
