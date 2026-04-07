-- TT-9: append `ResolutionExecuted` row after Anvil tx with executeResolution(300,650,50) input.
-- Tx / block must exist on RPC (see `rpc-tt9-eth-getTransactionByHash-resolution-input.json`).
-- Order UUID tail in topic1: 33333333-3333-4333-8333-333333333301

DELETE FROM event_log
WHERE chain_id = 31337 AND block_number = 6 AND log_index = 0;

INSERT INTO event_log (
    chain_id, block_number, block_hash, tx_hash, log_index, event_type, payload, finality_n_used
) VALUES (
    31337,
    6,
    decode('83391671a06764feb9bbe231ebe7cc6144a44ecf1115f1768488543de731c625', 'hex'),
    decode('11841400150ad0a9668a50652dca2d91c953ee50e230a601a6c1de777b2cb75c', 'hex'),
    0,
    'ResolutionExecuted',
    '{"topics": ["0xa949f41bab2004ac49e8ba0b9424e12fbb92c3da7ea7e57a64e7570e81e0c35a", "0x0000000000000000000000000000000033333333333343338333333333333301"]}'::jsonb,
    12
);
