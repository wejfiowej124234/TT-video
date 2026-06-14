-- P3 · 向导市场挂牌展示名（与 users.nickname 分轨；空则前端 `{city} 向导`）
ALTER TABLE guides ADD COLUMN IF NOT EXISTS public_title TEXT;
