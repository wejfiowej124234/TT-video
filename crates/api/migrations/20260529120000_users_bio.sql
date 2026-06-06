-- 用户个人简介（与 GET/PUT /api/v1/me 的 `user.bio` 对齐；可空，与 chain_off hydrate 一致）
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
