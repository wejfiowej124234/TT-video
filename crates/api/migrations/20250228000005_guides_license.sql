-- 向导证/资格证可选字段（C2 企业级审计，待产品决策；04/申请向导-行业标准）
ALTER TABLE guides ADD COLUMN IF NOT EXISTS guide_license_url TEXT;
