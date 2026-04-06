-- 340 Admin API 版本登记基线（04 §3.5、14）；客户端用量字段为占位，后续接聚合/观测。

CREATE TABLE IF NOT EXISTS api_versions (
    api_version TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    released_at TIMESTAMPTZ,
    deprecated_at TIMESTAMPTZ,
    sunset_at TIMESTAMPTZ,
    compat_window_days INT NOT NULL DEFAULT 0,
    active_client_ratio_7d DOUBLE PRECISION,
    request_count_7d BIGINT NOT NULL DEFAULT 0,
    last_change_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_change_by TEXT,
    CONSTRAINT api_versions_status_check CHECK (status IN (
        'planned', 'active', 'deprecated', 'sunset'
    ))
);

CREATE INDEX IF NOT EXISTS idx_api_versions_status ON api_versions(status);

INSERT INTO api_versions (
    api_version,
    status,
    released_at,
    compat_window_days,
    active_client_ratio_7d,
    request_count_7d,
    last_change_by
) VALUES (
    'v1',
    'active',
    now(),
    90,
    NULL,
    0,
    'seed'
)
ON CONFLICT (api_version) DO NOTHING;
