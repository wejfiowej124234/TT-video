-- Auth per-email send window events (distributed rate limit across replicas)
CREATE TABLE IF NOT EXISTS auth_email_send_window_events (
    id BIGSERIAL PRIMARY KEY,
    bucket TEXT NOT NULL,
    email_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_email_send_window_events_bucket_email_created_at
    ON auth_email_send_window_events (bucket, email_key, created_at DESC);

