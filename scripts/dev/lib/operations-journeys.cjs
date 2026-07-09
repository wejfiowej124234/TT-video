/**
 * Operations user journeys — UAT steps with status (no percentages)
 */
const { STATUS } = require('./dashboard-common.cjs');

function step(layerA, escrow, signed, label, predicate) {
  return { step: label, status: predicate() ? STATUS.PASS : layerA ? STATUS.IN_PROGRESS : STATUS.NOT_STARTED };
}

function buildOperationsJourneys(ctx) {
  const layerA = ctx.readJson('evidence/GO_production_readiness/escrow-bilateral-layer-a/ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.json')?.verdict === 'LAYER_A_EVIDENCE_PASS';
  const layerB = ctx.readJson('evidence/GO_production_readiness/escrow-bilateral-layer-b/ESCROW-BILATERAL-LAYER-B-EVIDENCE-LATEST.json')?.verdict === 'LAYER_B_EVIDENCE_PASS';
  const esc = ctx.readJson('evidence/GO_production_readiness/escrow-settlement-authorization/ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json')?.verdict === 'ESCROW_SETTLEMENT_MODEL_ALIGNED';

  const traveler = {
    name: 'Traveler Journey',
    steps: [
      step(layerA, esc, 0, 'Register', () => layerA),
      step(layerA, esc, 0, 'Wallet', () => layerA),
      step(layerA, esc, 0, 'Book', () => layerA),
      step(layerA, esc, 0, 'Escrow', () => layerB),
      step(layerA, esc, 0, 'Travel', () => layerA),
      step(layerA, esc, 0, 'Confirm', () => layerA),
      step(layerA, esc, 0, 'Review', () => false),
      step(layerA, esc, 0, 'Done', () => false),
    ],
  };

  const guide = {
    name: 'Guide Journey',
    steps: [
      step(layerA, esc, 0, 'Register', () => layerA),
      step(layerA, esc, 0, 'Identity', () => layerA),
      step(layerA, esc, 0, 'Stake', () => false),
      step(layerA, esc, 0, 'Accept', () => layerA),
      step(layerA, esc, 0, 'Travel', () => layerA),
      step(layerA, esc, 0, 'Settlement', () => esc),
      step(layerA, esc, 0, 'Done', () => false),
    ],
  };

  const merchant = {
    name: 'Merchant Journey',
    steps: [
      step(layerA, esc, 0, 'Register', () => layerA),
      step(layerA, esc, 0, 'Identity', () => false),
      step(layerA, esc, 0, 'Publish', () => false),
      step(layerA, esc, 0, 'Order', () => layerA),
      step(layerA, esc, 0, 'Settlement', () => esc),
    ],
  };

  return [traveler, guide, merchant];
}

module.exports = { buildOperationsJourneys };
