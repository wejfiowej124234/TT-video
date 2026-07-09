# ② staging 环境摘要（B-01 · PH-1 后勾主表）

| 项 | 值 |
|----|-----|
| Fly API app | `tt-api-staging` → `https://tt-api-staging.fly.dev`（部署后确认） |
| Fly FE app | `tt-web-staging` → `https://tt-web-staging.fly.dev`（待 `fly launch`） |
| DB | Fly Postgres 或 Neon/Supabase（**≠** 本地 ① `DATABASE_URL`） |
| Stripe | **test mode**；webhook → `https://tt-api-staging.fly.dev/api/v1/hooks/stripe/onboarding` |
| 回调 | 公网 HTTPS（B-04） |
