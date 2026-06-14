-- P1 · 向导公开展示字段：时薪 · 市场头像（与 GET/PATCH /api/v1/me/guide-profile 同源）
ALTER TABLE guides ADD COLUMN IF NOT EXISTS hourly_rate TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS avatar_url TEXT;
