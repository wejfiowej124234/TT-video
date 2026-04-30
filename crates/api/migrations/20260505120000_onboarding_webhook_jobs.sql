-- 96-09 / 96-18：内网 webhook **先入队**（**`pending`**）再 **`apply_payment_webhook`**；**`dead`** 与 **`onboarding_webhook_dlq`** 互补。
CREATE TABLE IF NOT EXISTS onboarding_webhook_jobs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    status              TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'done', 'dead')),
    attempts            INT NOT NULL DEFAULT 0,
    last_error          TEXT,
    resolution          TEXT,
    payload             JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_onboarding_webhook_jobs_pending_created
    ON onboarding_webhook_jobs (created_at ASC)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_onboarding_webhook_jobs_status_created
    ON onboarding_webhook_jobs (status, created_at DESC);
