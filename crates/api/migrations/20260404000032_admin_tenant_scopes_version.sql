-- Optimistic locking for tenant scope publish (04 §3.5 POST …/tenants/scopes/:id/publish).

ALTER TABLE admin_tenant_scopes
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
