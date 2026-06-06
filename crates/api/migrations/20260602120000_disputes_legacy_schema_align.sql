-- TT-DISPUTES-LEGACY-SCHEMA-ALIGN-001
-- 与 migrations/002_phase2_business.sql 先建的 disputes 表对齐 api 读路径：
-- GET /api/v1/disputes/:id 需要 arb_fee_paid、dispute_sequence，且 evidence_hashes 须可解码为 JSONB。

ALTER TABLE disputes ADD COLUMN IF NOT EXISTS arb_fee_paid TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS dispute_sequence INT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'disputes'
      AND column_name = 'evidence_hashes'
      AND udt_name = '_text'
  ) THEN
    ALTER TABLE disputes
      ALTER COLUMN evidence_hashes TYPE JSONB
      USING COALESCE(to_jsonb(evidence_hashes), '[]'::jsonb);
  END IF;
END $$;
