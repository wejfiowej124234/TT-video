-- Production-facing copy for B-072 starter proposals (i18n SSOT on frontend; DB fallback for API consumers)
UPDATE governance_mvp_proposals
SET
  title = 'Protocol params review: FeeRouter layer-1 allocation',
  body = 'Community review of FeeRouter layer-1 allocation coefficients against the published protocol-reference snapshot. On-chain execution requires Governor vote, Timelock queue, and Production GO.',
  updated_at = now()
WHERE id = '00000000-0000-4000-8000-000000000001'::uuid;

UPDATE governance_mvp_proposals
SET
  title = 'Treasury rotation: Global Treasury asset allocation',
  body = 'Review of Global Treasury asset allocation and rotation policy. Opens for community signal before on-chain Governor approval and Timelock execution.',
  updated_at = now()
WHERE id = '00000000-0000-4000-8000-000000000002'::uuid;
