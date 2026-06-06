-- PD-009: admin/risk suspension window for acquisition publish (① local).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS acquisition_publish_suspended_until TIMESTAMPTZ;

COMMENT ON COLUMN users.acquisition_publish_suspended_until IS
  'PD-009: acquisition publish suspended until this instant; NULL = not suspended.';
