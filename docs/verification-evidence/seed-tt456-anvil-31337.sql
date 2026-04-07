-- TT-4 / TT-5 / TT-6 live evidence seed (Postgres + Anvil 31337).
-- Guide / tourist IDs match docker-compose seed users.

BEGIN;

UPDATE guides
SET wallet_address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', updated_at = now()
WHERE id = '1600d3ec-dc44-426e-8098-b8be77765a58';

UPDATE users
SET default_wallet_address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', updated_at = now()
WHERE id = 'e9a0feb8-0b83-4f9c-ab4d-a145be92ae71';

-- TT-4: two draft orders (tourist participant) + distinct zh destinations for B-083 fee_route_country.
DELETE FROM itineraries WHERE order_id IN (
    '11111111-1111-4111-8111-111111111101'::uuid,
    '11111111-1111-4111-8111-111111111102'::uuid
);
DELETE FROM orders WHERE id IN (
    '11111111-1111-4111-8111-111111111101'::uuid,
    '11111111-1111-4111-8111-111111111102'::uuid
);

INSERT INTO orders (
    id, tourist_id, guide_id, amount, currency, status, chain_id, created_at, updated_at
) VALUES
(
    '11111111-1111-4111-8111-111111111101',
    'e9a0feb8-0b83-4f9c-ab4d-a145be92ae71',
    '1600d3ec-dc44-426e-8098-b8be77765a58',
    '100.00',
    'USD',
    'draft',
    31337,
    now(),
    now()
),
(
    '11111111-1111-4111-8111-111111111102',
    'e9a0feb8-0b83-4f9c-ab4d-a145be92ae71',
    '1600d3ec-dc44-426e-8098-b8be77765a58',
    '200.00',
    'USD',
    'draft',
    31337,
    now(),
    now()
);

INSERT INTO itineraries (
    order_id, version, destination, city, days_json, created_at, updated_at
) VALUES
(
    '11111111-1111-4111-8111-111111111101',
    1,
    '中国',
    '杭州',
    '[]'::jsonb,
    now(),
    now()
),
(
    '11111111-1111-4111-8111-111111111102',
    1,
    '日本',
    '东京',
    '[]'::jsonb,
    now(),
    now()
);

-- TT-5: projection row; on-chain `state(1)` from StubGovernor must return Pending (0) to match.
INSERT INTO governance_proposals_projection (
    chain_id,
    proposal_id,
    proposer,
    snapshot_block,
    vote_start_block,
    vote_end_block,
    title,
    for_votes,
    against_votes,
    abstain_votes,
    chain_state,
    operation_id,
    updated_at
) VALUES (
    31337,
    1,
    NULL,
    1,
    1,
    100,
    'TT-5 evidence: governor projection + eth_call state',
    0,
    0,
    0,
    'pending',
    NULL,
    now()
)
ON CONFLICT (chain_id, proposal_id) DO UPDATE SET
    snapshot_block = EXCLUDED.snapshot_block,
    vote_start_block = EXCLUDED.vote_start_block,
    vote_end_block = EXCLUDED.vote_end_block,
    title = EXCLUDED.title,
    chain_state = EXCLUDED.chain_state,
    updated_at = now();

COMMIT;
