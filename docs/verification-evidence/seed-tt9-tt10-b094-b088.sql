-- TT-9 (B-094) + TT-10 (B-088) evidence seed for chain_id=31337.
-- TT-9: requires tx_hash on Anvil matching executeResolution calldata (see tt-09 execution record);
--        event_log ResolutionExecuted row is inserted AFTER broadcast (see companion shell / http JSON notes).
-- TT-10: fee_router + Transfer + Staked overlay rows for StubShareToken + StubStaking addresses.

BEGIN;

-- --- TT-10: clear prior token-scoped rows for reproducible re-run ---
DELETE FROM investor_distribution_accrual_lines WHERE distribution_id IN (
  SELECT id FROM investor_distribution_accruals WHERE idempotency_key = 'tt10-b088-evidence-001'
);
DELETE FROM investor_distribution_accruals WHERE idempotency_key = 'tt10-b088-evidence-001';

DELETE FROM investor_share_transfer_events
WHERE chain_id = 31337 AND LOWER(token_address) = LOWER('0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9');

DELETE FROM investor_stake_state_events
WHERE chain_id = 31337 AND LOWER(staking_contract_address) = LOWER('0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0');

DELETE FROM fee_router_routed_events
WHERE chain_id = 31337 AND LOWER(token_address) = LOWER('0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9');

-- FeeRouter cash basis for StubShareToken (single row = total cash)
INSERT INTO fee_router_routed_events (
    chain_id, block_number, log_index, block_hash, tx_hash,
    router_address, token_address,
    amount_u256_hex, to_country_u256_hex, to_stakers_u256_hex, to_reserve_u256_hex, to_ops_u256_hex
) VALUES (
    31337, 50, 0,
    '0x' || repeat('ab', 32),
    '0x' || repeat('11', 32),
    '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    '0x0000000000000000000000000000000000000000000000000000000000002710',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000'
);

-- Transfers: mint 100 to deployer, then 40 to staking contract (pool on ERC20 ledger)
INSERT INTO investor_share_transfer_events (
    chain_id, block_number, log_index, block_hash, tx_hash, token_address, from_address, to_address, value_u256_hex
) VALUES
(
    31337, 60, 0, '',
    '0x' || repeat('22', 32),
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    '0x0000000000000000000000000000000000000000',
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x0000000000000000000000000000000000000000000000000000000000000064'
),
(
    31337, 61, 0, '',
    '0x' || repeat('33', 32),
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    '0x0000000000000000000000000000000000000000000000000000000000000028'
);

-- Stake overlay: return weight to user (same narrative as comp_b088)
INSERT INTO investor_stake_state_events (
    chain_id, block_number, log_index, block_hash, tx_hash,
    staking_contract_address, user_address, event_kind, amount_u256_hex
) VALUES (
    31337, 62, 0, '',
    '0x' || repeat('44', 32),
    '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    'Staked',
    '0x0000000000000000000000000000000000000000000000000000000000000028'
);

-- --- TT-9: order row for ResolutionExecuted replay ---
DELETE FROM itineraries WHERE order_id = '33333333-3333-4333-8333-333333333301'::uuid;
DELETE FROM orders WHERE id = '33333333-3333-4333-8333-333333333301'::uuid;

INSERT INTO orders (
    id, tourist_id, guide_id, amount, currency, status, escrow_address, chain_id, created_at, updated_at
) VALUES (
    '33333333-3333-4333-8333-333333333301',
    'e9a0feb8-0b83-4f9c-ab4d-a145be92ae71',
    '1600d3ec-dc44-426e-8098-b8be77765a58',
    '500.00',
    'USD',
    'escrowed',
    '0x000000000000000000000000000000000000dEaD',
    31337,
    now(),
    now()
);

INSERT INTO itineraries (order_id, version, destination, city, days_json, created_at, updated_at)
VALUES (
    '33333333-3333-4333-8333-333333333301',
    1,
    '中国',
    '上海',
    '[]'::jsonb,
    now(),
    now()
);

COMMIT;
