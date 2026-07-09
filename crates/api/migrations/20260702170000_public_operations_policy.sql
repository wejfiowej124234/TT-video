-- F-OO-13 · Public Operations test/display policy singleton (SSOT-PUB-OPS O9)

CREATE TABLE IF NOT EXISTS ops_public_operations_policy (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    show_test_data BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_origins TEXT[] NOT NULL DEFAULT ARRAY['SMOKE']::TEXT[],
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NULL
);

INSERT INTO ops_public_operations_policy (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
