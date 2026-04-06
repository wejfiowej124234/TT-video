-- 350 Admin 生命周期状态机登记基线（04 §3.5、14）；异常检测与链对齐仍以校验器阶段为准。

CREATE TABLE IF NOT EXISTS lifecycle_state_machines (
    machine_code TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1',
    entity_type TEXT NOT NULL,
    current_state TEXT NOT NULL,
    expected_state TEXT,
    anomaly_flag BOOLEAN NOT NULL DEFAULT false,
    anomaly_type TEXT,
    last_transition_at TIMESTAMPTZ,
    source_of_truth TEXT NOT NULL,
    repairable BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_state_machines_domain ON lifecycle_state_machines(domain);

INSERT INTO lifecycle_state_machines (
    machine_code,
    domain,
    version,
    entity_type,
    current_state,
    expected_state,
    anomaly_flag,
    anomaly_type,
    last_transition_at,
    source_of_truth,
    repairable
) VALUES
    (
        'order.core',
        'order',
        '1',
        'order',
        'ledger_placeholder',
        'ledger_placeholder',
        false,
        NULL,
        NULL,
        'db_projection',
        true
    ),
    (
        'escrow.core',
        'escrow',
        '1',
        'escrow',
        'ledger_placeholder',
        'ledger_placeholder',
        false,
        NULL,
        NULL,
        'chain_projection',
        true
    ),
    (
        'dispute.core',
        'dispute',
        '1',
        'dispute',
        'ledger_placeholder',
        'ledger_placeholder',
        false,
        NULL,
        NULL,
        'db_projection',
        true
    ),
    (
        'itinerary.core',
        'itinerary',
        '1',
        'itinerary',
        'ledger_placeholder',
        'ledger_placeholder',
        false,
        NULL,
        NULL,
        'db_projection',
        true
    ),
    (
        'guide_slot.core',
        'guide_slot',
        '1',
        'guide_slot',
        'ledger_placeholder',
        'ledger_placeholder',
        false,
        NULL,
        NULL,
        'db_projection',
        true
    )
ON CONFLICT (machine_code) DO NOTHING;
