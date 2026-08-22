-- Escrow Bilateral Settlement · Layer A
-- service_* = trip/service completion (orthogonal to tourist_/guide_ pre-pay bilateral)
-- sub_status: service_completion_pending | service_completion_confirmed

ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_tourist_confirmed BOOLEAN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_guide_confirmed BOOLEAN;
