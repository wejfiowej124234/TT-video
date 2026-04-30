-- 96-09 / 96-18：DLQ 行经 worker **可选自动回灌** **`onboarding_webhook_jobs`** 后打 **`replayed_at`**，保留原 **`error_message`/`raw_body`** 备审计（**不** `DELETE` DLQ）。
ALTER TABLE onboarding_webhook_dlq
    ADD COLUMN IF NOT EXISTS replayed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_onboarding_webhook_dlq_replay_pending
    ON onboarding_webhook_dlq (id)
    WHERE replayed_at IS NULL;
